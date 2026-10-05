import { describe, it, expect } from "vitest"
import { cancelBlocker, expectedPayment, parsePaymentPolicy, paymentGateBlocker, quoteBlocker } from "../brochure-payment-policy"

describe("parsePaymentPolicy", () => {
  it("mặc định trả đủ, không chặn; % cọc ngoài 1–99 bị bỏ", () => {
    expect(parsePaymentPolicy(null)).toEqual({ depositPercent: 0, requirePaidBeforeProduction: false, requireFullBeforeDispatch: false })
    expect(parsePaymentPolicy({ brochure_policy: { deposit_percent: 150 } }).depositPercent).toBe(0)
    expect(parsePaymentPolicy({ brochure_policy: { deposit_percent: 30, require_full_before_dispatch: true } })).toMatchObject({
      depositPercent: 30, requireFullBeforeDispatch: true,
    })
  })
})

describe("expectedPayment", () => {
  const policy = { depositPercent: 30, requirePaidBeforeProduction: true, requireFullBeforeDispatch: true }
  it("lần đầu thu cọc (làm tròn lên nghìn), lần sau thu phần còn lại", () => {
    expect(expectedPayment(policy, 1_234_500, 0)).toEqual({ amountVnd: 371_000, purpose: "DEPOSIT" })
    expect(expectedPayment(policy, 1_234_500, 371_000)).toEqual({ amountVnd: 863_500, purpose: "BALANCE" })
    expect(expectedPayment({ ...policy, depositPercent: 0 }, 500_000, 0)).toEqual({ amountVnd: 500_000, purpose: "FULL" })
  })
})

describe("paymentGateBlocker / cancelBlocker", () => {
  const policy = { depositPercent: 30, requirePaidBeforeProduction: true, requireFullBeforeDispatch: true }
  it("chặn cắm hoa khi chưa thu đồng nào, chặn giao khi chưa thu đủ", () => {
    expect(paymentGateBlocker("assign-florist", policy, { totalVnd: 100, paidVnd: 0 })).toMatch(/cắm hoa/)
    expect(paymentGateBlocker("assign-florist", policy, { totalVnd: 100, paidVnd: 30 })).toBeNull()
    expect(paymentGateBlocker("dispatch-shipping", policy, { totalVnd: 100, paidVnd: 30 })).toMatch(/thu đủ/)
    expect(paymentGateBlocker("recipient-photo", policy, { totalVnd: 100, paidVnd: 0 })).toBeNull()
  })
  it("không huỷ đơn đã giao hoặc đã huỷ", () => {
    expect(cancelBlocker({ status: "CONFIRMED", deliveryStatus: "DELIVERED" })).not.toBeNull()
    expect(cancelBlocker({ status: "CANCELLED", deliveryStatus: "PENDING" })).not.toBeNull()
    expect(cancelBlocker({ status: "DRAFT", deliveryStatus: "PENDING" })).toBeNull()
  })
})

describe("đơn chờ báo giá (tổng 0)", () => {
  const strict = { depositPercent: 0, requirePaidBeforeProduction: false, requireFullBeforeDispatch: true }

  it("không giao hoa khi chưa báo giá dù 0 ≥ 0", () => {
    expect(paymentGateBlocker("dispatch-shipping", strict, { totalVnd: 0, paidVnd: 0 })).toMatch(/báo giá/)
  })

  it("chỉ báo giá đơn tổng 0, chưa huỷ, số tiền nguyên dương", () => {
    expect(quoteBlocker({ status: "DRAFT", totalVnd: 0 }, 850_000)).toBeNull()
    expect(quoteBlocker({ status: "DRAFT", totalVnd: 500_000 }, 850_000)).not.toBeNull()
    expect(quoteBlocker({ status: "CANCELLED", totalVnd: 0 }, 850_000)).not.toBeNull()
    expect(quoteBlocker({ status: "DRAFT", totalVnd: 0 }, 0)).not.toBeNull()
    expect(quoteBlocker({ status: "DRAFT", totalVnd: 0 }, 1.5)).not.toBeNull()
  })
})
