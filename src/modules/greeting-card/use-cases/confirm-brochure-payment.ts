import type { TenantContext } from "@/core/tenancy"
import { unprocessable } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { loadPublicSession } from "./brochure-session-access"

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

export async function adminConfirmBrochurePayment(
  ctx: TenantContext,
  orderId: string,
  input: {
    reference?: string | null | undefined
    note?: string | null | undefined
  } = {},
  repo = new BrochureOrderRepository()
) {
  return repo.confirmPaymentTransaction(ctx, orderId, input)
}
