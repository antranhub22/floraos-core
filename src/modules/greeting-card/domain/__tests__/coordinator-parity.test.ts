import { describe, expect, it } from "vitest"
import { coordinatorBlockerOf, dispatchActionLabel, visibleCoordinatorActions, type CoordinatorOrderFacts } from "../coordinator-card-actions"
import { coordinatorActionBlocker, isOrderAccepted } from "../brochure-commerce-rules"
import { DEFAULT_PAYMENT_POLICY } from "../brochure-payment-policy"

const order = (o: Partial<CoordinatorOrderFacts> = {}): CoordinatorOrderFacts => ({
  status: "CONFIRMED", productionStatus: "WAITING", deliveryStatus: "PENDING", totalVnd: 500_000, paidVnd: 500_000, ...o,
})
const opts = { isUrgent: false, nowMs: Date.parse("2026-10-20T08:00:00Z") }
const visible = (o: CoordinatorOrderFacts, policy = DEFAULT_PAYMENT_POLICY) =>
  visibleCoordinatorActions(coordinatorBlockerOf(o, policy, opts), o).map((v) => (v.blocker ? `${v.action}(mờ)` : v.action))

/** Lưới thẻ, Kanban và máy chủ dùng cùng `coordinatorBlockerOf` (PO 17/10/2026). */
describe("coordinatorBlockerOf — tác vụ Điều phối dùng chung", () => {
  it("đơn chưa nhận: không giao florist / chụp ảnh / giao ship, lý do rõ (máy chủ cũng chặn)", () => {
    const draft = order({ status: "DRAFT", paidVnd: 0 })
    expect(isOrderAccepted(draft)).toBe(false)
    expect(coordinatorBlockerOf(draft, DEFAULT_PAYMENT_POLICY, opts)("assign-florist")).toMatch(/chưa được nhận/)
    expect(coordinatorActionBlocker("product-photo", draft)).toMatch(/chưa được nhận/)
    expect(visible(draft)).toEqual([])
  })

  it("Điều hành ghi nhận tiền (CONFIRMED) = đã nhận → Giao Florist hiện", () => {
    expect(visible(order())).toEqual(["assign-florist", "product-photo"])
    expect(visible(order({ status: "DRAFT", productionStatus: "ASSIGNED" }))).toEqual(["assign-florist", "product-photo"])
  })

  it("đang giao: có 'Giao không thành công' (trước đây Kanban thiếu)", () => {
    expect(visible(order({ productionStatus: "READY", deliveryStatus: "DELIVERING" }))).toEqual(["recipient-photo", "delivery-failed"])
  })

  it("giao không thành công: nút giao đọc 'Giao lại'", () => {
    const failed = order({ productionStatus: "READY", deliveryStatus: "FAILED" })
    expect(visible(failed)).toContain("dispatch-shipping")
    expect(dispatchActionLabel(failed, DEFAULT_PAYMENT_POLICY, false)).toBe("Giao lại")
  })

  it("đơn cọc chờ lần 2: nhãn 'Chờ TT lần 2', nút mờ kèm lý do của máy chủ", () => {
    const deposit = order({ productionStatus: "READY", paidVnd: 100_000 })
    expect(dispatchActionLabel(deposit, DEFAULT_PAYMENT_POLICY, false)).toBe("Chờ TT lần 2")
    expect(visible(deposit)).toContain("dispatch-shipping(mờ)")
    expect(dispatchActionLabel(order({ productionStatus: "READY" }), DEFAULT_PAYMENT_POLICY, false)).toBe("Giao Ship")
  })

  it("chờ khách duyệt ảnh: giao ship mờ, cùng lý do máy chủ", () => {
    const pending = order({
      productionStatus: "READY",
      photoApproval: { status: "PENDING", uploadedAt: "2026-10-20T07:55:00Z", countdownMinutes: 10, autoApprove: true },
    })
    expect(coordinatorBlockerOf(pending, DEFAULT_PAYMENT_POLICY, opts)("dispatch-shipping")).toContain("còn 5 phút")
  })

  it("tiệm không bắt qua bước ảnh: giao thẳng được khi đã nhận đơn", () => {
    const policy = { ...DEFAULT_PAYMENT_POLICY, requireProductPhotoQC: false }
    expect(coordinatorBlockerOf(order({ productionStatus: "ARRANGING" }), policy, opts)("dispatch-shipping")).toBeNull()
    expect(coordinatorBlockerOf(order({ productionStatus: "ARRANGING" }), DEFAULT_PAYMENT_POLICY, opts)("dispatch-shipping")).toMatch(/ảnh thành phẩm/)
  })
})
