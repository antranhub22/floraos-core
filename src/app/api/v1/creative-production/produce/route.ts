import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { produceCreative } from "@/modules/creative-production/use-cases/produce-creative"
import { produceAuthentic } from "@/modules/creative-production/use-cases/produce-authentic"

const postSchema = z.object({
  brief: z.object({
    organizationId: z.string().min(1),
    mode: z.enum(["AUTHENTIC", "CREATIVE"]),
    productContext: z.object({
      sourceImageUrl: z.string(),
      sourceImageStorageKey: z.string().optional(),
      commercialPassport: z.object({
        productName: z.string(),
        category: z.string(),
        style: z.string(),
        components: z.array(z.string()),
        colors: z.array(z.string()),
        priceRange: z.string().optional(),
        targetAudience: z.string().optional(),
        suggestedOccasions: z.array(z.string()).optional(),
      }),
      sourceVideoUrl: z.string().optional(),
      sourceVideoDurationSeconds: z.number().optional(),
    }),
    selectedTopics: z.array(z.object({
      topicId: z.string(),
      topicTitle: z.string(),
      topicAngle: z.string(),
      topicCategory: z.string(),
      topicHook: z.string(),
      topicCta: z.string(),
      topicEmotionalTone: z.string(),
      researchKeywords: z.array(z.string()).optional(),
      trendScore: z.number().optional(),
    })),
    voiceId: z.string().optional(),
    musicMood: z.string().optional(),
    targetVideoDurationSeconds: z.number().optional(),
  }),
})

/**
 * `POST /api/v1/creative-production/produce` — Sản xuất nội dung Creative Production.
 *
 * Chấp nhận TopicProductionBrief, gọi produceCreative() hoặc produceAuthentic()
 * tùy theo mode. Trả về kết quả đã được đóng gói sẵn cho từng topic.
 *
 * Năng lực: `I1` (sáng tạo nội dung đa phương tiện).
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const brief = parsed.data.brief

  // Validate organization match
  if (brief.organizationId !== ctx.organizationId) {
    throw validationFailed({ organizationId: "organizationId trong body phải khớp session" })
  }

  const result = brief.mode === "CREATIVE"
    ? produceCreative({ brief })
    : produceAuthentic({ brief })

  return jsonResponse(result, { status: 201 })
})