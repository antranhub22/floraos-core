import { describe, expect, it } from "vitest"
import { isLikelyBot, isSameOrder } from "../order-guard"
import { isProductAvailable } from "../product-availability"

describe("isProductAvailable", () => {
  const row = (status: string, quantity_available: number | null = null) => ({ branch_id: "b1", status, quantity_available })
  it("chưa gắn chi nhánh hoặc chưa khai tồn kho → còn bán", () => {
    expect(isProductAvailable({ branch_id: null, inventory: [row("OUT_OF_STOCK")] })).toBe(true)
    expect(isProductAvailable({ branch_id: "b1", inventory: [] })).toBe(true)
  })
  it("chỉ xét đúng chi nhánh của sản phẩm", () => {
    expect(isProductAvailable({ branch_id: "b1", inventory: [row("OUT_OF_STOCK")] })).toBe(false)
    expect(isProductAvailable({ branch_id: "b2", inventory: [row("OUT_OF_STOCK")] })).toBe(true)
  })
  it("số lượng 0 là hết, trừ khi nhận đặt trước", () => {
    expect(isProductAvailable({ branch_id: "b1", inventory: [row("IN_STOCK", 0)] })).toBe(false)
    expect(isProductAvailable({ branch_id: "b1", inventory: [row("PRE_ORDER_ONLY", 0)] })).toBe(true)
    expect(isProductAvailable({ branch_id: "b1", inventory: [row("IN_STOCK", 3)] })).toBe(true)
  })
})

describe("order-guard", () => {
  it("ô bẫy có chữ → máy", () => {
    expect(isLikelyBot("x")).toBe(true)
    expect(isLikelyBot("  ")).toBe(false)
    expect(isLikelyBot(undefined)).toBe(false)
  })
  it("cùng người nhận + cùng ngày giao mới là đơn trùng", () => {
    expect(isSameOrder({ recipientPhone: "0912", deliveryDate: "2026-10-10" }, { recipientPhone: "0912", deliveryDate: "2026-10-10" })).toBe(true)
    expect(isSameOrder({ recipientPhone: "0912", deliveryDate: "2026-10-10" }, { recipientPhone: "0912", deliveryDate: "2026-10-11" })).toBe(false)
  })
})
