/**
 * Bước 07: Nghiệm thu Đơn hàng & Học máy Vận hành (COMPLETED & LEARNING).
 * Khép kín hồ sơ đơn hàng, chấm điểm hiệu suất đối tác, tính toán SLA thực tế và bắn metric sang M11/M09.
 */

import { z } from "zod"
import { defineStep } from "./define-step"
import { CoordinatorStageEnum } from "./common"

export const Step07CloseLearnInputSchema = z.object({
  coordinationId: z.string().uuid(),
  coordinatorFinalReview: z.string().optional(),
  partnerRating: z.number().min(1).max(5).default(5),
  customerSatisfactionScore: z.number().min(1).max(5).optional(),
})

export const Step07CloseLearnOutputSchema = z.object({
  coordinationId: z.string().uuid(),
  orderId: z.string().uuid(),
  stage: CoordinatorStageEnum,
  slaReport: z.object({
    promisedDeliveryTime: z.string(),
    actualDeliveryTime: z.string(),
    varianceMinutes: z.number().int(),
    isOntime: z.boolean(),
  }),
  operationalScore: z.object({
    qcScore: z.number().int(),
    partnerScore: z.number().min(1).max(5),
    overallExecutionRating: z.enum(["EXCELLENT", "GOOD", "ACCEPTABLE", "FAILED"]),
  }),
  downstreamUpdates: z.object({
    crmHistorySynced: z.boolean(),
    analyticsMetricsRecorded: z.boolean(),
    partnerPerformanceUpdated: z.boolean(),
  }),
  completedAt: z.string(),
})

export const step07CloseLearnContract = defineStep({
  id: "07",
  step: 7,
  code: "CLOSE_LEARN",
  slug: "close-learn",
  title: "Nghiệm thu & Bài học Vận hành",
  summary: "Khép lại chu trình điều phối, tính toán SLA và cập nhật uy tín đối tác",
  endpoint: {
    method: "POST",
    path: "/api/v1/coordinator/close-learn",
    capability: "O1",
  },
  input: Step07CloseLearnInputSchema,
  output: Step07CloseLearnOutputSchema,
  examples: {
    input: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      coordinatorFinalReview: "Đơn thực hiện xuất sắc, hoa đẹp, giao sớm 5 phút, khách khen ngợi",
      partnerRating: 5,
      customerSatisfactionScore: 5,
    },
    output: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      stage: "COMPLETED",
      slaReport: {
        promisedDeliveryTime: "2026-09-25T17:00:00.000Z",
        actualDeliveryTime: "2026-09-25T16:55:00.000Z",
        varianceMinutes: -5,
        isOntime: true,
      },
      operationalScore: {
        qcScore: 95,
        partnerScore: 5,
        overallExecutionRating: "EXCELLENT",
      },
      downstreamUpdates: {
        crmHistorySynced: true,
        analyticsMetricsRecorded: true,
        partnerPerformanceUpdated: true,
      },
      completedAt: "2026-09-25T17:05:00.000Z",
    },
  },
})
