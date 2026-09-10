/**
 * Bản dịch của ba nhóm ca thử KHÔNG phụ thuộc dữ liệu "thẻ chào giá" trong
 * `FloraOS/floraos-web/tests/locTraCuu.test.ts` (219 dòng): đọc số
 * (`docSo` → `parseFlexibleNumber`), tỷ lệ (`docTyLeUuDai` → `normalizePercent`),
 * và câu cảnh báo (`lamSachCanhBao` → `sanitizeWarningText`). Các ca còn lại
 * của tệp gốc (ba lớp cắt trên bản ghi giá đã tính sẵn theo mã sản phẩm) đọc
 * dữ liệu không tồn tại trong phạm vi P6 — xem đầu `pricing-input.ts` và
 * `product-lookup.ts`.
 */
import { describe, expect, it } from "vitest"

import { normalizePercent, parseFlexibleNumber, sanitizeWarningText } from "./pricing-input"

describe("parseFlexibleNumber", () => {
  it("đọc được mọi kiểu ô người ta gõ vào", () => {
    expect(parseFlexibleNumber(500000)).toBe(500000)
    expect(parseFlexibleNumber("1.234.567")).toBe(1234567)
    expect(parseFlexibleNumber("1,234,567")).toBe(1234567)
    expect(parseFlexibleNumber("0,1")).toBe(0.1)
    expect(parseFlexibleNumber("0.1")).toBe(0.1)
    expect(parseFlexibleNumber("1.234,56")).toBe(1234.56)
    expect(parseFlexibleNumber("1,234.56")).toBe(1234.56)
    expect(parseFlexibleNumber("10%")).toBe(0.1)
    expect(parseFlexibleNumber("10 %")).toBe(0.1)
    expect(parseFlexibleNumber(" 65 ")).toBe(65)
  })

  it("trả null thay vì NaN cho ô không đọc được", () => {
    for (const value of ["", "   ", "abc", "%", null, undefined, {}, [], NaN, Infinity]) {
      expect(parseFlexibleNumber(value)).toBeNull()
    }
  })
})

describe("normalizePercent", () => {
  it("luôn nằm trong khoảng hợp lệ", () => {
    expect(normalizePercent(0.1, 0.1)).toEqual({ ratio: 0.1, suspicious: false })
    expect(normalizePercent(10, 0.1)).toEqual({ ratio: 0.1, suspicious: false })
    expect(normalizePercent("10%", 0.1)).toEqual({ ratio: 0.1, suspicious: false })
    expect(normalizePercent(null, 0.15)).toEqual({ ratio: 0.15, suspicious: false })
    expect(normalizePercent(-1, 0.1)).toEqual({ ratio: 0.1, suspicious: true })
    expect(normalizePercent(150, 0.1)).toEqual({ ratio: 0.1, suspicious: true })
  })
})

describe("sanitizeWarningText", () => {
  const MISCOUNT_WARNING =
    "ĐẾM SAI: 1 dòng vượt trần số lượng — giá vốn dưới đây CÓ tính các dòng này"

  it("không nhắc tới giá vốn trên màn không có giá vốn", () => {
    const cleaned = sanitizeWarningText(MISCOUNT_WARNING)
    expect(cleaned).toBe("ĐẾM SAI: 1 dòng vượt trần số lượng")
    expect(cleaned).not.toMatch(/giá\s*vốn/i)
  })

  it("mệnh đề lành lặn được giữ nguyên", () => {
    expect(sanitizeWarningText("Giá dưới sàn — cần Điều hành duyệt")).toBe(
      "Giá dưới sàn — cần Điều hành duyệt"
    )
    expect(sanitizeWarningText("")).toBe("")
    expect(sanitizeWarningText(null)).toBe("")
  })
})
