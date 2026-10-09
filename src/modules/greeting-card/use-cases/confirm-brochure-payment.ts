import type { TenantContext } from "@/core/tenancy"
import { conflict, notFound, unprocessable } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { BrochurePaymentRepository } from "../infra/brochure-payment-repository"
import { expectedPayment, parsePaymentPolicy } from "../domain/brochure-payment-policy"
import { policyForOrder, readPaymentPlan } from "../domain/payment-plan"
import { depositAmountVnd } from "../domain/payment-schedule"
import { loadPublicSession } from "./brochure-session-access"
import { queueOrderNotification } from "./notify-customer"
import { paymentNotifyEvent } from "../domain/customer-notifications"
import { assertOrderInScope } from "./order-scope"

/**
 * Khách bấm "Tôi đã chuyển khoản". Chỉ hợp lệ khi đã có đơn; không kéo lùi phiên
 * đã COMPLETED. Lần báo đầu đổi phiên sang PAYMENT_REPORTED; đơn đã cọc còn nợ thì mỗi
 * lần báo ghi thêm sự kiện "chuyển phần còn lại".
 */
export async function reportCustomerPayment(sendCode: string, repo = new GreetingCardRepository()) {
  const session = await loadPublicSession(sendCode, repo)
  if (!session.order_id) {
    throw unprocessable("Bạn cần hoàn tất đặt hoa trước khi báo chuyển khoản")
  }

  const paid = Number(session.order?.paid_vnd ?? 0)
  const owing = Number(session.order?.total_vnd ?? 0) - paid
  if (session.status === "ORDER_SUBMITTED") {
    await repo.updateSession(session.id, { status: "PAYMENT_REPORTED" })
    await repo.recordJourneyEvent(session.organization_id, session.id, "CLICK_PAID", {
      orderId: session.order_id,
      reportedAt: new Date().toISOString(),
    })
  } else if (paid > 0 && owing > 0) {
    // Đã cọc, nay báo chuyển phần còn lại — cập nhật phiên sang PAYMENT_REPORTED để Điều hành nhận notification & duyệt
    await repo.updateSession(session.id, { status: "PAYMENT_REPORTED" })
    await repo.recordJourneyEvent(session.organization_id, session.id, "CLICK_PAID", {
      orderId: session.order_id,
      purpose: "BALANCE",
      reportedAt: new Date().toISOString(),
    })
  }

  return { success: true, message: "Đã ghi nhận thông báo chuyển khoản của bạn" }
}

/**
 * Điều hành xác nhận đã nhận tiền. Không truyền số tiền → lấy đúng khoản
 * khách được yêu cầu chuyển (cọc theo kế hoạch thanh toán của đơn, hoặc phần còn lại).
 * Đối với đơn đặt cọc, phần còn lại (Lần 2) bị chặn không cho thu sớm nếu chưa đủ điều kiện
 * VÀ khách chưa báo chuyển tiền (PO 10/10/2026).
 */
export async function adminConfirmBrochurePayment(
  ctx: TenantContext,
  orderId: string,
  input: {
    amountVnd?: number | undefined
    reference?: string | null | undefined
    note?: string | null | undefined
  } = {},
  payments = new BrochurePaymentRepository(),
  orders = new BrochureOrderRepository(),
  repo = new GreetingCardRepository()
) {
  await assertOrderInScope(ctx, orderId, orders)
  const order = await orders.findBrochureOrder(ctx, orderId)
  if (!order) throw notFound()
  const shop = await repo.getShopProfile(ctx.organizationId)
  const policy = policyForOrder(parsePaymentPolicy(shop.settings), order.pricing_rule_ref)
  const total = Number(order.total_vnd)
  const paid = Number(order.paid_vnd)

  const plan = readPaymentPlan(order.pricing_rule_ref)
  const pct = plan?.depositPercent ?? policy.depositPercent
  const deposit = depositAmountVnd(total, pct)
  const isDepositOrder = pct > 0 && deposit < total

  // Chặn thu lần 2 nếu đơn đặt cọc chưa đến bước được phép thu phần còn lại VÀ khách chưa báo chuyển tiền
  if (isDepositOrder && paid >= deposit && paid < total) {
    const orderWithSessions = order as { greeting_sessions?: Array<{ status: string }> }
    const isReported = orderWithSessions.greeting_sessions?.some((s) => s.status === "PAYMENT_REPORTED")

    if (!isReported) {
      if (policy.requireFullBeforeDispatch) {
        const isReady = order.production_status === "READY"
        if (!isReady) {
          throw conflict("Đơn hàng đã được ghi nhận tiền cọc. Phần còn lại chỉ được thu sau khi xưởng hoàn thành cắm hoa và khách xác nhận ảnh.")
        }
        const orderWithQc = order as { qc_records?: Array<{ notes: string | null; created_at: Date }> }
        const hasPhotoApproved = orderWithQc.qc_records?.some((qc) => qc.notes === "CUSTOMER_PHOTO_APPROVED")
        const productPhotoQc = orderWithQc.qc_records?.find((qc) => qc.notes === "PRODUCT_PHOTO_UPLOADED")
        const isAutoApproved = !!productPhotoQc && Date.now() >= productPhotoQc.created_at.getTime() + 10 * 60_000
        if (!hasPhotoApproved && !isAutoApproved) {
          throw conflict("Đơn hàng đang chờ khách duyệt ảnh thành phẩm trước khi giao. Chưa thể ghi nhận thanh toán lần 2.")
        }
      } else {
        if (order.delivery_status !== "DELIVERED") {
          throw conflict("Đơn hàng đã được ghi nhận tiền cọc. Theo chính sách của tiệm, phần còn lại sẽ thu sau khi giao hoa thành công.")
        }
      }
    }
  }

  let amountVnd = input.amountVnd
  if (amountVnd === undefined) {
    amountVnd = expectedPayment(policy, total, paid).amountVnd
  }
  const result = await payments.recordIncomingPayment(ctx, orderId, {
    amountVnd,
    method: "BANK_TRANSFER",
    reference: input.reference?.trim() || `BROCHURE-${orderId.slice(0, 8)}`,
    note: input.note?.trim() || "Xác nhận chuyển khoản qua Thẻ chào",
  })
  queueOrderNotification(ctx.organizationId, orderId, paymentNotifyEvent(result.balanceVnd))
  return result
}

export async function cancelBrochureOrder(
  ctx: TenantContext,
  orderId: string,
  reason: string,
  payments = new BrochurePaymentRepository()
) {
  await assertOrderInScope(ctx, orderId)
  const result = await payments.cancel(ctx, orderId, reason.trim())
  queueOrderNotification(ctx.organizationId, orderId, "CANCELLED")
  return result
}

export async function refundBrochureOrder(
  ctx: TenantContext,
  orderId: string,
  input: { amountVnd: number; reason: string },
  payments = new BrochurePaymentRepository()
) {
  await assertOrderInScope(ctx, orderId)
  return payments.refund(ctx, orderId, { amountVnd: input.amountVnd, reason: input.reason.trim() })
}

/** Cửa hàng báo giá cho đơn đặt mẫu chưa niêm yết giá; sau đó khách thấy mã QR thanh toán. */
export async function quoteBrochureOrder(
  ctx: TenantContext,
  orderId: string,
  totalVnd: number,
  reason?: string | undefined,
  payments = new BrochurePaymentRepository()
) {
  await assertOrderInScope(ctx, orderId)
  const result = await payments.setQuote(ctx, orderId, totalVnd, reason?.trim() || null)
  // Báo khách đơn đã có giá — kèm link theo dõi để mở QR thanh toán
  queueOrderNotification(ctx.organizationId, orderId, "QUOTED")
  return result
}
