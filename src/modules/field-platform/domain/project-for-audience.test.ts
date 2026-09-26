import { describe, expect, it } from "vitest"
import { projectForAudience } from "./project-for-audience"
import type { EffectiveFieldConfig } from "./field-rules"

const configs: EffectiveFieldConfig[] = [
  {
    key: "unitPriceVnd",
    entity: "ORDER",
    dataType: "MONEY_VND",
    label: "Giá bán",
    requirement: "REQUIRED",
    visibility: { INTERNAL: true, PARTNER: false, SHIPPER: false, CUSTOMER: false },
    isEnabled: true,
    sensitivity: "NORMAL",
  },
  {
    key: "recipientName",
    entity: "ORDER",
    dataType: "TEXT",
    label: "Tên người nhận",
    requirement: "REQUIRED",
    visibility: { INTERNAL: true, PARTNER: true, SHIPPER: true, CUSTOMER: false },
    isEnabled: true,
    sensitivity: "NORMAL",
  },
]

describe("projectForAudience — cửa duy nhất lọc theo đối tượng xem (3.11)", () => {
  const view = { unitPriceVnd: 500000, recipientName: "Chị Lan", productTitle: "Bó hồng đỏ" }

  it("INTERNAL thấy mọi thứ, kể cả khoá không có cấu hình", () => {
    expect(projectForAudience(view, configs, "INTERNAL")).toEqual(view)
  })

  it("PARTNER không thấy giá bán, vẫn thấy tên người nhận và khoá chưa khai (productTitle)", () => {
    const result = projectForAudience(view, configs, "PARTNER")
    expect(result).not.toHaveProperty("unitPriceVnd")
    expect(result.recipientName).toBe("Chị Lan")
    expect(result.productTitle).toBe("Bó hồng đỏ")
  })

  it("CUSTOMER không thấy giá bán lẫn tên người nhận", () => {
    const result = projectForAudience(view, configs, "CUSTOMER")
    expect(result).not.toHaveProperty("unitPriceVnd")
    expect(result).not.toHaveProperty("recipientName")
  })
})
