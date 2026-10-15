import type { TenantContext } from "@/core/tenancy"
import { conflict, notFound, validationFailed } from "@/core/http/errors"
import { mediaSelectionError } from "../domain/media-limits"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { coordinatorAcceptanceBlocker, coordinatorActionBlocker, type CoordinatorAction } from "../domain/brochure-commerce-rules"
import { paymentGateBlocker, parsePaymentPolicy } from "../domain/brochure-payment-policy"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { queueOrderNotification } from "./notify-customer"
import {
  DELIVERY_FAILURE_LABEL, deliveryFailureError, parseRedeliveryFee, redeliveryFeeFor, type DeliveryFailureReason,
} from "../domain/delivery-failure"
import { DeliveryFailureRepository } from "../infra/delivery-failure-repository"
import { orderPhotoApproval, photoApprovalDispatchBlocker } from "../domain/photo-approval"
import { BrochurePaymentRepository } from "../infra/brochure-payment-repository"
import { CancellationRepository } from "../infra/cancellation-repository"
import { coordinatorConfirmDepositPayment } from "./confirm-brochure-payment"
import { canBypassDeliveryPhoto, canBypassFinishedPhoto, canRoleApproveDeposit, isUrgentOrder, parseBrochureWorkflowPolicy } from "../domain/brochure-workflow-policy"

/** Đơn của tổ chức + kiểm đúng thứ tự tác vụ xưởng (409 nếu sai bước). */
async function loadForAction(
  ctx: TenantContext,
  orderId: string,
  action: CoordinatorAction,
  repo: BrochureOrderRepository
) {
  const order = await repo.findBrochureOrder(ctx, orderId)
  if (!order) throw notFound()
  // Chính sách thu tiền và kiểm định ảnh của tiệm
  const shop = await new GreetingCardRepository().getShopProfile(ctx.organizationId)
  const policy = parsePaymentPolicy(shop.settings)
  const blocker = coordinatorActionBlocker(
    action,
    {
      status: order.status,
      productionStatus: order.production_status,
      deliveryStatus: order.delivery_status,
    },
    { skipPhoto: policy.requireProductPhotoQC === false }
  )
  if (blocker) throw conflict(blocker)
  const moneyBlocker = paymentGateBlocker(action, policy, {
    totalVnd: Number(order.total_vnd),
    paidVnd: Number(order.paid_vnd),
  })
  if (moneyBlocker) throw conflict(moneyBlocker)
  if (action === "dispatch-shipping") {
    const approval = orderPhotoApproval(order, shop.settings, policy.productPhotoReviewMinutes, new Date())
    const waiting = photoApprovalDispatchBlocker(approval)
    if (waiting) throw conflict(waiting)
  }
  return order
}


/** Gói Nghiêm ngặt bắt buộc ảnh — gọi thẳng API bỏ qua ảnh cũng bị chặn (PO 15/10/2026). */
async function assertSkipAllowed(ctx: TenantContext, kind: "product" | "recipient") {
  const workflow = parseBrochureWorkflowPolicy((await new GreetingCardRepository().getShopProfile(ctx.organizationId)).settings)
  const allowed = kind === "product" ? canBypassFinishedPhoto(workflow) : canBypassDeliveryPhoto(workflow)
  if (!allowed) throw conflict(kind === "product" ? "Tiệm bắt buộc ảnh thành phẩm — không bỏ qua được" : "Tiệm bắt buộc ảnh bàn giao — không bỏ qua được")
}

/** Đầu vào ảnh: `assetIds` (1–5 ảnh + 0–2 video) hoặc `assetId` (client cũ, một ảnh), hoặc bỏ qua nếu giao gấp. */
export type PhotoInput = {
  assetId?: string | undefined
  assetIds?: string[] | undefined
  skipPhoto?: boolean | undefined
  skipReason?: string | undefined
}

/**
 * Mọi asset phải thuộc đúng tổ chức (khác → 404) và bộ tệp đúng giới hạn ảnh/video.
 * Thời lượng video do trình duyệt kiểm; máy chủ kiểm loại, số lượng, dung lượng.
 */
async function ownedMediaIds(ctx: TenantContext, input: PhotoInput, repo: BrochureOrderRepository): Promise<string[]> {
  const ids = [...new Set(input.assetIds ?? (input.assetId ? [input.assetId] : []))]
  if (ids.length === 0) throw validationFailed({ assetIds: "Cần ít nhất 1 ảnh" })
  const meta = await repo.ownedAssetsMeta(ctx, ids)
  if (meta.length !== ids.length) throw notFound()
  const error = mediaSelectionError(meta.map((m) => ({ mimeType: m.mime_type, sizeBytes: m.file_size })))
  if (error) throw validationFailed({ assetIds: error })
  return ids
}

export async function assignBrochureFlorist(
  ctx: TenantContext,
  orderId: string,
  input: { floristNote: string },
  repo = new BrochureOrderRepository()
) {
  const order = await loadForAction(ctx, orderId, "assign-florist", repo)
  return repo.applyProgress(ctx, order, {
    eventType: "FLORIST_ASSIGNED",
    productionStatus: "ARRANGING",
    noteAppend: `[Florist] ${input.floristNote.trim()}`,
  })
}

export async function uploadBrochureProductPhoto(
  ctx: TenantContext,
  orderId: string,
  input: PhotoInput,
  repo = new BrochureOrderRepository()
) {
  const order = await loadForAction(ctx, orderId, "product-photo", repo)
  if (input.skipPhoto) {
    await assertSkipAllowed(ctx, "product")
    const result = await repo.applyProgress(ctx, order, {
      eventType: "PRODUCT_PHOTO_SKIPPED",
      productionStatus: "READY",
      noteAppend: `[Bỏ qua ảnh thành phẩm] ${input.skipReason?.trim() || "Giao gấp theo yêu cầu"}`,
    })
    queueOrderNotification(ctx.organizationId, order.id, "READY")
    return result
  }
  const assetIds = await ownedMediaIds(ctx, input, repo)
  const result = await repo.applyProgress(ctx, order, {
    eventType: "PRODUCT_PHOTO_UPLOADED",
    productionStatus: "READY",
    qcAssetIds: assetIds,
  })
  queueOrderNotification(ctx.organizationId, order.id, "READY")
  return result
}

export async function dispatchBrochureShipping(
  ctx: TenantContext,
  orderId: string,
  input: { trackingNote: string },
  repo = new BrochureOrderRepository()
) {
  const order = await loadForAction(ctx, orderId, "dispatch-shipping", repo)
  const result = await repo.applyProgress(ctx, order, {
    eventType: "SHIPPING_DISPATCHED",
    deliveryStatus: "DELIVERING",
    noteAppend: `[Ship] ${input.trackingNote.trim()}`,
  })
  queueOrderNotification(ctx.organizationId, order.id, "DISPATCHED")
  return result
}

export async function uploadBrochureRecipientPhoto(
  ctx: TenantContext,
  orderId: string,
  input: PhotoInput,
  repo = new BrochureOrderRepository()
) {
  const order = await loadForAction(ctx, orderId, "recipient-photo", repo)
  if (input.skipPhoto) {
    await assertSkipAllowed(ctx, "recipient")
    const result = await repo.applyProgress(ctx, order, {
      eventType: "RECIPIENT_PHOTO_SKIPPED",
      deliveryStatus: "DELIVERED",
      orderStatus: "COMPLETED",
      noteAppend: `[Bỏ qua ảnh bàn giao] ${input.skipReason?.trim() || "Khách nhận trực tiếp / Giao gấp"}`,
    })
    queueOrderNotification(ctx.organizationId, order.id, "DELIVERED")
    return result
  }
  const assetIds = await ownedMediaIds(ctx, input, repo)
  const result = await repo.applyProgress(ctx, order, {
    eventType: "RECIPIENT_PHOTO_UPLOADED",
    deliveryStatus: "DELIVERED",
    orderStatus: "COMPLETED",
    qcAssetIds: assetIds,
  })
  queueOrderNotification(ctx.organizationId, order.id, "DELIVERED")
  return result
}

/**
 * Shipper không giao được: ghi lý do, đơn sang "giao không thành công" (khách được đổi giờ/địa chỉ
 * trên trang theo dõi), tính phí giao lại nếu tiệm cài và Điều phối chọn tính. Giao ship lại như thường.
 */
export async function markBrochureDeliveryFailed(
  ctx: TenantContext,
  orderId: string,
  input: { reason: DeliveryFailureReason; note?: string | undefined; chargeFee?: boolean | undefined },
  repo = new BrochureOrderRepository(),
) {
  const error = deliveryFailureError(input)
  if (error) throw validationFailed({ note: error })
  const order = await loadForAction(ctx, orderId, "delivery-failed", repo)
  const shop = await new GreetingCardRepository().getShopProfile(ctx.organizationId)
  const feeVnd = redeliveryFeeFor({ chargeFee: input.chargeFee === true, configuredFeeVnd: parseRedeliveryFee(shop.settings), totalVnd: Number(order.total_vnd) })
  const result = await new DeliveryFailureRepository().recordFailure(ctx, order, {
    failure: {
      at: new Date().toISOString(), reason: input.reason, reasonLabel: DELIVERY_FAILURE_LABEL[input.reason],
      note: input.note?.trim() || null, feeVnd, by: ctx.userId,
    },
    feeVnd,
  })
  queueOrderNotification(ctx.organizationId, order.id, "DELIVERY_FAILED")
  return result
}

/**
 * Điều phối thẩm định và xác nhận TIẾP NHẬN đơn hàng.
 * Đổi trạng thái xưởng sang ASSIGNED/ARRANGING, ghi chú tiếp nhận và gửi thông báo cho khách.
 */
export async function coordinatorAcceptBrochureOrder(
  ctx: TenantContext,
  orderId: string,
  input: { note?: string | undefined } = {},
  repo = new BrochureOrderRepository(),
  shops = new GreetingCardRepository()
) {
  const order = await repo.findBrochureOrder(ctx, orderId)
  if (!order) throw notFound()
  // Cùng luật với nút trên giao diện: đơn đã huỷ/đã giao/đã tiếp nhận/đã vào sản xuất, hoặc chưa có
  // thông tin chuyển khoản nào → không tiếp nhận (gọi thẳng API cũng bị chặn)
  const acceptBlocker = coordinatorAcceptanceBlocker(
    { status: order.status, productionStatus: order.production_status, deliveryStatus: order.delivery_status },
    { paidVnd: Number(order.paid_vnd), paymentProofUrl: order.greeting_sessions?.[0]?.payment_proof_asset_id ?? null }
  )
  if (acceptBlocker) throw conflict(acceptBlocker)

  // Nếu đơn chưa ghi nhận tiền cọc mà khách đã có bill hoặc báo chuyển khoản:
  // Tự động phê duyệt tiền cọc tương đương với sự phê duyệt của Điều hành!
  const paid = Number(order.paid_vnd)
  const total = Number(order.total_vnd)
  const session = order.greeting_sessions?.[0]
  const hasProofOrReported = Boolean(session?.payment_proof_asset_id || session?.status === "PAYMENT_REPORTED")

  // Ghi nhận cọc thay Điều hành chỉ khi chính sách tiệm cho Điều phối duyệt cọc (như /confirm-deposit)
  const shop = await shops.getShopProfile(ctx.organizationId)
  const deliveryWindow = order.delivery_window as { date?: string; timeSlot?: string } | null
  const minutesWaiting = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60_000)
  const workflow = parseBrochureWorkflowPolicy(shop.settings)
  const mayConfirmDeposit = canRoleApproveDeposit("COORDINATOR", workflow, {
    isUrgent: isUrgentOrder({ deliveryDate: deliveryWindow?.date, deliveryTimeSlot: deliveryWindow?.timeSlot }),
    isOverdueSla: minutesWaiting >= workflow.slaEscalationMinutes,
  })
  let paidNow = paid
  if (paid <= 0 && total > 0 && hasProofOrReported && mayConfirmDeposit) {
    paidNow = (await coordinatorConfirmDepositPayment(ctx, orderId, { note: input.note })).paidVnd
  }
  // Cùng chốt tiền như khi gán thợ: tiệm bắt thu trước khi cắm mà chưa thu → chưa được tiếp nhận
  const moneyBlocker = paymentGateBlocker("assign-florist", parsePaymentPolicy(shop.settings), { totalVnd: total, paidVnd: paidNow })
  if (moneyBlocker) throw conflict(`${moneyBlocker}. Chờ Điều hành xác nhận tiền cọc rồi tiếp nhận đơn.`)

  const result = await repo.applyProgress(ctx, order, {
    eventType: "COORDINATOR_ACCEPTED",
    productionStatus: "ASSIGNED",
    orderStatus: order.status === "DRAFT" ? "CONFIRMED" : order.status,
    noteAppend: `[Điều phối tiếp nhận] ${input.note?.trim() || "Xác nhận xưởng nhận đơn"}`,
  })
  queueOrderNotification(ctx.organizationId, order.id, "ORDER_ACCEPTED")
  return result
}

/**
 * Điều phối THẨM ĐỊNH VÀ TỪ CHỐI đơn hàng (do hết hoa, quá tải, ngoài giờ/khu vực giao).
 * Huỷ đơn, ghi nhận lý do từ chối và kích hoạt quy trình hoàn tiền 100% cho khách hàng.
 */
export async function coordinatorRejectBrochureOrder(
  ctx: TenantContext,
  orderId: string,
  input: { reason: string },
  cancellationRepo = new CancellationRepository(),
  repo = new BrochureOrderRepository()
) {
  const order = await repo.findBrochureOrder(ctx, orderId)
  if (!order) throw notFound()
  if (order.status === "CANCELLED") throw conflict("Đơn hàng đã được huỷ trước đó")
  const reasonText = input.reason?.trim() || "Điều phối từ chối nhận đơn (quá tải hoặc không đáp ứng mẫu hoa)"
  // Bấm lặp / hai người cùng bấm → không tạo hai đề xuất huỷ cho một đơn
  if ((await cancellationRepo.listPending(ctx)).some((r) => r.order_id === orderId)) {
    throw conflict("Đơn này đã có đề xuất huỷ đang chờ Điều hành duyệt")
  }
  
  // Điều phối từ chối nhận đơn -> gửi Đề xuất Hủy & Hoàn tiền toàn phần lên Điều hành phê duyệt
  const result = await cancellationRepo.createProposal(ctx, {
    orderId,
    senderRole: "COORDINATOR",
    proposal: {
      type: Number(order.paid_vnd) > 0 ? "FULL_REFUND" : "CANCEL_ONLY",
      reason: `[Điều phối từ chối nhận đơn] ${reasonText}`,
      refundAmountVnd: Number(order.paid_vnd),
      note: "Điều phối xác định không thể cung ứng đơn hàng theo yêu cầu khách.",
    },
  })
  return {
    success: true,
    message: "Đã gửi yêu cầu từ chối nhận đơn và hoàn tiền tới Điều hành xét duyệt.",
    proposalId: result.id,
  }
}
