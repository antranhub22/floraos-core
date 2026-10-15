import { describe, expect, it } from "vitest"
import {
  DEFAULT_FILTER_STATE,
  filterAndSortProducts,
  matchProductOccasion,
  matchProductPrice,
  removeVietnameseTones,
  type MinimalProductItem,
} from "@/components/products/product-filter-types"

describe("Bộ lọc sản phẩm Mẫu Hoa: Giá, Dịp & Tìm kiếm", () => {
  const sampleProducts: MinimalProductItem[] = [
    {
      id: "p1",
      code: "BST-Basic-CB-035",
      name: "Ke Hoa Vieng Tong Vang",
      category: "Hoa chia buồn",
      price_vnd: 2_412_000,
    },
    {
      id: "p2",
      code: "BST-Basic-CB-033",
      name: "Ke Hoa Vieng Hai Tang Hong Vang",
      category: "Hoa chia buồn",
      price_vnd: 1_740_000,
    },
    {
      id: "p3",
      code: "FL-1001",
      name: "Bó hoa Nắng Hè Rực Rỡ",
      category: "Bó hoa",
      price_vnd: 450_000,
      attributes: { occasions: "Sinh nhật, Chúc mừng" },
    },
    {
      id: "p4",
      code: "FL-1002",
      name: "Giỏ hoa Tình Yêu Ngọt Ngào",
      category: "Giỏ hoa",
      price_vnd: 680_000,
      attributes: { occasions: "Kỷ niệm, Tình yêu, Lễ tình nhân 14/2" },
    },
    {
      id: "p5",
      code: "FL-1003",
      name: "Kệ hoa Khai Trương Hồng Phát",
      category: "Kệ khai trương",
      price_vnd: 1_500_000,
    },
    {
      id: "p6",
      code: "FL-9999",
      name: "Bình hoa VIP Đặt Riêng",
      category: "Bình hoa",
      price_vnd: null, // Liên hệ báo giá
    },
  ]

  it("removeVietnameseTones: chuẩn hóa tiếng Việt bỏ dấu chính xác", () => {
    expect(removeVietnameseTones("Kệ Hoa Viếng")).toBe("ke hoa vieng")
    expect(removeVietnameseTones("Đang bán")).toBe("dang ban")
    expect(removeVietnameseTones("Tình Yêu")).toBe("tinh yeu")
  })

  it("matchProductOccasion: nhận diện Dịp Chia buồn / Viếng từ tên và danh mục", () => {
    expect(matchProductOccasion(sampleProducts[0]!, "chia_buon")).toBe(true)
    expect(matchProductOccasion(sampleProducts[1]!, "chia_buon")).toBe(true)
    expect(matchProductOccasion(sampleProducts[2]!, "chia_buon")).toBe(false)
  })

  it("matchProductOccasion: nhận diện Dịp Sinh nhật từ attributes hoặc tên", () => {
    expect(matchProductOccasion(sampleProducts[2]!, "sinh_nhat")).toBe(true)
    expect(matchProductOccasion(sampleProducts[0]!, "sinh_nhat")).toBe(false)
  })

  it("matchProductOccasion: nhận diện Dịp Khai trương từ tên hoặc category", () => {
    expect(matchProductOccasion(sampleProducts[4]!, "khai_truong")).toBe(true)
    expect(matchProductOccasion(sampleProducts[2]!, "khai_truong")).toBe(false)
  })

  it("matchProductPrice: lọc theo bộ khoảng giá chung (mặc định), cận trên không tính", () => {
    // Dưới 500k (b1)
    expect(matchProductPrice(sampleProducts[2]!.price_vnd, "b1", null, null)).toBe(true)
    expect(matchProductPrice(sampleProducts[3]!.price_vnd, "b1", null, null)).toBe(false)

    // 500k - 800k (b2)
    expect(matchProductPrice(sampleProducts[3]!.price_vnd, "b2", null, null)).toBe(true)

    // 800k - 1.5tr (b3): 1.500.000 thuộc khoảng sau, không thuộc b3
    expect(matchProductPrice(sampleProducts[4]!.price_vnd, "b3", null, null)).toBe(false)
    expect(matchProductPrice(sampleProducts[4]!.price_vnd, "b4", null, null)).toBe(true)
    expect(matchProductPrice(sampleProducts[0]!.price_vnd, "b4", null, null)).toBe(true)

    // Giá null không vào các khoảng giá cụ thể
    expect(matchProductPrice(sampleProducts[5]!.price_vnd, "b1", null, null)).toBe(false)
    expect(matchProductPrice(sampleProducts[5]!.price_vnd, "all", null, null)).toBe(true)
  })

  it("matchProductPrice: dùng khoảng giá cửa hàng tự cấu hình", () => {
    const shop = [
      { id: "p1", label: "400k - <600k", min: 400_000, max: 600_000 },
      { id: "p2", label: "Từ 1tr5", min: 1_500_000, max: null },
    ]
    expect(matchProductPrice(450_000, "p1", null, null, shop)).toBe(true)
    expect(matchProductPrice(600_000, "p1", null, null, shop)).toBe(false)
    expect(matchProductPrice(2_412_000, "p2", null, null, shop)).toBe(true)
  })

  it("filterAndSortProducts: lọc kết hợp từ khoá, dịp và giá", () => {
    // Lọc Dịp Chia buồn
    const viengList = filterAndSortProducts(sampleProducts, {
      ...DEFAULT_FILTER_STATE,
      occasion: "chia_buon",
    })
    expect(viengList.map((p) => p.code)).toEqual(["BST-Basic-CB-035", "BST-Basic-CB-033"])

    // Lọc Dịp Chia buồn + Giá 1tr - 2tr
    const vieng1m2m = filterAndSortProducts(sampleProducts, {
      ...DEFAULT_FILTER_STATE,
      occasion: "chia_buon",
      priceRange: "1m_2m",
    }, [{ id: "1m_2m", label: "1tr - <2tr", min: 1_000_000, max: 2_000_000 }])
    expect(vieng1m2m.map((p) => p.code)).toEqual(["BST-Basic-CB-033"])

    // Sắp xếp giá tăng dần
    const sortedAsc = filterAndSortProducts(sampleProducts, {
      ...DEFAULT_FILTER_STATE,
      sortBy: "price_asc",
    })
    expect(sortedAsc[0]!.price_vnd).toBe(450_000)
    expect(sortedAsc[1]!.price_vnd).toBe(680_000)

    // Sắp xếp giá giảm dần
    const sortedDesc = filterAndSortProducts(sampleProducts, {
      ...DEFAULT_FILTER_STATE,
      sortBy: "price_desc",
    })
    expect(sortedDesc[0]!.price_vnd).toBe(2_412_000)
  })
})
