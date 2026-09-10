import { describe, expect, it } from "vitest"

import {
  contractVersionFromSchema,
  draftNameForNewProduct,
  extensionFromFileName,
  extractIdentity,
  InvalidAnalysisRowError,
  mapAnalysisRow,
  parseHistoricalTimestamp,
  type AnalysisImageSource,
  type AnalysisSourceRow,
} from "./analysis-mapping"

function image(fileName: string): AnalysisImageSource {
  return {
    fileName,
    absolutePath: `/nguon/images/BHSK0001/${fileName}`,
    mimeType: "image/jpeg",
    fileSize: 473_794,
    width: 1024,
    height: 1024,
    sha256: "ec08d415ca492fc8".padEnd(64, "0"),
  }
}

function row(overrides: Partial<AnalysisSourceRow> = {}): AnalysisSourceRow {
  return {
    code: "BHSK0001",
    analyzedFileName: "BHSK0001-1.jpg",
    analyzedAt: "2026-08-10 12:45:34",
    schemaVersion: 10,
    images: [image("BHSK0001-1.jpg"), image("BHSK0001-2.jpg")],
    analysis: { identity: { category: "Bó hoa", shape: "Tròn", facing: "Một mặt", container: "Giấy gói" } },
    ...overrides,
  }
}

describe("analysis-mapping (P8, nợ #34)", () => {
  it("map một bản ghi đủ trường", () => {
    const mapped = mapAnalysisRow(row())
    expect(mapped.code).toBe("BHSK0001")
    expect(mapped.analyzedFileName).toBe("BHSK0001-1.jpg")
    expect(mapped.contractVersion).toBe("v1-schema-10")
    expect(mapped.images).toHaveLength(2)
    // `raw` giữ NGUYÊN khối máy trả về, không cắt gọt trường nào.
    expect(mapped.raw).toEqual(row().analysis)
  })

  it("ném khi thiếu code, thiếu analysis, hoặc không có ảnh nào", () => {
    expect(() => mapAnalysisRow(row({ code: "   " }))).toThrow(InvalidAnalysisRowError)
    expect(() => mapAnalysisRow(row({ analysis: {} }))).toThrow(InvalidAnalysisRowError)
    expect(() => mapAnalysisRow(row({ images: [] }))).toThrow(InvalidAnalysisRowError)
  })

  it("ném khi ảnh đã phân tích không nằm trong danh sách ảnh", () => {
    // Bản ghi tự mâu thuẫn — nạp tiếp sẽ tạo `product_analyses` trỏ vào một
    // `asset` không bao giờ được dựng.
    expect(() =>
      mapAnalysisRow(row({ analyzedFileName: "BHSK0001-9.jpg" }))
    ).toThrow(/không có trong danh sách ảnh/)
  })

  it("đọc dấu thời gian của v1, trả null khi hỏng hoặc thiếu", () => {
    expect(parseHistoricalTimestamp("2026-08-10 12:45:34")?.getFullYear()).toBe(2026)
    expect(parseHistoricalTimestamp(null)).toBeNull()
    expect(parseHistoricalTimestamp("không phải ngày")).toBeNull()
  })

  it("contract_version luôn có giá trị, kể cả khi thiếu schema_version", () => {
    expect(contractVersionFromSchema(10)).toBe("v1-schema-10")
    expect(contractVersionFromSchema(null)).toBe("v1-schema-khong-ro")
    expect(contractVersionFromSchema(1.5)).toBe("v1-schema-khong-ro")
  })

  it("lấy bốn trường nhận dạng, chịu được analysis thiếu khối identity", () => {
    expect(extractIdentity(row().analysis)).toEqual({
      category: "Bó hoa",
      shape: "Tròn",
      facing: "Một mặt",
      container: "Giấy gói",
    })
    const rong = { category: null, shape: null, facing: null, container: null }
    expect(extractIdentity({})).toEqual(rong)
    expect(extractIdentity({ identity: null })).toEqual(rong)
    // Chuỗi rỗng không phải một giá trị nhận dạng.
    expect(extractIdentity({ identity: { category: "  " } }).category).toBeNull()
  })

  it("đặt tên cho sản phẩm phải tạo mới, luôn giữ mã trong tên", () => {
    expect(
      draftNameForNewProduct("GHTM", {
        category: "Giỏ hoa",
        shape: "Bán cầu",
        facing: null,
        container: null,
      })
    ).toBe("Giỏ hoa Bán cầu GHTM")
    expect(
      draftNameForNewProduct("MM17082026", {
        category: null,
        shape: null,
        facing: null,
        container: null,
      })
    ).toBe("MM17082026")
  })

  it("suy đuôi tệp từ tên, không từ mime type", () => {
    expect(extensionFromFileName("GHTN0001-1.jpeg")).toBe("jpeg")
    expect(extensionFromFileName("KG-20260831-001-1.webp")).toBe("webp")
    expect(extensionFromFileName("GHTM-1.PNG")).toBe("png")
    expect(() => extensionFromFileName("khong-co-duoi")).toThrow(InvalidAnalysisRowError)
  })
})
