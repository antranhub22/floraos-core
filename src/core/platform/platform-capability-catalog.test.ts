import { describe, expect, it } from "vitest"

import {
  ALL_PLATFORM_CAPABILITY_CODES,
  isPlatformCapabilityCode,
  PLATFORM_CAPABILITIES,
  platformCapability,
} from "./platform-capability-catalog"

describe("platform-capability-catalog", () => {
  it("có đúng tám mã N1..N8, không nhiều hơn không ít hơn", () => {
    expect(ALL_PLATFORM_CAPABILITY_CODES).toEqual(["N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8"])
  })

  it("N9-N11 không tồn tại trong dải này — thuộc tuyến AI-1", () => {
    expect(isPlatformCapabilityCode("N9")).toBe(false)
    expect(isPlatformCapabilityCode("N10")).toBe(false)
    expect(isPlatformCapabilityCode("N11")).toBe(false)
  })

  it("không mã nào trùng với dải mã tenant (A-L, chữ cái khác N)", () => {
    for (const code of ALL_PLATFORM_CAPABILITY_CODES) {
      expect(code.startsWith("N")).toBe(true)
    }
  })

  it("mỗi mã có code khớp key và tên đọc được duy nhất", () => {
    const names = new Set<string>()
    for (const code of ALL_PLATFORM_CAPABILITY_CODES) {
      const def = platformCapability(code)
      expect(def.code).toBe(code)
      names.add(def.name)
    }
    expect(names.size).toBe(ALL_PLATFORM_CAPABILITY_CODES.length)
  })

  it("platformCapability ném lỗi rõ ràng cho mã không tồn tại", () => {
    expect(() => platformCapability("N99")).toThrow(/không tồn tại/)
  })

  it("PLATFORM_CAPABILITIES là nguồn duy nhất — không tách rời với ALL_PLATFORM_CAPABILITY_CODES", () => {
    expect(Object.keys(PLATFORM_CAPABILITIES).sort()).toEqual([...ALL_PLATFORM_CAPABILITY_CODES])
  })
})
