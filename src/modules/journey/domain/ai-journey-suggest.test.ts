import { describe, expect, it } from "vitest"
import { suggestJourneyFromPhoto } from "./ai-journey-suggest"

describe("ai-journey-suggest domain", () => {
  it("đưa ra gợi ý có phân cấp bước rõ ràng khi nhận ảnh", () => {
    const suggestion = suggestJourneyFromPhoto({
      hasImage: true,
      fileName: "hoa-khai-truong.jpg",
    })

    expect(suggestion.id).toBe("ai-suggest-photo-workflow")
    expect(suggestion.headline).toContain("xử lý ảnh sản phẩm")
    expect(suggestion.suggestedSteps.length).toBeGreaterThanOrEqual(2)
  })

  it("không chứa mã kỹ thuật bị cấm trong tiêu đề và mô tả (UX Lint R8)", () => {
    const forbiddenPatterns = [
      /\bM01[a-c]?\b/i,
      /\bM04[a-f]?\b/i,
      /\bRBAC\b/i,
      /\bSSOT\b/i,
      /\bChặng \d+\b/i,
    ]

    const suggestion = suggestJourneyFromPhoto({ hasImage: true })
    for (const pattern of forbiddenPatterns) {
      expect(suggestion.headline).not.toMatch(pattern)
      expect(suggestion.reasoning).not.toMatch(pattern)
      for (const step of suggestion.suggestedSteps) {
        expect(step.label).not.toMatch(pattern)
        if (step.description) {
          expect(step.description).not.toMatch(pattern)
        }
      }
    }
  })
})
