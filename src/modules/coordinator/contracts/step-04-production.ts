/**
 * Bước 04: Giám sát Tiến độ Cắm hoa (IN_PRODUCTION).
 * Theo dõi trạng thái xưởng: Bắt đầu cắm, hoàn tất cắm, báo sự cố nguyên liệu.
 */

import { z } from "zod"
import { defineStep } from "./define-step"
import { CoordinatorStageEnum, CoordinationRiskLevelEnum } from "./common"

export const Step04ProductionInputSchema = z.object({
  coordinationId: z.string().uuid(),
  action: z.enum(["START_ARRANGING", "UPDATE_PROGRESS", "REPORT_MATERIAL_ISSUE", "MARK_READY_FOR_QC"]),
  percentCompleted: z.number().int().min(0).max(100),
  issueDescription: z.string().optional(),
  estimatedFinishAt: z.string().optional(),
})

export const Step04ProductionOutputSchema = z.object({
  coordinationId: z.string().uuid(),
  stage: CoordinatorStageEnum,
  riskLevel: CoordinationRiskLevelEnum,
  currentProgressPercent: z.number().int(),
  lastUpdated: z.string(),
  hasActiveIssue: z.boolean(),
  issueSummary: z.string().optional(),
  nextAction: z.string(),
})

export const step04ProductionContract = defineStep({
  id: "04",
  step: 4,
  code: "PRODUCTION",
  slug: "production",
  title: "Giám sát Tiến độ Cắm hoa",
  summary: "Cập nhật tiến trình cắm hoa thực tế tại xưởng và cảnh báo nguy cơ trễ hẹn",
  endpoint: {
    method: "POST",
    path: "/api/v1/coordinator/production-update",
    capability: "O1",
  },
  input: Step04ProductionInputSchema,
  output: Step04ProductionOutputSchema,
  examples: {
    input: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      action: "MARK_READY_FOR_QC",
      percentCompleted: 100,
      estimatedFinishAt: "2026-09-25T16:10:00.000Z",
    },
    output: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      stage: "QUALITY_CHECK",
      riskLevel: "NORMAL",
      currentProgressPercent: 100,
      lastUpdated: "2026-09-25T16:10:00.000Z",
      hasActiveIssue: false,
      nextAction: "Yêu cầu thợ gửi ảnh chụp 4 góc để AI Vision QC đối chiếu Master Index",
    },
  },
})
