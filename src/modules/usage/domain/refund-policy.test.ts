import { describe, expect, it } from "vitest"

import { duocHoanCredit, lyDoHoanCredit } from "./refund-policy"

describe("lyDoHoanCredit", () => {
  it("job bị Identity Guard từ chối — quyết định D3", () => {
    expect(lyDoHoanCredit({ status: "COMPLETED", result: "REJECTED" })).toBe("guard-tu-choi")
  })

  it("job bị huỷ khi còn xếp hàng — chưa lời gọi nhà cung cấp nào phát sinh", () => {
    expect(lyDoHoanCredit({ status: "CANCELLED", result: null })).toBe("bi-huy")
  })

  it("job hỏng vì lỗi kỹ thuật — nền tảng hỏng, không phải khách dùng sai", () => {
    expect(lyDoHoanCredit({ status: "FAILED", result: null })).toBe("loi-ky-thuat")
    expect(lyDoHoanCredit({ status: "FAILED", result: "OK" })).toBe("loi-ky-thuat")
  })

  it("lượt chạy giao đúng thứ khách mua thì không hoàn", () => {
    expect(lyDoHoanCredit({ status: "COMPLETED", result: "OK" })).toBeNull()
    expect(lyDoHoanCredit({ status: "COMPLETED", result: "SAFE" })).toBeNull()
    expect(lyDoHoanCredit({ status: "COMPLETED", result: "WARNING" })).toBeNull()
  })

  it("LOW_CONFIDENCE là kết quả thật kèm cảnh báo, không phải lượt hỏng", () => {
    expect(lyDoHoanCredit({ status: "COMPLETED", result: "LOW_CONFIDENCE" })).toBeNull()
  })

  it("job chưa kết thúc thì chưa có gì để quyết", () => {
    expect(duocHoanCredit({ status: "PENDING", result: null })).toBe(false)
    expect(duocHoanCredit({ status: "PROCESSING", result: null })).toBe(false)
  })
})
