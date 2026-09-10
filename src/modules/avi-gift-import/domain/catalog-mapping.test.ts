import { describe, expect, it } from "vitest"

import {
  CATALOG_IMPORT_SOURCE,
  deriveProductStatus,
  InvalidCatalogRowError,
  mapCatalogRowToProduct,
  validateCatalogRow,
  type CatalogSourceRow,
} from "./catalog-mapping"

function row(overrides: Partial<CatalogSourceRow> = {}): CatalogSourceRow {
  return {
    code: "BHBB0001",
    name: "Bó hoa baby Giấc Mơ Nhỏ",
    styleRaw: "KC01 Bó",
    styleDetailCode: "KC01-M",
    sizeCode: "M",
    templateCode: "TPL02",
    styleSource: "Website",
    occasion: null,
    sellPriceVnd: 780000,
    costVnd: 410937,
    laborCostVnd: 43750,
    priceStatus: "HỢP LỆ",
    priceWarning: null,
    floorVnd: 410937,
    ceilingVnd: 429000,
    profileStatus: "Chưa có ảnh",
    componentCount: 2,
    ingredientCount: 4,
    bom: [],
    ...overrides,
  }
}

describe("deriveProductStatus", () => {
  it("'Chưa có ảnh' → DRAFT", () => {
    expect(deriveProductStatus("Chưa có ảnh")).toBe("DRAFT")
  })

  it("rỗng hoặc null → DRAFT", () => {
    expect(deriveProductStatus(null)).toBe("DRAFT")
    expect(deriveProductStatus("")).toBe("DRAFT")
  })

  it("có giá trị khác 'Chưa có ảnh' → ACTIVE", () => {
    expect(deriveProductStatus("Đã có ảnh")).toBe("ACTIVE")
  })

  it("không phân biệt hoa thường/khoảng trắng thừa", () => {
    expect(deriveProductStatus("  CHƯA CÓ ẢNH  ")).toBe("DRAFT")
  })
})

describe("mapCatalogRowToProduct", () => {
  it("ném lỗi khi thiếu code", () => {
    expect(() => mapCatalogRowToProduct(row({ code: "" }), new Date())).toThrow(
      InvalidCatalogRowError
    )
  })

  it("ném lỗi khi thiếu name", () => {
    expect(() => mapCatalogRowToProduct(row({ name: "" }), new Date())).toThrow(
      InvalidCatalogRowError
    )
  })

  it("dựng đúng code/name/status", () => {
    const out = mapCatalogRowToProduct(row(), new Date("2026-09-10T00:00:00Z"))
    expect(out.code).toBe("BHBB0001")
    expect(out.name).toBe("Bó hoa baby Giấc Mơ Nhỏ")
    expect(out.status).toBe("DRAFT")
  })

  it("không gán category/shape/facing/container — không giả mạo kết quả Vision", () => {
    const out = mapCatalogRowToProduct(row(), new Date())
    expect(out).not.toHaveProperty("category")
    expect(out).not.toHaveProperty("shape")
  })

  it("giữ nguyên từ vựng nghiệp vụ v1 trong attributes.catalog", () => {
    const out = mapCatalogRowToProduct(row({ occasion: "Sinh nhật" }), new Date())
    expect(out.attributes.catalog).toEqual({
      styleRaw: "KC01 Bó",
      styleDetailCode: "KC01-M",
      sizeCode: "M",
      templateCode: "TPL02",
      styleSource: "Website",
      occasion: "Sinh nhật",
    })
  })

  it("priceGuard chỉ có khi cả Sàn lẫn Trần đều có giá trị dương", () => {
    const withGuard = mapCatalogRowToProduct(row(), new Date())
    expect(withGuard.attributes.priceGuard).toEqual({ floorVnd: 410937, ceilingVnd: 429000 })

    const noCost = mapCatalogRowToProduct(
      row({ floorVnd: null, ceilingVnd: null, priceStatus: "CHƯA CÓ GIÁ VỐN" }),
      new Date()
    )
    expect(noCost.attributes.priceGuard).toBeNull()

    const bothZero = mapCatalogRowToProduct(row({ floorVnd: 0, ceilingVnd: 0 }), new Date())
    expect(bothZero.attributes.priceGuard).toBeNull()
  })

  it("ghi nguồn và thời điểm nạp vào aviGiftImport", () => {
    const importedAt = new Date("2026-09-10T08:00:00Z")
    const out = mapCatalogRowToProduct(row(), importedAt)
    expect(out.attributes.aviGiftImport).toEqual({
      source: CATALOG_IMPORT_SOURCE,
      importedAt: importedAt.toISOString(),
    })
  })

  it("mang theo BOM nguyên vẹn", () => {
    const bom = [
      {
        group: "Nguyên liệu",
        componentCode: "TPHP0001",
        componentName: "Hoa lá phụ bó nhỏ",
        unit: "Cành",
        qty: 5,
        qtyMin: 4,
        qtyMax: 6,
        source: "Ảnh",
        confidencePercent: 100,
        lockStatus: "Đã chốt",
        unitPriceVnd: 1500,
        lineTotalVnd: 7500,
      },
    ]
    const out = mapCatalogRowToProduct(row({ bom }), new Date())
    expect(out.attributes.bom).toEqual(bom)
  })
})

describe("validateCatalogRow", () => {
  it("không có Giá bán → cảnh báo", () => {
    const warnings = validateCatalogRow(row({ sellPriceVnd: null }))
    expect(warnings).toContain("BHBB0001: không có Giá bán")
  })

  it("Sàn lớn hơn Trần → cảnh báo", () => {
    const warnings = validateCatalogRow(row({ floorVnd: 500000, ceilingVnd: 400000 }))
    expect(warnings.some((w) => w.includes("Sàn") && w.includes("Trần"))).toBe(true)
  })

  it("dòng sạch không có cảnh báo", () => {
    const bom = [
      {
        group: "Nguyên liệu",
        componentCode: "TPHP0001",
        componentName: "Hoa lá phụ bó nhỏ",
        unit: "Cành",
        qty: 5,
        qtyMin: 4,
        qtyMax: 6,
        source: "Ảnh",
        confidencePercent: 100,
        lockStatus: "Đã chốt",
        unitPriceVnd: 1500,
        lineTotalVnd: 7500,
      },
    ]
    expect(validateCatalogRow(row({ bom }))).toEqual([])
  })

  it("có giá vốn nhưng không BOM → cảnh báo", () => {
    const warnings = validateCatalogRow(row({ priceStatus: "HỢP LỆ", bom: [] }))
    expect(warnings.some((w) => w.includes("BOM"))).toBe(true)
  })
})
