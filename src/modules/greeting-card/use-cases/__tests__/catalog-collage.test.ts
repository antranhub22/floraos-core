import { describe, expect, it, vi } from "vitest"

vi.mock("@/modules/assets/adapters/storage-provider-factory", () => ({ getStorageProvider: () => ({ get: vi.fn() }) }))
vi.mock("../get-public-greeting-catalog", () => ({ getPublicGreetingCatalog: vi.fn() }))
vi.mock("../get-public-greeting-catalog-by-slug", () => ({ getPublicGreetingCatalogBySlug: vi.fn() }))

const { priceLabelOf } = await import("../catalog-collage")

describe("priceLabelOf", () => {
  it("khoảng giá từ thấp đến cao, bỏ mẫu chưa có giá", () => {
    expect(priceLabelOf([500000, null, 350000, 1200000])).toBe("350.000đ – 1.200.000đ")
  })
  it("cùng một giá → một số; không mẫu nào có giá → null", () => {
    expect(priceLabelOf([450000, 450000])).toBe("450.000đ")
    expect(priceLabelOf([null, 0])).toBeNull()
  })
})
