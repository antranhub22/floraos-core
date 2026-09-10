import { describe, expect, it } from "vitest"

import {
  canApproveAnalysis,
  canEditAnalysis,
  draftProductName,
  extractProductFieldsFromAnalysis,
  resolveEffectiveAnalysis,
} from "./product-analysis-rules"

describe("trạng thái duyệt", () => {
  it("sửa được khi PENDING hoặc REJECTED, không sửa được khi APPROVED", () => {
    expect(canEditAnalysis("PENDING")).toBe(true)
    expect(canEditAnalysis("REJECTED")).toBe(true)
    expect(canEditAnalysis("APPROVED")).toBe(false)
  })

  it("duyệt được khi chưa APPROVED — kể cả từ REJECTED (đặc tả 06 mục 8: chỉ chặn duyệt lại bản đã APPROVED)", () => {
    expect(canApproveAnalysis("PENDING")).toBe(true)
    expect(canApproveAnalysis("REJECTED")).toBe(true)
    expect(canApproveAnalysis("APPROVED")).toBe(false)
  })
})

describe("resolveEffectiveAnalysis", () => {
  const raw = { identity: { category: "Bó hoa" } }

  it("dùng raw khi chưa có edited", () => {
    expect(resolveEffectiveAnalysis(raw, null)).toBe(raw)
  })

  it("edited thắng raw khi có", () => {
    const edited = { identity: { category: "Giỏ hoa" } }
    expect(resolveEffectiveAnalysis(raw, edited)).toBe(edited)
  })
})

describe("extractProductFieldsFromAnalysis", () => {
  it("đọc đủ bốn trường identity", () => {
    const fields = extractProductFieldsFromAnalysis({
      identity: { category: "Bó hoa", shape: "Tròn", facing: "Một mặt", container: "Giấy gói" },
      bom: { flowers: [] },
      confidence: 87,
    })
    expect(fields.category).toBe("Bó hoa")
    expect(fields.shape).toBe("Tròn")
    expect(fields.facing).toBe("Một mặt")
    expect(fields.container).toBe("Giấy gói")
    expect(fields.attributes.bom).toEqual({ flowers: [] })
    expect(fields.attributes.confidence).toBe(87)
  })

  it("không ném lỗi khi identity thiếu hoặc sai hình dạng — trả null thay vì làm hỏng lượt duyệt", () => {
    expect(extractProductFieldsFromAnalysis({})).toEqual({
      category: null,
      shape: null,
      facing: null,
      container: null,
      attributes: { bom: null, confidence: null, checklist: null, san_xuat: null },
    })

    expect(extractProductFieldsFromAnalysis({ identity: "không phải object" })).toEqual({
      category: null,
      shape: null,
      facing: null,
      container: null,
      attributes: { bom: null, confidence: null, checklist: null, san_xuat: null },
    })
  })

  it("bỏ qua trường identity không phải chuỗi (vd null hợp lệ theo Schema.json)", () => {
    const fields = extractProductFieldsFromAnalysis({
      identity: { category: null, shape: 123, facing: "", container: "Khác" },
    })
    expect(fields.category).toBeNull()
    expect(fields.shape).toBeNull()
    expect(fields.facing).toBeNull()
    expect(fields.container).toBe("Khác")
  })
})

describe("draftProductName", () => {
  it("dùng category khi có", () => {
    expect(
      draftProductName({ category: "Bó hoa", shape: null, facing: null, container: null, attributes: {} })
    ).toBe("Bó hoa")
  })

  it("dùng tên mặc định khi category null", () => {
    expect(
      draftProductName({ category: null, shape: null, facing: null, container: null, attributes: {} })
    ).toBe("Sản phẩm chưa đặt tên")
  })
})
