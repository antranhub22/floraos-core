import type { TenantContext } from "@/core/tenancy"
import { notFound, conflict } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { rejectablePayment, withPaymentRejectedAt } from "../domain/payment-rejection"
import { queueOrderNotification } from "./notify-customer"
import { assertOrderInScope } from "./order-scope"

/**
 * Điều hành cảnh báo "Chưa nhận được tiền": khách đã gửi bill / báo chuyển khoản nhưng tiền
 * không về (bill sai, chuyển thiếu…). Bỏ trạng thái báo chuyển khoản + ảnh bill của đúng lần đó để
 * trang khách quay về chờ thanh toán (hiện lại mã QR), ghi lịch sử đơn và nhắc khách (PO 15/10/2026).
 * - Lần 1 (sổ thu 0 đ): ghi mốc từ chối → khách có thêm MỘT hạn thanh toán mới đủ số phút cấu hình,
 *   tính từ lúc này (bộ quét không huỷ đơn ngay vì hạn gốc đã qua — PO 17/10/2026).
 * - Lần 2 (đơn đã cọc, còn nợ): bỏ ảnh bill phần còn lại; phiên về ORDER_SUBMITTED như sau khi thu cọc.
 */
export async function rejectReportedPayment(
  ctx: TenantContext,
  orderId: string,
  input: { reason?: string | null | undefined } = {},
  orders = new BrochureOrderRepository(),
  repo = new GreetingCardRepository(),
  now: Date = new Date()
) {
  await assertOrderInScope(ctx, orderId, orders)
  const order = await orders.findBrochureOrder(ctx, orderId)
  if (!order) throw notFound()
  // Phiên đọc kèm đơn đã lọc theo tổ chức (cùng cách Điều phối tiếp nhận đơn)
  const session = order.greeting_sessions[0]
  const decision = rejectablePayment({
    status: order.status,
    totalVnd: Number(order.total_vnd),
    paidVnd: Number(order.paid_vnd),
    sessionStatus: session?.status ?? null,
    hasFirstProof: Boolean(session?.payment_proof_asset_id),
    hasBalanceProof: Boolean(session?.payment_proof_balance_asset_id),
  })
  if ("blocker" in decision || !session) {
    throw conflict("blocker" in decision ? decision.blocker : "Khách chưa báo chuyển khoản cho đơn này")
  }

  const first = decision.kind === "FIRST"
  await repo.updateSession(session.id, {
    status: "ORDER_SUBMITTED",
    ...(first ? { paymentProofAssetId: null } : { paymentProofBalanceAssetId: null }),
  })
  const reason = input.reason?.trim() || "Không thấy tiền về tài khoản tiệm"
  await orders.applyProgress(ctx, order, {
    eventType: "PAYMENT_NOT_RECEIVED",
    noteAppend: `[Điều hành: chưa nhận được tiền${first ? "" : " lần 2"}] ${reason}`,
    ...(first ? { pricingRuleRef: withPaymentRejectedAt(order.pricing_rule_ref, now) } : {}),
  })
  queueOrderNotification(ctx.organizationId, order.id, "PAYMENT_REMINDER")
  return { orderId: order.id, orderCode: order.code, reason, payment: decision.kind }
}
