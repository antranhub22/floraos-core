import { describe, expect, it } from "vitest"

import { mergeOccasions } from "../product-master-index"

describe("mergeOccasions — hợp nhất dịp sử dụng từ hai nguồn M01/M01b", () => {
  it("giữ dịp do người duyệt M01b chọn tay, không chỉ dịp AI đoán ở M01", () => {
    expect(mergeOccasions(["Sinh nhật", "Kỷ niệm"], "Khai trương")).toEqual([
      "Sinh nhật",
      "Kỷ niệm",
      "Khai trương",
    ])
  })

  it("không tạo trùng khi AI đoán trùng với lựa chọn của người duyệt", () => {
    expect(mergeOccasions(["Sinh nhật"], "Sinh nhật")).toEqual(["Sinh nhật"])
  })

  it("chỉ có AI đoán, sản phẩm chưa qua duyệt M01b", () => {
    expect(mergeOccasions(undefined, "Valentine")).toEqual(["Valentine"])
  })

  it("chỉ có dữ liệu người duyệt, AI không đoán được dịp (null)", () => {
    expect(mergeOccasions(["Chia buồn"], undefined)).toEqual(["Chia buồn"])
  })

  it("không có nguồn nào thì trả mảng rỗng, không bịa một dịp mặc định", () => {
    expect(mergeOccasions(undefined, undefined)).toEqual([])
  })

  it("bỏ chuỗi rỗng/khoảng trắng thay vì giữ lại một dịp trống", () => {
    expect(mergeOccasions(["  ", "Sinh nhật"], "")).toEqual(["Sinh nhật"])
  })
})
