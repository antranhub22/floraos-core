import { describe, expect, it } from "vitest"
import { composeWorkflow, filterExcludedSteps } from "./workflow-composer"
import type { JourneyStepDefinition } from "./journey-model"

describe("workflow-composer domain", () => {
  const sampleSteps: JourneyStepDefinition[] = [
    {
      id: "step-1",
      label: "Bước 1: Ảnh",
      inputType: "IMAGE_UPLOAD",
      isOptional: false,
      nextStepId: null,
    },
    {
      id: "step-2",
      label: "Bước 2: Báo giá",
      inputType: "NONE",
      isOptional: true,
      nextStepId: null,
    },
    {
      id: "step-3",
      label: "Bước 3: Mở bán",
      inputType: "CONFIRMATION",
      isOptional: false,
      nextStepId: null,
    },
  ]

  it("ghép các bước thành combo và tự động liên kết nextStepId", () => {
    const combo = composeWorkflow({
      id: "my-combo",
      goal: "Combo thử nghiệm",
      description: "Mô tả combo",
      icon: "Rocket",
      roleScope: "STORE",
      steps: sampleSteps,
    })

    expect(combo.category).toBe("COMBO")
    expect(combo.steps).toHaveLength(3)
    expect(combo.steps[0]?.nextStepId).toBe("step-2")
    expect(combo.steps[1]?.nextStepId).toBe("step-3")
    expect(combo.steps[2]?.nextStepId).toBeNull()
  })

  it("loại bỏ bước tùy chọn và tái liên kết các bước còn lại", () => {
    const combo = composeWorkflow({
      id: "my-combo",
      goal: "Combo thử nghiệm",
      description: "Mô tả combo",
      icon: "Rocket",
      roleScope: "STORE",
      steps: sampleSteps,
    })

    // Loại bỏ bước 2 (tùy chọn)
    const filtered = filterExcludedSteps(combo, ["step-2"])
    expect(filtered.steps).toHaveLength(2)
    expect(filtered.steps[0]?.id).toBe("step-1")
    expect(filtered.steps[0]?.nextStepId).toBe("step-3")
    expect(filtered.steps[1]?.id).toBe("step-3")
    expect(filtered.steps[1]?.nextStepId).toBeNull()
  })

  it("không loại bỏ bước bắt buộc dù có nằm trong danh sách excluded", () => {
    const combo = composeWorkflow({
      id: "my-combo",
      goal: "Combo thử nghiệm",
      description: "Mô tả combo",
      icon: "Rocket",
      roleScope: "STORE",
      steps: sampleSteps,
    })

    // Cố gắng loại bỏ bước 1 (bắt buộc)
    const filtered = filterExcludedSteps(combo, ["step-1"])
    expect(filtered.steps).toHaveLength(3)
    expect(filtered.steps.some((s) => s.id === "step-1")).toBe(true)
  })
})
