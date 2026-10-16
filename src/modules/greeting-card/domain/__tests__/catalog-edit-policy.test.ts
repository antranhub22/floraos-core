import { describe, it, expect } from "vitest"
import { canEditAnyCatalog, canEditCatalog } from "../catalog-edit-policy"

const has = (codes: string[]) => (c: string) => codes.includes(c)
const SALE = ["L1", "R1", "R2", "R9"]

/** PO 16/10/2026: Sale sửa bộ sưu tập của mình, không đụng bộ sưu tập người khác; L3/L4 sửa mọi bộ sưu tập. */
describe("catalog-edit-policy", () => {
  it("Sale sửa được bộ sưu tập do chính mình tạo, không sửa của người khác", () => {
    expect(canEditCatalog({ createdBy: "lan" }, { userId: "lan", has: has(SALE) })).toBe(true)
    expect(canEditCatalog({ createdBy: "chu-tiem" }, { userId: "lan", has: has(SALE) })).toBe(false)
  })

  it("L3 (Điều phối, quản lý sản phẩm) hoặc L4 (Điều hành) sửa được mọi bộ sưu tập", () => {
    expect(canEditCatalog({ createdBy: "lan" }, { userId: "x", has: has([...SALE, "L3"]) })).toBe(true)
    expect(canEditCatalog({ createdBy: "lan" }, { userId: "x", has: has(["L4"]) })).toBe(true)
  })

  it("chưa biết người xem / người tạo → không sửa (trừ L3/L4); cài đặt chung chỉ L3/L4", () => {
    expect(canEditCatalog({ createdBy: null }, { userId: null, has: has(SALE) })).toBe(false)
    expect(canEditCatalog({ createdBy: undefined }, { userId: undefined, has: has(SALE) })).toBe(false)
    expect(canEditAnyCatalog(has(SALE))).toBe(false)
    expect(canEditAnyCatalog(has(["L3"]))).toBe(true)
  })
})
