import { describe, expect, it } from "vitest"
import { expectedFirstTransferVnd, needsReportedPaymentCheck, reportedPaymentCheckOf } from "../reported-payment-check"

const facts = {
  status: "CANCELLED", paidVnd: 0, incomingPayments: 0, sessionStatus: "PAYMENT_REPORTED", hasPaymentProof: true, pricingRuleRef: {},
}

describe("needsReportedPaymentCheck — đơn huỷ khi khách đã báo chuyển khoản (PO 17/10/2026)", () => {
  it("cần kiểm khi đơn đã huỷ, khách đã báo chuyển mà sổ thu chưa ghi đồng nào", () => {
    expect(needsReportedPaymentCheck(facts)).toBe(true)
    expect(needsReportedPaymentCheck({ ...facts, sessionStatus: "ORDER_SUBMITTED" })).toBe(true)
    expect(needsReportedPaymentCheck({ ...facts, hasPaymentProof: false })).toBe(true)
  })

  it("không cần khi đơn chưa huỷ, khách chưa báo, hoặc tiền đã vào sổ thu", () => {
    expect(needsReportedPaymentCheck({ ...facts, status: "CONFIRMED" })).toBe(false)
    expect(needsReportedPaymentCheck({ ...facts, sessionStatus: "ORDER_SUBMITTED", hasPaymentProof: false })).toBe(false)
    expect(needsReportedPaymentCheck({ ...facts, paidVnd: 500_000 })).toBe(false)
    // Đã thu rồi hoàn hết (số đã thu về 0) — việc hoàn đi theo luồng "Cần hoàn tiền"
    expect(needsReportedPaymentCheck({ ...facts, incomingPayments: 1 })).toBe(false)
  })

  it("không cần nữa khi Điều hành đã chốt", () => {
    const pricingRuleRef = { reportedPaymentCheck: { outcome: "NOT_RECEIVED", amountVnd: 0, by: "u1", at: "2026-10-17T01:00:00.000Z" } }
    expect(needsReportedPaymentCheck({ ...facts, pricingRuleRef })).toBe(false)
    expect(reportedPaymentCheckOf(pricingRuleRef)?.outcome).toBe("NOT_RECEIVED")
    expect(reportedPaymentCheckOf({ reportedPaymentCheck: { outcome: "x" } })).toBeNull()
  })
})

describe("expectedFirstTransferVnd", () => {
  it("đơn đặt cọc → tiền cọc; trả đủ → cả đơn", () => {
    expect(expectedFirstTransferVnd(1_000_000, { paymentPlan: { depositPercent: 30 } })).toBe(300_000)
    expect(expectedFirstTransferVnd(999_000, { paymentPlan: { depositPercent: 100 } })).toBe(999_000)
    expect(expectedFirstTransferVnd(999_000, null)).toBe(999_000)
  })
})
