import { describe, expect, it } from "vitest"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import {
  budgetsOf,
  matchProducts,
  moodsOf,
  occasionsOf,
} from "@/components/greeting-card/customer/templates/aux/catalog-filters"
import { getSwipeTheme } from "@/components/greeting-card/customer/templates/swipe/swipe-themes"

const p = (o: Partial<GreetingCatalogProduct>): GreetingCatalogProduct => ({
  id: o.id ?? Math.random().toString(36),
  code: "X",
  name: o.name ?? "Mẫu",
  price: o.price ?? 500_000,
  imageUrl: null,
  sortOrder: 0,
  ...o,
})

const list = [
  p({ id: "a", name: "Bó hồng đỏ", price: 450_000, occasion: "Sinh nhật" }),
  p({ id: "b", name: "Kệ khai trương", price: 1_900_000, occasion: "Khai trương, Chúc mừng" }),
  p({ id: "c", name: "Giỏ hoa", price: 800_000, flowersSummary: "Cúc trắng, lá bạc" }),
]

describe("bộ lọc mẫu bổ trợ", () => {
  it("chỉ lấy dịp tặng có thật, tách theo dấu phẩy", () => {
    expect(occasionsOf(list)).toEqual(["Sinh nhật", "Khai trương", "Chúc mừng"])
  })

  it("lọc dịp tặng thực sự loại bỏ mẫu không khớp (không còn `|| true`)", () => {
    expect(matchProducts(list, "Khai trương", null).map((x) => x.id)).toEqual(["b"])
  })

  it("lọc theo ngân sách và kết hợp với dịp", () => {
    expect(matchProducts(list, null, "lt600").map((x) => x.id)).toEqual(["a"])
    expect(matchProducts(list, "Sinh nhật", "gt1200")).toEqual([])
  })

  it("chỉ hiện mức ngân sách có mẫu", () => {
    expect(budgetsOf([list[0]!]).map((b) => b.id)).toEqual(["lt600"])
  })

  it("chỉ hiện tông màu có mẫu khớp tên/thành phần", () => {
    expect(moodsOf(list).map((m) => m.id)).toEqual(["red", "white"])
    // "hoa hồng" là tên hoa, không tự xếp vào tông hồng
    expect(moodsOf([p({ name: "Bó hồng đỏ" })]).map((m) => m.id)).toEqual(["red"])
    expect(moodsOf([p({ name: "Bó hồng phấn" })]).map((m) => m.id)).toEqual(["pink"])
    expect(moodsOf([p({ name: "Kệ hoa" })])).toEqual([])
  })
})

describe("chủ đề thẻ vuốt", () => {
  it("ánh xạ cả số kiểu lẫn id mẫu, rơi về kiểu 01 khi lạ", () => {
    expect(getSwipeTheme("03").key).toBe("03")
    expect(getSwipeTheme("cinematic-dark").key).toBe("03")
    expect(getSwipeTheme("enterprise-luxury").key).toBe("enterprise")
    expect(getSwipeTheme("khong-co").key).toBe("01")
  })
})
