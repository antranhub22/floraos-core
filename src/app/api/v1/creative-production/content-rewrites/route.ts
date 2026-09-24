import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { readIdempotencyKey } from "@/modules/jobs/domain/idempotency"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { PACKAGE_CHANNELS } from "@/modules/creative-production/domain/campaign-package-rules"
import { MAX_INSTRUCTION_LENGTH } from "@/modules/creative-production/domain/revision-rules"
import { rewriteContent } from "@/modules/creative-production/use-cases/revise-assets"

const postSchema = z.object({
  channel: z.enum(PACKAGE_CHANNELS),
  text: z.string().max(70000),
  hashtags: z.array(z.string().max(100)).max(60).default([]),
  instruction: z.string().trim().min(3).max(MAX_INSTRUCTION_LENGTH),
  product_name: z.string().max(200).default(""),
  topic_title: z.string().max(500).default(""),
  price_range: z.string().max(80).optional(),
})

/**
 * `POST /api/v1/creative-production/content-rewrites` (`I1`, 24/09/2026) — AI
 * viết lại MỘT bài đăng theo yêu cầu ở Chặng 07 (feature
 * `creative.content_rewrite`, 1 credit, `AIC-23`). Từ cấm ngành hoa / thương
 * hiệu vi phạm cứng thì loại lượt và hoàn credit.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const idempotencyKey = readIdempotencyKey(request)
  if (!idempotencyKey) throw validationFailed({ "Idempotency-Key": "Bắt buộc (YC-U7)" })
  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const d = parsed.data
  const r = await rewriteContent(ctx, {
    idempotencyKey,
    channel: d.channel,
    text: d.text,
    hashtags: d.hashtags,
    instruction: d.instruction,
    productName: d.product_name,
    topicTitle: d.topic_title,
    priceRange: d.price_range,
  })
  return jsonResponse({
    job_id: r.jobId,
    text: r.result.text,
    hashtags: r.result.hashtags,
    warnings: r.result.warnings,
    usage: { cost_credit: r.usage.costCredit, balance_after: r.usage.balanceAfter },
  })
})
