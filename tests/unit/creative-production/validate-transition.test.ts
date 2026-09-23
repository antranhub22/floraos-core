/**
 * Unit tests: validate-transition.ts
 *
 * Kiểm tra cổng chuyển tiếp Chặng 4 → Creative Studio.
 */

import { describe, it, expect } from "vitest"
import {
  validateTransition,
  type TransitionInput,
} from "@/modules/creative-production/domain/validate-transition"

// ============================================================
// FIXTURES
// ============================================================

const FULL_INPUT: TransitionInput = {
  topicId: "topic-123",
  mode: "CREATIVE",
  sourceImageUrl: "data:image/jpeg;base64,/9j/4AAQ...",
  sourceVideoUrl: "https://storage.example.com/video.mp4",
  productName: "Bó hoa hồng đỏ 20 cành",
  productId: "prod-456",
  assetId: "asset-789",
  commercialPassport: {
    category: "Bó hoa",
    style: "Sang trọng",
    components: ["Hoa hồng đỏ", "Lá Eucalyptus"],
    colors: ["Đỏ", "Xanh lá"],
    priceRange: "500.000 - 800.000 VNĐ",
    targetAudience: "Nam giới 25-40 tuổi",
    suggestedOccasions: ["Valentine", "Sinh nhật"],
  },
  hasReport: true,
  hasTopics: true,
  voiceId: "vi-female-01",
  musicMood: "romantic",
}

const MINIMAL_VALID_INPUT: TransitionInput = {
  topicId: "topic-123",
  mode: "CREATIVE",
  sourceImageUrl: "data:image/jpeg;base64,/9j/4AAQ...",
  productName: "Bó hoa hồng đỏ",
  assetId: "asset-789",
  commercialPassport: {
    category: "Bó hoa",
    style: "Sang trọng",
    components: ["Hoa hồng đỏ"],
    colors: ["Đỏ"],
  },
}

// ============================================================
// TESTS
// ============================================================

describe("validateTransition", () => {
  it("should pass with full input — 100% completion", () => {
    const result = validateTransition(FULL_INPUT)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.completionPercent).toBe(100)
    expect(result.fields.length).toBeGreaterThan(0)
  })

  it("should pass with minimal valid input — required fields only", () => {
    const result = validateTransition(MINIMAL_VALID_INPUT)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    // Should have warnings for missing optional fields
    expect(result.warnings.length).toBeGreaterThan(0)
    // Completion < 100 because optional fields are missing
    expect(result.completionPercent).toBeLessThan(100)
    expect(result.completionPercent).toBeGreaterThanOrEqual(80)
  })

  it("should fail when topicId is missing", () => {
    const input: TransitionInput = {
      ...MINIMAL_VALID_INPUT,
      topicId: undefined,
    }
    const result = validateTransition(input)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some((e) => e.includes("Topic"))).toBe(true)
  })

  it("should fail when mode is missing", () => {
    const input: TransitionInput = {
      ...MINIMAL_VALID_INPUT,
      mode: undefined,
    }
    const result = validateTransition(input)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("Loại hình"))).toBe(true)
  })

  it("should fail when sourceImageUrl is missing", () => {
    const input: TransitionInput = {
      ...MINIMAL_VALID_INPUT,
      sourceImageUrl: undefined,
    }
    const result = validateTransition(input)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("Ảnh sản phẩm"))).toBe(true)
  })

  it("should fail when productName is missing", () => {
    const input: TransitionInput = {
      ...MINIMAL_VALID_INPUT,
      productName: undefined,
    }
    const result = validateTransition(input)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("Tên sản phẩm"))).toBe(true)
  })

  it("should fail when assetId is missing — ảnh chưa lưu vào kho", () => {
    const input: TransitionInput = {
      ...MINIMAL_VALID_INPUT,
      assetId: undefined,
    }
    const result = validateTransition(input)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("Asset ID"))).toBe(true)
  })

  it("should fail when passport category is missing", () => {
    const input: TransitionInput = {
      ...MINIMAL_VALID_INPUT,
      commercialPassport: {
        ...MINIMAL_VALID_INPUT.commercialPassport!,
        category: undefined,
      },
    }
    const result = validateTransition(input)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("Danh mục"))).toBe(true)
  })

  it("should fail when passport components is empty", () => {
    const input: TransitionInput = {
      ...MINIMAL_VALID_INPUT,
      commercialPassport: {
        ...MINIMAL_VALID_INPUT.commercialPassport!,
        components: [],
      },
    }
    const result = validateTransition(input)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("Thành phần hoa"))).toBe(true)
  })

  it("should fail when no passport at all", () => {
    const input: TransitionInput = {
      topicId: "topic-123",
      mode: "CREATIVE",
      sourceImageUrl: "data:image/jpeg;base64,...",
      productName: "Bó hoa",
      commercialPassport: undefined,
    }
    const result = validateTransition(input)

    expect(result.valid).toBe(false)
    // Should have 4 errors: category, style, components, colors
    expect(result.errors.length).toBeGreaterThanOrEqual(4)
  })

  it("should fail with empty input — all required fields missing", () => {
    const result = validateTransition({})

    expect(result.valid).toBe(false)
    // At least 8 required fields missing
    expect(result.errors.length).toBeGreaterThanOrEqual(8)
    expect(result.completionPercent).toBeLessThan(20)
  })

  it("should truncate long field summaries", () => {
    const longName = "A".repeat(100)
    const input: TransitionInput = {
      ...MINIMAL_VALID_INPUT,
      productName: longName,
    }
    const result = validateTransition(input)
    const nameField = result.fields.find((f) => f.field === "productName")

    expect(nameField?.summary.length).toBeLessThanOrEqual(60)
    expect(nameField?.summary.endsWith("…")).toBe(true)
  })

  it("should return correct source labels for each field", () => {
    const result = validateTransition(FULL_INPUT)

    const topicField = result.fields.find((f) => f.field === "topicId")
    expect(topicField?.source).toBe("Chặng 04 IDEATE")

    const imageField = result.fields.find((f) => f.field === "sourceImageUrl")
    expect(imageField?.source).toBe("Chặng 01 BRING")

    const nameField = result.fields.find((f) => f.field === "productName")
    expect(nameField?.source).toBe("Chặng 02 UNDERSTAND")
  })

  it("should calculate completion percent correctly", () => {
    // All present → 100
    expect(validateTransition(FULL_INPUT).completionPercent).toBe(100)

    // No required, no optional → should be very low
    expect(validateTransition({}).completionPercent).toBeLessThan(20)

    // Required present, optional missing → ~80
    const minResult = validateTransition(MINIMAL_VALID_INPUT)
    expect(minResult.completionPercent).toBeGreaterThanOrEqual(80)
    expect(minResult.completionPercent).toBeLessThan(100)
  })
})
