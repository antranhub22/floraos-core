import { describe, expect, it } from "vitest"
import { demoDataEnabled } from "./demo-data"

describe("demoDataEnabled", () => {
  it("máy chủ thật (production) mặc định SẠCH; chỉ nạp mẫu khi bật rõ SEED_DEV_DATA=true", () => {
    expect(demoDataEnabled({ NODE_ENV: "production" })).toBe(false)
    expect(demoDataEnabled({ NODE_ENV: "production", SEED_DEV_DATA: "false" })).toBe(false)
    expect(demoDataEnabled({ NODE_ENV: "production", SEED_DEV_DATA: "true" })).toBe(true)
    expect(demoDataEnabled({ NODE_ENV: "development" })).toBe(true)
  })
})
