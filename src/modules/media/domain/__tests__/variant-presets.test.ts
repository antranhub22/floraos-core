import { describe, expect, it } from "vitest"
import {
  M04B_VARIANT_PRESETS,
  getVariantPreset,
  isValidVariantPreset,
} from "@/modules/media/domain/variant-presets"

describe("M04B_VARIANT_PRESETS", () => {
  it("contains all 6 core presets", () => {
    expect(M04B_VARIANT_PRESETS.length).toBe(6)
    const ids = M04B_VARIANT_PRESETS.map((p) => p.id)
    expect(ids).toContain("transparent")
    expect(ids).toContain("studio_white")
    expect(ids).toContain("wedding")
    expect(ids).toContain("living_room")
    expect(ids).toContain("wood_minimal")
    expect(ids).toContain("luxury_hotel")
  })

  it("transparent preset has correct tag and description", () => {
    const transparent = getVariantPreset("transparent")
    expect(transparent.name).toContain("trong suốt")
    expect(transparent.tag).toBe("AIC-11 Lõi")
  })

  it("validates preset id correctly", () => {
    expect(isValidVariantPreset("transparent")).toBe(true)
    expect(isValidVariantPreset("luxury_hotel")).toBe(true)
    expect(isValidVariantPreset("non-existent-preset")).toBe(false)
  })

  it("falls back to transparent (first preset) for unknown preset ids", () => {
    const fallback = getVariantPreset("unknown-id")
    expect(fallback.id).toBe("transparent")
  })
})
