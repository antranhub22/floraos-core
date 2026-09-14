import { describe, expect, it } from "vitest"
import {
  getDefaultAutoCapabilityIds,
  isCapabilitySupported,
  OPTIMIZATION_CAPABILITIES,
  resolveExecutionNotes,
} from "../optimization-capabilities"

describe("Optimization Capability Registry (M04a)", () => {
  it("chứa ít nhất 5 năng lực chuẩn ban đầu", () => {
    expect(OPTIMIZATION_CAPABILITIES.length).toBeGreaterThanOrEqual(5)
    const ids = OPTIMIZATION_CAPABILITIES.map((c) => c.id)
    expect(ids).toContain("upscale_clarity")
    expect(ids).toContain("remove_watermark")
    expect(ids).toContain("remove_background")
    expect(ids).toContain("enhance_lighting")
    expect(ids).toContain("smart_reframe")
  })

  it("OpenAI hỗ trợ 100% tất cả các năng lực", () => {
    for (const cap of OPTIMIZATION_CAPABILITIES) {
      expect(isCapabilitySupported(cap, "openai")).toBe(true)
    }
  })

  it("Real-ESRGAN / Local tự động vô hiệu hóa remove_watermark và remove_background", () => {
    const watermarkCap = OPTIMIZATION_CAPABILITIES.find((c) => c.id === "remove_watermark")!
    const bgCap = OPTIMIZATION_CAPABILITIES.find((c) => c.id === "remove_background")!
    const clarityCap = OPTIMIZATION_CAPABILITIES.find((c) => c.id === "upscale_clarity")!
    const reframeCap = OPTIMIZATION_CAPABILITIES.find((c) => c.id === "smart_reframe")!

    expect(isCapabilitySupported(watermarkCap, "local")).toBe(false)
    expect(isCapabilitySupported(watermarkCap, "realesrgan")).toBe(false)
    expect(isCapabilitySupported(bgCap, "local")).toBe(false)

    expect(isCapabilitySupported(clarityCap, "local")).toBe(true)
    expect(isCapabilitySupported(reframeCap, "local")).toBe(true)
  })

  it("getDefaultAutoCapabilityIds trả về đúng các năng lực defaultInAuto", () => {
    const autoIds = getDefaultAutoCapabilityIds()
    expect(autoIds).toContain("upscale_clarity")
    expect(autoIds).toContain("remove_watermark")
    expect(autoIds).not.toContain("add_marketing_text")
  })

  it("resolveExecutionNotes dịch đúng mảng ID sang danh sách thông điệp minh bạch", () => {
    const notes = resolveExecutionNotes(["remove_watermark", "upscale_clarity"])
    expect(notes).toHaveLength(2)
    expect(notes[0]).toContain("watermark")
    expect(notes[1]).toContain("siêu phân giải")
  })
})
