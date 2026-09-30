import { describe, expect, it } from "vitest"
import {
  getNextActionsForOutcome,
  NEXT_ACTIONS_REGISTRY,
} from "./next-actions-registry"

describe("next-actions-registry domain", () => {
  it("trả về danh sách hành động tiếp theo cho kết quả product-analyzed", () => {
    const actions = getNextActionsForOutcome("product-analyzed")
    expect(actions.length).toBeGreaterThanOrEqual(4)
    expect(actions.some((a) => a.isPrimary)).toBe(true)
  })

  it("trả về danh sách hành động tiếp theo cho kết quả order-created", () => {
    const actions = getNextActionsForOutcome("order-created")
    expect(actions.length).toBeGreaterThanOrEqual(2)
  })

  it("trả về mảng rỗng cho kết quả không tồn tại", () => {
    const actions = getNextActionsForOutcome("non-existent-outcome")
    expect(actions).toEqual([])
  })

  it("không chứa mã kỹ thuật bị cấm trong tiêu đề và mô tả (UX Lint R8)", () => {
    const forbiddenPatterns = [
      /\bM01[a-c]?\b/i,
      /\bM04[a-f]?\b/i,
      /\bRBAC\b/i,
      /\bSSOT\b/i,
      /\bChặng \d+\b/i,
    ]

    for (const key of Object.keys(NEXT_ACTIONS_REGISTRY)) {
      const actions = NEXT_ACTIONS_REGISTRY[key] || []
      for (const action of actions) {
        for (const pattern of forbiddenPatterns) {
          expect(action.label).not.toMatch(pattern)
          expect(action.description).not.toMatch(pattern)
        }
      }
    }
  })
})
