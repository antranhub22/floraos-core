/**
 * Bước 03: Gợi ý & Phân công Đối tác Cắm hoa (ASSIGNING).
 * Đề xuất danh sách đối tác/thợ theo địa bàn, năng lực cắm dáng hoa, và sinh Template T07 Production Card.
 */

import { z } from "zod"
import { defineStep } from "./define-step"
import { CoordinatorStageEnum } from "./common"

export const Step03AssignPartnerInputSchema = z.object({
  coordinationId: z.string().uuid(),
  partnerId: z.string().uuid(),
  assignmentType: z.enum(["INTERNAL_FLORIST", "EXTERNAL_PARTNER_SHOP"]),
  assignedNotes: z.string().optional(),
})

export const Step03AssignPartnerOutputSchema = z.object({
  coordinationId: z.string().uuid(),
  partnerId: z.string().uuid(),
  partnerName: z.string(),
  partnerPhone: z.string(),
  stage: CoordinatorStageEnum,
  assignedAt: z.string(),
  productionCardSnapshot: z.object({
    orderCode: z.string(),
    recipeTitle: z.string(),
    targetReadyTime: z.string(),
    flowerBomSummary: z.string(),
    wrapRibbonSummary: z.string(),
    cardMessage: z.string(),
  }),
})

export const step03AssignPartnerContract = defineStep({
  id: "03",
  step: 3,
  code: "ASSIGN_PARTNER",
  slug: "assign-partner",
  title: "Phân công Đối tác / Thợ cắm",
  summary: "Khớp đối tác tối ưu và phát hành Phiếu cắm hoa (Template T07)",
  endpoint: {
    method: "POST",
    path: "/api/v1/coordinator/assign-partner",
    capability: "O1",
  },
  input: Step03AssignPartnerInputSchema,
  output: Step03AssignPartnerOutputSchema,
  examples: {
    input: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      partnerId: "b1b2c3d4-e29b-41d4-a716-446655440003",
      assignmentType: "EXTERNAL_PARTNER_SHOP",
      assignedNotes: "Xưởng Hoa Ba Đình nhận đơn và cam kết giao đúng 17h",
    },
    output: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      partnerId: "b1b2c3d4-e29b-41d4-a716-446655440003",
      partnerName: "Flora Boutique Ba Đình",
      partnerPhone: "0988776655",
      stage: "ASSIGNING",
      assignedAt: "2026-09-25T10:15:00.000Z",
      productionCardSnapshot: {
        orderCode: "FLR-2026-001",
        recipeTitle: "Bó Hồng Ohara Kem Sang Trọng",
        targetReadyTime: "2026-09-25T16:15:00.000Z",
        flowerBomSummary: "15 Hồng Ohara Kem (Chủ đạo), 5 Baby Trắng (Điểm xuyến)",
        wrapRibbonSummary: "Giấy xi măng mộc mạc, Nơ nhung đỏ rực",
        cardMessage: "Chúc mừng sinh nhật em yêu!",
      },
    },
  },
})
