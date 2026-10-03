import type { TenantContext } from "@/core/tenancy"
import { GreetingCardRepository } from "../infra/greeting-card-repository"

export async function reportCustomerPayment(
  sendCode: string,
  repo = new GreetingCardRepository()
) {
  const session = await repo.getPublicSessionBySendCode(sendCode)
  if (!session) {
    throw new Error("Không tìm thấy phiên Thẻ chào tương ứng")
  }

  await repo.updateSession(session.id, {
    status: "PAYMENT_REPORTED",
  })

  await repo.recordJourneyEvent(session.organization_id, session.id, "CLICK_PAID", {
    orderId: session.order_id,
    reportedAt: new Date().toISOString(),
  })

  return { success: true, message: "Đã ghi nhận thông báo chuyển khoản của bạn" }
}

export async function adminConfirmBrochurePayment(
  ctx: TenantContext,
  orderId: string,
  input: {
    reference?: string | null | undefined
    note?: string | null | undefined
  } = {},
  repo = new GreetingCardRepository()
) {
  return repo.confirmPaymentTransaction(ctx, orderId, input)
}

