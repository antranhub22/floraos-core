import { describe, it, expect } from "vitest"
import { expectedPayment } from "../brochure-payment-policy"
import { balanceDue, buildPaymentSchedule, orderPaymentStatus, paymentMilestones, paymentSplit } from "../payment-schedule"
import { orderPaymentSummary } from "../payment-summary"

describe("buildPaymentSchedule — tổng các đợt luôn bằng tổng đơn", () => {
  it("DC30 trên đơn 2.000.000đ → cọc 600.000đ + còn lại 1.400.000đ", () => {
    const s = buildPaymentSchedule(2_000_000, 30)
    expect(s.map((m) => [m.kind, m.amountVnd, m.due])).toEqual([
      ["DEPOSIT", 600_000, "ON_ORDER"],
      ["BALANCE", 1_400_000, "AFTER_PRODUCT_PHOTO"],
    ])
    expect(s.reduce((a, m) => a + m.amountVnd, 0)).toBe(2_000_000)
  })
  it("DC50 → 50/50", () => {
    expect(paymentSplit(2_000_000, 50)).toEqual({ totalVnd: 2_000_000, dueNowVnd: 1_000_000, dueLaterVnd: 1_000_000, depositPercent: 50 })
  })
  it("không cọc → một lần trả đủ hôm nay", () => {
    expect(paymentSplit(2_000_000, 0)).toEqual({ totalVnd: 2_000_000, dueNowVnd: 2_000_000, dueLaterVnd: 0, depositPercent: 0 })
  })
  it("cọc làm tròn lên nghìn, khớp số tiền QR (`expectedPayment`)", () => {
    const split = paymentSplit(1_234_500, 30)
    expect(split.dueNowVnd).toBe(371_000)
    expect(split.dueNowVnd + split.dueLaterVnd).toBe(1_234_500)
    const policy = { depositPercent: 30, requirePaidBeforeProduction: false, requireFullBeforeDispatch: false }
    expect(expectedPayment(policy, 1_234_500, 0).amountVnd).toBe(split.dueNowVnd)
    expect(expectedPayment(policy, 1_234_500, 371_000).amountVnd).toBe(split.dueLaterVnd)
  })
  it("đơn nhỏ: cọc làm tròn đã bằng tổng → trả đủ một lần", () => {
    expect(buildPaymentSchedule(800, 50).map((m) => m.kind)).toEqual(["FULL"])
  })
})

describe("paymentMilestones", () => {
  it("chưa trả → hai đợt chờ; đã cọc → đợt 1 PAID; trả nốt → cả hai PAID", () => {
    expect(paymentMilestones(2_000_000, 30, 0).map((m) => m.status)).toEqual(["PENDING", "PENDING"])
    expect(paymentMilestones(2_000_000, 30, 600_000).map((m) => m.status)).toEqual(["PAID", "PENDING"])
    expect(paymentMilestones(2_000_000, 30, 2_000_000).map((m) => m.status)).toEqual(["PAID", "PAID"])
  })
  it("trả thiếu cọc → đợt 1 trả một phần", () => {
    const m = paymentMilestones(2_000_000, 30, 100_000)
    expect(m[0]).toMatchObject({ status: "PARTIALLY_PAID", paidVnd: 100_000 })
  })
})

describe("orderPaymentStatus", () => {
  it("UNPAID / PARTIALLY_PAID / PAID", () => {
    expect(orderPaymentStatus({ totalVnd: 2_000_000, paidVnd: 0 })).toBe("UNPAID")
    expect(orderPaymentStatus({ totalVnd: 2_000_000, paidVnd: 600_000 })).toBe("PARTIALLY_PAID")
    expect(orderPaymentStatus({ totalVnd: 2_000_000, paidVnd: 2_000_000 })).toBe("PAID")
  })
  it("PAYMENT_PENDING khi khách báo đã chuyển; PAYMENT_FAILED khi chuyển không khớp; PAID thắng tất cả", () => {
    expect(orderPaymentStatus({ totalVnd: 2_000_000, paidVnd: 0, reported: true })).toBe("PAYMENT_PENDING")
    expect(orderPaymentStatus({ totalVnd: 2_000_000, paidVnd: 600_000, failed: true })).toBe("PAYMENT_FAILED")
    expect(orderPaymentStatus({ totalVnd: 2_000_000, paidVnd: 2_000_000, failed: true })).toBe("PAID")
  })
  it("đơn chờ báo giá (tổng 0) chưa phải PAID", () => {
    expect(orderPaymentStatus({ totalVnd: 0, paidVnd: 0 })).toBe("UNPAID")
  })
})

describe("balanceDue — chờ thanh toán phần còn lại sau khi hoa xong", () => {
  const base = { status: "CONFIRMED", productionStatus: "READY", deliveryStatus: "PENDING", totalVnd: 2_000_000, paidVnd: 600_000 }
  it("đã cọc + hoa xong → chờ trả phần còn lại", () => expect(balanceDue(base)).toBe(true))
  it("hoa chưa xong / đã trả đủ / chưa cọc / đã huỷ → không", () => {
    expect(balanceDue({ ...base, productionStatus: "ARRANGING" })).toBe(false)
    expect(balanceDue({ ...base, paidVnd: 2_000_000 })).toBe(false)
    expect(balanceDue({ ...base, paidVnd: 0 })).toBe(false)
    expect(balanceDue({ ...base, status: "CANCELLED" })).toBe(false)
  })
})

describe("orderPaymentSummary — cho Admin/Sale và trang theo dõi", () => {
  it("đơn dùng DC30, đã cọc", () => {
    const s = orderPaymentSummary(
      {
        totalVnd: 2_000_000, paidVnd: 600_000, status: "CONFIRMED", productionStatus: "READY", deliveryStatus: "PENDING",
        pricingRuleRef: { paymentPlan: { policy: "DEPOSIT_30", source: "PAYMENT_CODE", paymentCode: "DC30" } },
      },
      0,
    )
    expect(s).toMatchObject({
      policy: "DEPOSIT_30", policyLabel: "Đặt cọc 30%", paymentCode: "DC30", depositPercent: 30,
      totalVnd: 2_000_000, paidVnd: 600_000, remainingVnd: 1_400_000, status: "PARTIALLY_PAID", balanceDue: true,
    })
    expect(s.milestones.map((m) => m.status)).toEqual(["PAID", "PENDING"])
  })
  it("đơn cũ không bản chụp → theo % của tiệm", () => {
    const s = orderPaymentSummary({ totalVnd: 1_000_000, paidVnd: 0, status: "DRAFT", productionStatus: "WAITING", deliveryStatus: "PENDING", pricingRuleRef: null }, 0)
    expect(s).toMatchObject({ policy: "FULL_PAYMENT", paymentCode: null, status: "UNPAID" })
  })
})
