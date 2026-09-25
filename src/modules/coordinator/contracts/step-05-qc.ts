/**
 * Bước 05: Kiểm tra Chất lượng Hoa Thành phẩm (QUALITY_CHECK).
 * AI Vision QC đối chiếu ảnh thợ gửi với Master Image và BOM nguyên tử của Master Index.
 */

import { z } from "zod"
import { defineStep } from "./define-step"
import { CoordinatorStageEnum } from "./common"

export const Step05QCInspectionInputSchema = z.object({
  coordinationId: z.string().uuid(),
  uploadedImageUrls: z.array(z.string().url()).min(1),
  inspectorNote: z.string().optional(),
})

export const Step05QCInspectionOutputSchema = z.object({
  qcRecordId: z.string().uuid(),
  coordinationId: z.string().uuid(),
  status: z.enum(["PASSED", "REWORK_REQUESTED", "REJECTED"]),
  aiScore: z.number().int().min(0).max(100),
  aiCritique: z.string(),
  checklist: z.object({
    flowerMatchScore: z.number().int(),
    colorToneMatch: z.boolean(),
    wrappingMatch: z.boolean(),
    ribbonMatch: z.boolean(),
    cardMessageAccurate: z.boolean(),
  }),
  reworkInstructions: z.string().optional(),
  stage: CoordinatorStageEnum,
  inspectedAt: z.string(),
})

export const step05QCInspectionContract = defineStep({
  id: "05",
  step: 5,
  code: "QUALITY_CHECK",
  slug: "quality-check",
  title: "Kiểm tra Chất lượng (QC)",
  summary: "AI Vision đối chiếu ảnh chụp hoa thành phẩm với Master Index BOM và tiêu chuẩn tiệm",
  endpoint: {
    method: "POST",
    path: "/api/v1/coordinator/qc-inspection",
    capability: "O1",
  },
  input: Step05QCInspectionInputSchema,
  output: Step05QCInspectionOutputSchema,
  examples: {
    input: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      uploadedImageUrls: [
        "https://storage.floraos.vn/org/test/qc-finished-flower-1.jpg",
      ],
      inspectorNote: "Ảnh chụp trực diện ánh sáng tự nhiên",
    },
    output: {
      qcRecordId: "d1b2c3d4-e29b-41d4-a716-446655440004",
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      status: "PASSED",
      aiScore: 95,
      aiCritique: "Bó hoa cắm tròn đều, 15 bông hồng Ohara nở vừa độ đẹp, baby phân bổ điểm xuyến hài hòa. Nơ nhung đỏ buộc ngay ngắn.",
      checklist: {
        flowerMatchScore: 98,
        colorToneMatch: true,
        wrappingMatch: true,
        ribbonMatch: true,
        cardMessageAccurate: true,
      },
      stage: "DISPATCHING",
      inspectedAt: "2026-09-25T16:15:00.000Z",
    },
  },
})
