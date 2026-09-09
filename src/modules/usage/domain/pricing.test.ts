import { describe, expect, it } from "vitest"

import { costCreditForFeature } from "./pricing"

describe("costCreditForFeature", () => {
  it("trả đúng giá đã biết", () => {
    expect(costCreditForFeature("vision.analyze")).toBe(1)
    expect(costCreditForFeature("media.optimize")).toBe(2)
  })

  it("feature lạ dùng giá mặc định, không ném lỗi", () => {
    expect(costCreditForFeature("mot.feature.chua-tung-thay")).toBe(1)
  })
})
