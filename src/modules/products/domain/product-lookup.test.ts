import { describe, expect, it } from "vitest"

import { filterProductLookup, type ProductLookupRaw } from "./product-lookup"
import type { PricingRuleRow } from "./pricing-rules"

const PRODUCT: ProductLookupRaw = {
  id: "p1",
  code: "BHBB0001",
  name: "Bó hoa baby Giấc Mơ Nhỏ",
  category: "Bó hoa",
  shape: "Tròn",
  facing: "Một mặt",
  container: "Giấy gói",
  status: "ACTIVE",
  branch_id: null,
}

const RULE_ROWS: PricingRuleRow[] = [
  { key: "optimal_price_ratio", value: 0.6, branch_id: null },
]

describe("filterProductLookup", () => {
  it("có L5 (canReadPricing) thì thấy khối pricing, không trường nào bị cắt", () => {
    const result = filterProductLookup(PRODUCT, RULE_ROWS, { canReadPricing: true, branchId: null })
    expect(result.pricing).not.toBeNull()
    expect(result.pricing?.optimal_price_ratio).toBe(0.6)
    expect(result.redacted_fields).toEqual([])
  })

  it("không có L5 thì khối pricing là null và bị kê vào redacted_fields", () => {
    const result = filterProductLookup(PRODUCT, RULE_ROWS, { canReadPricing: false, branchId: null })
    expect(result.pricing).toBeNull()
    expect(result.redacted_fields).toContain("pricing")
  })

  it("cắt khối pricing không kéo theo mất thông tin nhận dạng sản phẩm", () => {
    const result = filterProductLookup(PRODUCT, RULE_ROWS, { canReadPricing: false, branchId: null })
    expect(result.code).toBe("BHBB0001")
    expect(result.name).toBe(PRODUCT.name)
    expect(result.category).toBe("Bó hoa")
  })

  it("không nguyên liệu tính toán nội bộ nào lọt ra ngoài kê tên", () => {
    const result = filterProductLookup(PRODUCT, RULE_ROWS, { canReadPricing: true, branchId: null })
    const serialized = JSON.stringify(result)
    // Chỉ những khoá đã kê tên trong ProductLookupResult mới có trong bản trả
    // ra — thêm một trường lạ vào PRODUCT không kéo nó ra ngoài.
    expect(Object.keys(result).sort()).toEqual(
      [
        "id",
        "code",
        "name",
        "category",
        "shape",
        "facing",
        "container",
        "status",
        "branch_id",
        "pricing",
        "redacted_fields",
      ].sort()
    )
    expect(serialized).toBeDefined()
  })
})
