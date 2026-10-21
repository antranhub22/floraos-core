/**
 * Đơn đã huỷ khi khách ĐÃ BÁO chuyển khoản mà tiệm chưa kịp ghi nhận tiền (PO 17/10/2026).
 * Sổ thu ghi 0 đ nên hệ thống không tạo việc hoàn tiền — nhưng tiền có thể đã vào tài khoản tiệm.
 * Điều hành kiểm sao kê rồi chốt một trong hai: đã hoàn tiền cho khách / không nhận được tiền.
 * Kết quả lưu ở `orders.pricing_rule_ref.reportedPaymentCheck`. Pure TypeScript.
 */

export type ReportedPaymentOutcome = "REFUNDED" | "NOT_RECEIVED"

export interface ReportedPaymentCheck {
  outcome: ReportedPaymentOutcome
  /** Số tiền đã hoàn cho khách (0 khi không nhận được tiền). */
  amountVnd: number
  by: string
  at: string
  note?: string | undefined
}

type Loose = Record<string, unknown>
const obj = (v: unknown): Loose => (v && typeof v === "object" ? (v as Loose) : {})

/** Kết quả kiểm đã chốt của đơn — `null` khi chưa ai xử lý. */
export function reportedPaymentCheckOf(pricingRuleRef: unknown): ReportedPaymentCheck | null {
  const c = obj(obj(pricingRuleRef).reportedPaymentCheck)
  if (c.outcome !== "REFUNDED" && c.outcome !== "NOT_RECEIVED") return null
  return {
    outcome: c.outcome,
    amountVnd: Number(c.amountVnd) || 0,
    by: String(c.by ?? ""),
    at: String(c.at ?? ""),
    note: typeof c.note === "string" ? c.note : undefined,
  }
}

export interface CancelledOrderPaymentFacts {
  status: string
  paidVnd: number
  /** Số dòng tiền VÀO (cọc / phần còn lại) trong sổ thu. */
  incomingPayments: number
  sessionStatus: string | null | undefined
  hasPaymentProof: boolean
  pricingRuleRef: unknown
}

/** Đơn đã huỷ, khách đã báo chuyển khoản, sổ thu chưa ghi đồng nào và chưa ai chốt → cần Điều hành kiểm. */
export function needsReportedPaymentCheck(f: CancelledOrderPaymentFacts): boolean {
  if (f.status !== "CANCELLED") return false
  if (f.paidVnd !== 0 || f.incomingPayments > 0) return false
  if (f.sessionStatus !== "PAYMENT_REPORTED" && !f.hasPaymentProof) return false
  return reportedPaymentCheckOf(f.pricingRuleRef) === null
}

/** Số tiền khách được yêu cầu chuyển ở lần đầu: tiền cọc nếu đơn đặt cọc, không thì cả đơn. */
export function expectedFirstTransferVnd(totalVnd: number, pricingRuleRef: unknown): number {
  const pct = Number(obj(obj(pricingRuleRef).paymentPlan).depositPercent)
  const total = Math.max(0, Math.round(totalVnd))
  return pct > 0 && pct < 100 ? Math.round((total * pct) / 100) : total
}
