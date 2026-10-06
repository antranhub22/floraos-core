import type { TenantContext } from "@/core/tenancy"
import { notFound, unprocessable } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { BrochurePaymentRepository } from "../infra/brochure-payment-repository"
import { expectedPayment, parsePaymentPolicy } from "../domain/brochure-payment-policy"
import { loadPublicSession } from "./brochure-session-access"
import { queueOrderNotification } from "./notify-customer"
import { paymentNotifyEvent } from "../domain/customer-notifications"

/**
 * Khách bấm "Tôi đã chuyển khoản". Chỉ hợp lệ khi đã có đơn; gọi lại nhiều
 * lần không ghi thêm sự kiện; không kéo lùi phiên đã COMPLETED.
 */
export async function reportCustomerPayment(sendCode: string, repo = new GreetingCardRepository()) {
  const session = await loadPublicSession(sendCode, repo)
  if (!session.order_id) {
    throw unprocessable("Bạn cần hoàn tất đặt hoa trước khi báo chuyển khoản")
  }

  if (session.status === "ORDER_SUBMITTED") {
    await repo.updateSession(session.id, { status: "PAYMENT_REPORTED" })
    await repo.recordJourneyEvent(session.organization_id, session.id, "CLICK_PAID", {
      orderId: session.order_id,
      reportedAt: new Date().toISOString(),
    })
  }

  return { success: true, message: "Đã ghi nhận thông báo chuyển khoản của bạn" }
}

/**
 * Điều hành xác nhận đã nhận tiền. Không truyền số tiền → lấy đúng khoản
 * khách được yêu cầu chuyển (cọc theo chính sách tiệm, hoặc phần còn lại).
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
  let amountVnd = input.amountVnd
  if (amountVnd === undefined) {
    const order = await orders.findBrochureOrder(ctx, orderId)
    if (!order) throw notFound()
    const shop = await repo.getShopProfile(ctx.organizationId)
    amountVnd = expectedPayment(parsePaymentPolicy(shop.settings), Number(order.total_vnd), Number(order.paid_vnd)).amountVnd
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
  return payments.setQuote(ctx, orderId, totalVnd, reason?.trim() || null)
}
