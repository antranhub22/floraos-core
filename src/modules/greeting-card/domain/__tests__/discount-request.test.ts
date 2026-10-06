import { describe, expect, it } from "vitest"
import { discountError, discountVndOf, parseMaxDiscountPercent } from "../discount-request"

describe("discount-request", () => {
  it("mức tối đa mặc định 25%, Điều hành đổi được trong cài đặt", () => {
    expect(parseMaxDiscountPercent({})).toBe(25)
    expect(parseMaxDiscountPercent({ brochure_discount: { max_percent: 10 } })).toBe(10)
    expect(parseMaxDiscountPercent({ brochure_discount: { max_percent: 150 } })).toBe(25)
  })

  it("tính tiền giảm theo % (làm tròn xuống nghìn) hoặc theo số tiền", () => {
    expect(discountVndOf({ percent: 10 }, 1_255_000)).toBe(125_000)
    expect(discountVndOf({ amountVnd: 50_000 }, 1_000_000)).toBe(50_000)
  })

  it("chặn vượt trần, chưa có giá, nhập cả hai/không nhập gì", () => {
    expect(discountError({ percent: 25 }, 1_000_000, 25)).toBeNull()
    expect(discountError({ percent: 30 }, 1_000_000, 25)).toContain("Vượt mức giảm tối đa 25%")
    expect(discountError({ amountVnd: 300_000 }, 1_000_000, 25)).toContain("Vượt mức")
    expect(discountError({ percent: 5 }, 0, 25)).toContain("chưa có giá")
    expect(discountError({ percent: 5, amountVnd: 1 }, 1_000_000, 25)).toContain("% hoặc theo số tiền")
    expect(discountError({}, 1_000_000, 25)).toContain("% hoặc theo số tiền")
  })
})
