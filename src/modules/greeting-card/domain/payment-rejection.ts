/**
 * Điều hành bấm "Chưa nhận được tiền" cho khoản khách đã báo chuyển (PO 15–17/10/2026).
 * Pure TypeScript — dùng chung máy chủ (chặn thao tác) và hộp thoại Điều hành (hiện nút).
 */

/** Khoá ghi mốc từ chối trong `orders.pricing_rule_ref` (không đổi lược đồ). */
export const PAYMENT_REJECTED_AT_KEY = "paymentRejectedAt"

/** FIRST = khoản Lần 1 (sổ thu còn 0 đ); BALANCE = phần còn lại Lần 2 của đơn đã cọc. */
export type RejectablePayment = "FIRST" | "BALANCE"

export interface RejectPaymentFacts {
  status: string
  totalVnd: number
  paidVnd: number
  sessionStatus: string | null
  hasFirstProof: boolean
  hasBalanceProof: boolean
}

/** Khoản nào đang chờ đối soát có thể bị báo "chưa nhận được tiền", hoặc lý do chặn (409). */
export function rejectablePayment(f: RejectPaymentFacts): { kind: RejectablePayment } | { blocker: string } {
  if (f.status === "CANCELLED") return { blocker: "Đơn hàng đã huỷ" }
  const reported = f.sessionStatus === "PAYMENT_REPORTED"
  if (f.paidVnd <= 0) {
    return reported || f.hasFirstProof ? { kind: "FIRST" } : { blocker: "Khách chưa báo chuyển khoản cho đơn này" }
  }
  if (f.totalVnd > 0 && f.paidVnd < f.totalVnd) {
    return reported || f.hasBalanceProof
      ? { kind: "BALANCE" }
      : { blocker: "Khách chưa báo chuyển phần còn lại cho đơn này" }
  }
  return { blocker: "Đơn đã thu đủ tiền — điều chỉnh qua sổ thu hoặc hoàn tiền" }
}

/** Mốc Điều hành báo chưa nhận được tiền gần nhất, hoặc `null`. */
export function paymentRejectedAtOf(pricingRuleRef: unknown): Date | null {
  if (!pricingRuleRef || typeof pricingRuleRef !== "object") return null
  const raw = (pricingRuleRef as Record<string, unknown>)[PAYMENT_REJECTED_AT_KEY]
  if (typeof raw !== "string") return null
  const ms = Date.parse(raw)
  return Number.isNaN(ms) ? null : new Date(ms)
}

/** `pricing_rule_ref` mới có ghi mốc từ chối (giữ nguyên các khoá khác). */
export function withPaymentRejectedAt(pricingRuleRef: unknown, at: Date): Record<string, unknown> {
  const ref = pricingRuleRef && typeof pricingRuleRef === "object" ? (pricingRuleRef as Record<string, unknown>) : {}
  return { ...ref, [PAYMENT_REJECTED_AT_KEY]: at.toISOString() }
}
