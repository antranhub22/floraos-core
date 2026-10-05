import { describe, expect, it } from "vitest"
import {
  DEFAULT_ENABLED_FIELDS,
  enabledFieldsFor,
  readDisplaySettings,
  sanitizeEnabledFields,
} from "@/modules/greeting-card/domain/display-fields"
import { catalogItemToProduct } from "@/modules/greeting-card/domain/catalog-product-price"
import {
  readFlowerNames,
  readOccasions,
  readStyle,
  readWrapStyle,
} from "@/modules/products/domain/master-index-fields"

describe("cấu hình bật/tắt trường hiển thị", () => {
  it("mẫu chưa chỉnh dùng mặc định (bật tất cả)", () => {
    expect(enabledFieldsFor({}, "lookbook-grid")).toEqual(DEFAULT_ENABLED_FIELDS)
  })
  it("bỏ khoá lạ, giữ thứ tự chuẩn", () => {
    expect(sanitizeEnabledFields(["category", "giaVon", "flowers", "flowers"])).toEqual(["flowers", "category"])
  })
  it("đọc theo từng mẫu từ organizations.settings, bỏ qua dữ liệu hỏng", () => {
    const s = readDisplaySettings({ greetingCardDisplay: { "cinematic-dark": ["style"], "lookbook-grid": "hỏng" }, khac: 1 })
    expect(s["cinematic-dark"]).toEqual(["style"])
    expect(s["lookbook-grid"]).toEqual(DEFAULT_ENABLED_FIELDS)
    expect(readDisplaySettings(null)).toEqual({})
  })
})

describe("trường lấy từ Master Index", () => {
  const analysis = {
    identity: { phong_cach: "Hàn Quốc", dip_su_dung: "Sinh nhật" },
    bom: {
      flowers: [{ name: "Hồng Ohara" }, { nhom_hoa: "Cúc Tana" }, { name: "Hồng Ohara" }],
      wrapping: [{ layer: "Lớp trong", material: "Giấy lụa" }, { layer: "Lớp ngoài", material: "Giấy kraft", color: "nâu" }],
    },
  }
  const src = { category: "Bó hoa", attributes: { salesData: { occasions: ["Kỷ niệm"] }, costPrice: 300000 }, analysis }

  it("đọc đúng quy tắc của Master Index", () => {
    expect(readStyle(src)).toBe("Hàn Quốc")
    expect(readOccasions(src)).toEqual(["Kỷ niệm", "Sinh nhật"])
    expect(readFlowerNames(src)).toEqual(["Hồng Ohara", "Cúc Tana"])
    expect(readWrapStyle(src)).toBe("Giấy kraft nâu")
  })

  it("sản phẩm thẻ chào nhận các trường đó, không mang dữ liệu nội bộ", () => {
    const p = catalogItemToProduct({
      sort_order: 0,
      product: { id: "p", code: "ML-1", name: "Bó hồng", category: "Bó hoa", attributes: src.attributes, analyses: [{ raw: analysis }] },
    })
    expect(p).toMatchObject({ style: "Hàn Quốc", flowersSummary: "Hồng Ohara, Cúc Tana", wrapStyle: "Giấy kraft nâu", category: "Bó hoa" })
    expect(JSON.stringify(p)).not.toContain("300000")
  })
})
