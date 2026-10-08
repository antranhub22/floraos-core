import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { mapOrderStatusToTrackingStep } from "../domain/greeting-card-rules"
import { areaOnly, maskPersonName, phoneLast4Matches } from "../domain/tracking-privacy"
import type { ProductSnapshot } from "../domain/greeting-card-types"
import { parseStepSla, calculateExpectedStepTimeline } from "../domain/step-sla"
import { parseShippingConfig } from "../domain/brochure-pricing"
import { snapshotFromOrder } from "../domain/order-change-request"
import { customerChangeSection } from "./order-change"
import { latestFailureForCustomer } from "../domain/delivery-failure"
import { parsePaymentPolicy } from "../domain/brochure-payment-policy"
import { orderPaymentSummary } from "../domain/payment-summary"
import { paymentInstructionsFor } from "./payment-instructions"

const ORDER_CODE_REGEX = /^[A-Z0-9-]{4,40}$/

/** Cách người xem chứng minh mình là khách: mở từ chính link của đơn, hoặc nhập 4 số cuối SĐT người đặt. */
export interface TrackingProof {
  sendCode?: string | null | undefined
  phoneLast4?: string | null | undefined
}

/**
 * Trang theo dõi công khai theo mã đơn. Chỉ đơn nguồn Thẻ chào; không bao giờ trả SĐT.
 * Mã đơn nằm trong nội dung chuyển khoản nên ai cũng có thể biết — mặc định chỉ trả thông tin
 * rút gọn (tên người nhận viết tắt, phường + tỉnh, không lời nhắn thiệp); có `proof` hợp lệ mới
 * trả đầy đủ (PO 06/10/2026).
 */
export async function getBrochureTracking(
  orderCode: string,
  proof: TrackingProof = {},
  orders = new BrochureOrderRepository(),
  repo = new GreetingCardRepository()
) {
  const code = orderCode.trim().toUpperCase()
  if (!ORDER_CODE_REGEX.test(code)) return { status: "NOT_FOUND" as const }

  const order = await orders.getTrackingOrderByCode(code)
  if (!order) return { status: "NOT_FOUND" as const }

  const linkCode = proof.sendCode?.trim().toUpperCase()
  const verified =
    (!!linkCode && order.greeting_sessions.some((s) => s.send_code === linkCode)) ||
    (!!proof.phoneLast4 && phoneLast4Matches(order.customer?.phone, proof.phoneLast4.trim()))

  const step = mapOrderStatusToTrackingStep(order.status, order.production_status, order.delivery_status)

  const firstItem = order.items[0]
  const snapshot = (firstItem?.metadata as unknown as ProductSnapshot | null) ?? null

  // Ảnh thành phẩm và ảnh người nhận là HAI mục riêng — ảnh người nhận không đè ảnh thành phẩm.
  // Mỗi bản ghi QC ghi loại ảnh ở `notes`; chỉ ký asset của đúng tổ chức sở hữu đơn.
  const idsOf = (kind: string) =>
    order.qc_records
      .filter((qc) => qc.notes === kind)
      .flatMap((qc) => (Array.isArray(qc.image_asset_ids) ? qc.image_asset_ids : []))
      .filter((id): id is string => typeof id === "string")
  const productIds = idsOf("PRODUCT_PHOTO_UPLOADED")
  // Ảnh người nhận là ảnh của một người cụ thể — chỉ hiện khi đã xác minh
  const recipientIds = verified ? idsOf("RECIPIENT_PHOTO_UPLOADED") : []
  const urls = await repo.getAssetsStorageMap(order.organization_id, [...productIds, ...recipientIds])
  const toUrls = (ids: string[]) => ids.map((id) => urls.get(id)).filter((u): u is string => Boolean(u))
  const productPhotoUrls = toUrls(productIds)
  const recipientPhotoUrls = toUrls(recipientIds)

  const address = (order.delivery_address as { recipientName?: string; street?: string; parts?: { ward?: string; province?: string } } | null) || {}
  const deliveryWindow = (order.delivery_window as Record<string, string> | null) || {}

  // SPEC #3: Customer Approval cho ảnh sản phẩm hoàn thiện
  const productPhotoQc = order.qc_records.find((qc) => qc.notes === "PRODUCT_PHOTO_UPLOADED")
  const customerApprovedQc = order.qc_records.find((qc) => qc.notes === "CUSTOMER_PHOTO_APPROVED")

  // Countdown cấu hình trong Collection Settings (mặc định 10 phút)
  const sessionWithCatalog = order.greeting_sessions.find((s) => s.catalog?.filters)
  const catalogFilters = sessionWithCatalog?.catalog?.filters as Record<string, unknown> | null | undefined
  const appliedPolicies = catalogFilters?.appliedPolicies as { photoApprovalCountdownMinutes?: number } | undefined
  const countdownMinutes = appliedPolicies?.photoApprovalCountdownMinutes ?? 10

  let photoApproval: {
    status: "NONE" | "PENDING" | "APPROVED" | "AUTO_APPROVED"
    uploadedAt: string | null
    countdownMinutes: number
    approvedAt: string | null
  } = {
    status: "NONE",
    uploadedAt: null,
    countdownMinutes,
    approvedAt: null,
  }

  if (productPhotoQc && productPhotoUrls.length > 0) {
    const uploadedAt = productPhotoQc.created_at
    const uploadedTime = uploadedAt.getTime()
    const now = Date.now()
    const isExpired = now >= uploadedTime + countdownMinutes * 60_000

    if (customerApprovedQc) {
      photoApproval = {
        status: "APPROVED",
        uploadedAt: uploadedAt.toISOString(),
        countdownMinutes,
        approvedAt: customerApprovedQc.created_at.toISOString(),
      }
    } else if (isExpired) {
      photoApproval = {
        status: "AUTO_APPROVED",
        uploadedAt: uploadedAt.toISOString(),
        countdownMinutes,
        approvedAt: new Date(uploadedTime + countdownMinutes * 60_000).toISOString(),
      }
    } else {
      photoApproval = {
        status: "PENDING",
        uploadedAt: uploadedAt.toISOString(),
        countdownMinutes,
        approvedAt: null,
      }
    }
  }

  const orgSettings = (order as { organization?: { settings?: unknown } }).organization?.settings
  const slaConfig = parseStepSla(orgSettings)
  const timeline = calculateExpectedStepTimeline(deliveryWindow.date, deliveryWindow.timeSlot, slaConfig)
  const money = { totalVnd: Number(order.total_vnd), paidVnd: Number(order.paid_vnd), pricingRuleRef: order.pricing_rule_ref }
  const payment = orderPaymentSummary(
    { ...money, status: order.status, productionStatus: order.production_status, deliveryStatus: order.delivery_status },
    parsePaymentPolicy(orgSettings).depositPercent,
    { reported: money.paidVnd === 0 && order.greeting_sessions.some((s) => s.status === "PAYMENT_REPORTED") },
  )

  return {
    status: "FOUND" as const,
    order: {
      code: order.code,
      status: order.status,
      productionStatus: order.production_status,
      deliveryStatus: order.delivery_status,
      totalVnd: Number(order.total_vnd),
      paidVnd: Number(order.paid_vnd),
      balanceVnd: Number(order.balance_vnd),
      /** `false` = đang xem bản rút gọn; nhập 4 số cuối SĐT người đặt để xem đầy đủ. */
      verified,
      cardMessage: verified ? order.card_message : null,
      recipientName: verified ? address.recipientName || "Khách nhận" : maskPersonName(address.recipientName),
      deliveryAddress: verified ? address.street || "" : areaOnly(address),
      deliveryDate: deliveryWindow.date || null,
      deliveryTimeSlot: deliveryWindow.timeSlot || null,
      productSnapshot: snapshot,
      /** Giữ cho client cũ: ảnh thành phẩm mới nhất */
      finishedImageUrl: productPhotoUrls[0] ?? null,
      productPhotoUrls,
      recipientPhotoUrls,
      photoApproval,
      createdAt: order.created_at.toISOString(),
      updatedAt: order.updated_at.toISOString(),
      timeline,
      /** Kế hoạch + các đợt thanh toán; khi hoa đã xong mà còn nợ: mã QR trả phần còn lại. */
      payment: {
        ...payment,
        balanceInstructions: payment.balanceDue ? paymentInstructionsFor(orgSettings, money, order.code) : null,
      },
      /** Lần giao gần nhất không thành công (ghi chú của shipper chỉ cho người đặt đã xác minh). */
      deliveryFailure: order.delivery_status === "FAILED" ? latestFailureForCustomer(order.delivery_window, verified) : null,
      /** Chỉ người đặt đã xác minh: đổi thông tin đơn (thông tin hiện tại để điền sẵn form + lịch sử yêu cầu). */
      change: verified
        // Không trả SĐT (luật của trang theo dõi): ô SĐT người nhận để trống = giữ nguyên số cũ
        ? { current: { ...snapshotFromOrder(order), recipientPhone: "" }, shipping: parseShippingConfig(orgSettings), ...(await customerChangeSection(order)) }
        : null,
    },
    // Huỷ vì hết hạn thanh toán: báo "không hoàn thành" thay cho "cửa hàng đã huỷ"
    trackingStep: payment.status === "PAYMENT_FAILED"
      ? { ...step, title: "Đơn hàng không hoàn thành", description: "Chưa nhận được thanh toán trong thời hạn nên đơn đã tự huỷ." }
      : step,
  }
}
