import { describe, it, expect } from "vitest"
import {
  PIPELINE_STEPS,
  type TrackingPipelineStepId,
} from "../tracking-pipeline-types"

describe("Tracking Pipeline Domain", () => {
  it("should define exactly 9 end-to-end pipeline steps", () => {
    expect(PIPELINE_STEPS).toHaveLength(9)
    const expectedStepIds: TrackingPipelineStepId[] = [
      "STEP_1_OPENED",
      "STEP_2_CHOOSING",
      "STEP_3_FILLING_FORM",
      "STEP_4_PAYMENT_PENDING",
      "STEP_5_PAYMENT_CONFIRMED",
      "STEP_6_ARRANGING",
      "STEP_7_READY_QC",
      "STEP_8_DELIVERING",
      "STEP_9_COMPLETED",
    ]
    expect(PIPELINE_STEPS.map((s) => s.id)).toEqual(expectedStepIds)
  })

  it("should have correct sequential order indexes from 1 to 9", () => {
    PIPELINE_STEPS.forEach((step, idx) => {
      expect(step.orderIndex).toBe(idx + 1)
    })
  })

  it("should define human-readable Vietnamese titles for all steps", () => {
    PIPELINE_STEPS.forEach((step) => {
      expect(step.title.length).toBeGreaterThan(0)
      expect(step.shortTitle.length).toBeGreaterThan(0)
      expect(step.roleResponsible.length).toBeGreaterThan(0)
    })
  })
})
