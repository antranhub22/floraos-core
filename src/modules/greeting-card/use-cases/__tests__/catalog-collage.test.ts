import { describe, expect, it, vi } from "vitest"

vi.mock("@/modules/assets/adapters/storage-provider-factory", () => ({ getStorageProvider: () => ({ get: vi.fn() }) }))
vi.mock("../get-public-greeting-catalog", () => ({ getPublicGreetingCatalog: vi.fn() }))
vi.mock("../get-public-greeting-catalog-by-slug", () => ({ getPublicGreetingCatalogBySlug: vi.fn() }))
vi.mock("../get-greeting-catalog", () => ({
  getGreetingCatalogForCustomer: vi.fn().mockResolvedValue({
    status: "ACTIVE",
    catalog: { name: "Hoa Sinh Nhật" },
    shop: { name: "Tiệm Hoa Xinh" },
    products: [{ price: 500000, imageUrl: null }],
  }),
}))

const { priceLabelOf, catalogCollageBySendCode } = await import("../catalog-collage")

describe("priceLabelOf", () => {
  it("khoảng giá từ thấp đến cao, bỏ mẫu chưa có giá", () => {
    expect(priceLabelOf([500000, null, 350000, 1200000])).toBe("350.000đ – 1.200.000đ")
  })
  it("cùng một giá → một số; không mẫu nào có giá → null", () => {
    expect(priceLabelOf([450000, 450000])).toBe("450.000đ")
    expect(priceLabelOf([null, 0])).toBeNull()
  })
})

describe("catalogCollageBySendCode", () => {
  it("trả về thông tin collage đúng khi session ACTIVE", async () => {
    const result = await catalogCollageBySendCode("ABC123XYZ")
    expect(result).toEqual({
      catalogName: "Hoa Sinh Nhật",
      shopName: "Tiệm Hoa Xinh",
      priceLabel: "500.000đ",
      logo: null,
      productCount: 1,
      images: [],
    })
  })
})
