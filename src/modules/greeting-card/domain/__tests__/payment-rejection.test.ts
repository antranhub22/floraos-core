import { describe, expect, it } from "vitest"
import { holdAction } from "../background-sweep"
import { paymentHoldUntil } from "../brochure-payment-policy"
import { paymentRejectedAtOf, rejectablePayment, withPaymentRejectedAt } from "../payment-rejection"
import { proofExpectedAmountVnd } from "../payment-plan"
import { moneyAfterRefund } from "../refund-ledger"

const now = new Date("2026-10-17T10:00:00Z")
const ago = (min: number) => new Date(now.getTime() - min * 60_000)
const timeout = { depositPercent: 0, requirePaidBeforeProduction: false, requireFullBeforeDispatch: false, paymentTimeoutMinutes: 30 }
const order = (over: Partial<Parameters<typeof holdAction>[0]> = {}) => ({
  status: "DRAFT", totalVnd: 500_000, paidVnd: 0, createdAt: ago(60), customerReportedPaid: false, ...over,
})

/** PO 17/10/2026: "Chưa nhận được tiền" sau hạn thanh toán không được làm đơn tự huỷ ngay sau ~1 phút. */
describe("holdAction — Điều hành báo chưa nhận được tiền cho khách thêm một hạn mới", () => {
  it("không có mốc từ chối: quá hạn gốc → thanh toán thất bại (giữ hành vi cũ)", () => {
    expect(holdAction(order(), timeout, now)).toBe("FAIL_PAYMENT")
  })
  it("vừa báo chưa nhận được tiền 1 phút trước → chưa huỷ (còn 29 phút của hạn mới)", () => {
    expect(holdAction(order({ paymentRejectedAt: ago(1) }), timeout, now)).toBe("NONE")
  })
  it("hết đúng một hạn mới tính từ lúc báo → thanh toán thất bại", () => {
    expect(holdAction(order({ paymentRejectedAt: ago(30) }), timeout, now)).toBe("FAIL_PAYMENT")
  })
  it("báo từ chối khi hạn gốc còn dài hơn → giữ hạn gốc (lấy mốc muộn hơn)", () => {
    const createdAt = ago(5) // hạn gốc còn 25 phút
    const until = paymentHoldUntil(timeout, { paidVnd: 0, createdAt, paymentRejectedAt: ago(10) })
    expect(until).toBe(new Date(createdAt.getTime() + 30 * 60_000).toISOString())
  })
  it("đồng hồ của khách cũng theo hạn mới", () => {
    const rejectedAt = ago(1)
    expect(paymentHoldUntil(timeout, { paidVnd: 0, createdAt: ago(60), paymentRejectedAt: rejectedAt }))
      .toBe(new Date(rejectedAt.getTime() + 30 * 60_000).toISOString())
  })
})

describe("paymentRejectedAtOf / withPaymentRejectedAt", () => {
  it("ghi mốc vào pricing_rule_ref, giữ nguyên khoá khác, đọc lại được", () => {
    const ref = withPaymentRejectedAt({ quotedAt: "2026-10-17T09:00:00.000Z" }, now)
    expect(ref.quotedAt).toBe("2026-10-17T09:00:00.000Z")
    expect(paymentRejectedAtOf(ref)?.toISOString()).toBe(now.toISOString())
  })
  it("thiếu hoặc sai định dạng → null", () => {
    expect(paymentRejectedAtOf(null)).toBeNull()
    expect(paymentRejectedAtOf({ paymentRejectedAt: "không phải ngày" })).toBeNull()
  })
})

describe("rejectablePayment", () => {
  const base = { status: "DRAFT", totalVnd: 1_000_000, paidVnd: 0, sessionStatus: "PAYMENT_REPORTED", hasFirstProof: false, hasBalanceProof: false }
  it("Lần 1: sổ thu 0 đ, khách đã báo hoặc có bill", () => {
    expect(rejectablePayment(base)).toEqual({ kind: "FIRST" })
    expect(rejectablePayment({ ...base, sessionStatus: "ORDER_SUBMITTED", hasFirstProof: true })).toEqual({ kind: "FIRST" })
  })
  it("Lần 2: đơn đã cọc còn nợ, khách đã báo hoặc có bill phần còn lại", () => {
    expect(rejectablePayment({ ...base, status: "CONFIRMED", paidVnd: 300_000 })).toEqual({ kind: "BALANCE" })
    expect(rejectablePayment({ ...base, status: "CONFIRMED", paidVnd: 300_000, sessionStatus: "ORDER_SUBMITTED", hasBalanceProof: true })).toEqual({ kind: "BALANCE" })
  })
  it("chặn: đơn đã huỷ, khách chưa báo, đơn đã thu đủ", () => {
    expect(rejectablePayment({ ...base, status: "CANCELLED" })).toHaveProperty("blocker")
    expect(rejectablePayment({ ...base, sessionStatus: "ORDER_SUBMITTED" })).toHaveProperty("blocker")
    expect(rejectablePayment({ ...base, paidVnd: 300_000, sessionStatus: "ORDER_SUBMITTED", hasFirstProof: true })).toHaveProperty("blocker")
    expect(rejectablePayment({ ...base, paidVnd: 1_000_000 })).toHaveProperty("blocker")
  })
})

/** AI đối soát bill phải mong đúng số máy chủ ghi sổ (cọc làm tròn lên nghìn, đơn cũ theo % tiệm). */
describe("proofExpectedAmountVnd", () => {
  it("cọc theo bản chụp trên đơn, làm tròn LÊN nghìn (không Math.round)", () => {
    const ref = { paymentPlan: { policy: "DEPOSIT_30" } }
    expect(proofExpectedAmountVnd("DEPOSIT", { totalVnd: 456_789, balanceVnd: 456_789, pricingRuleRef: ref }, 0)).toBe(138_000)
  })
  it("đơn cũ không có bản chụp → theo % cọc hiện tại của tiệm", () => {
    expect(proofExpectedAmountVnd("DEPOSIT", { totalVnd: 1_000_000, balanceVnd: 1_000_000, pricingRuleRef: null }, 50)).toBe(500_000)
  })
  it("không cọc → toàn bộ; Lần 2 → phần còn lại", () => {
    expect(proofExpectedAmountVnd("DEPOSIT", { totalVnd: 1_000_000, balanceVnd: 1_000_000, pricingRuleRef: null }, 0)).toBe(1_000_000)
    expect(proofExpectedAmountVnd("BALANCE", { totalVnd: 1_000_000, balanceVnd: 700_000, pricingRuleRef: null }, 30)).toBe(700_000)
  })
})

describe("moneyAfterRefund — hoàn tiền không tạo nợ phải thu", () => {
  it("đơn đã giao, thu đủ, hoàn 100.000 đ → còn phải thu vẫn 0", () => {
    expect(moneyAfterRefund({ paidVnd: 500_000, balanceVnd: 0 }, 100_000)).toEqual({ paidVnd: 400_000, balanceVnd: 0 })
  })
  it("đơn đã cọc còn nợ, hoàn đền bù → nợ phần còn lại giữ nguyên", () => {
    expect(moneyAfterRefund({ paidVnd: 300_000, balanceVnd: 200_000 }, 50_000)).toEqual({ paidVnd: 250_000, balanceVnd: 200_000 })
  })
})
