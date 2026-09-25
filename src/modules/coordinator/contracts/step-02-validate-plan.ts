/**
 * Bước 02: Thẩm định & Lập Kế hoạch Điều phối (VALIDATING & PLANNING).
 * Phân tích tính đầy đủ theo Master Index BOM, tính toán mốc giờ cắm hoa và SLA giao hàng.
 */

import { z } from "zod"
import { defineStep } from "./define-step"
import { CoordinatorStageEnum, CoordinationRiskLevelEnum, AtomicFlowerBomItemSchema } from "./common"

export const Step02ValidatePlanInputSchema = z.object({
  coordinationId: z.string().uuid(),
  requiredFlowers: z.array(AtomicFlowerBomItemSchema),
  deliveryTargetTime: z.string(),
  productionDurationMinutes: z.number().int().default(45),
  deliveryDurationMinutes: z.number().int().default(30),
})

export const Step02ValidatePlanOutputSchema = z.object({
  coordinationId: z.string().uuid(),
  stage: CoordinatorStageEnum,
  riskLevel: CoordinationRiskLevelEnum,
  isFeasible: z.boolean(),
  timeline: z.object({
    orderReceivedAt: z.string(),
    latestStartProductionAt: z.string(),
    targetQcReadyAt: z.string(),
    targetDispatchAt: z.string(),
    targetDeliveryAt: z.string(),
  }),
  materialCheck: z.object({
    totalStems: z.number().int(),
    availableStems: z.number().int(),
    hasMissingFlowers: z.boolean(),
    missingFlowersList: z.array(z.string()),
  }),
  validationNotes: z.string(),
})

export const step02ValidatePlanContract = defineStep({
  id: "02",
  step: 2,
  code: "VALIDATE_PLAN",
  slug: "validate-plan",
  title: "Thẩm định & Lập Kế hoạch",
  summary: "Đối chiếu BOM Master Index, dự báo tiến độ và lập mốc giờ SLA",
  endpoint: {
    method: "POST",
    path: "/api/v1/coordinator/validate-plan",
    capability: "O1",
  },
  input: Step02ValidatePlanInputSchema,
  output: Step02ValidatePlanOutputSchema,
  examples: {
    input: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      requiredFlowers: [
        {
          flowerName: "Hồng Ohara Kem",
          quantity: 15,
          unit: "cành",
          color: "Kem pastel",
          role: "Chủ đạo",
        },
        {
          flowerName: "Baby Trắng",
          quantity: 5,
          unit: "cành",
          color: "Trắng",
          role: "Điểm xuyến",
        },
      ],
      deliveryTargetTime: "2026-09-25T17:00:00.000Z",
      productionDurationMinutes: 45,
      deliveryDurationMinutes: 30,
    },
    output: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      stage: "PLANNING",
      riskLevel: "NORMAL",
      isFeasible: true,
      timeline: {
        orderReceivedAt: "2026-09-25T10:00:00.000Z",
        latestStartProductionAt: "2026-09-25T15:30:00.000Z",
        targetQcReadyAt: "2026-09-25T16:15:00.000Z",
        targetDispatchAt: "2026-09-25T16:30:00.000Z",
        targetDeliveryAt: "2026-09-25T17:00:00.000Z",
      },
      materialCheck: {
        totalStems: 20,
        availableStems: 20,
        hasMissingFlowers: false,
        missingFlowersList: [],
      },
      validationNotes: "Đủ nguyên liệu hoa theo Master Index BOM. Thời gian đệm 30 phút an toàn.",
    },
  },
})
