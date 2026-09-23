import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { readIdempotencyKey } from "@/modules/jobs/domain/idempotency"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import {
  findScenePlanByKey,
  generateScenePlan,
} from "@/modules/creative-production/use-cases/generate-scene-plan"
import { scenePlanKey } from "@/modules/creative-production/domain/scene-plan-rules"

const str = (max: number) => z.string().trim().max(max)
const list = z.array(str(60)).max(12)

const postSchema = z.object({
  mode: z.enum(["CREATIVE", "AUTHENTIC"]),
  asset_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  product: z.object({
    name: str(160).min(1),
    category: str(80).optional(),
    style: str(120).optional(),
    colors: list.default([]),
    components: list.default([]),
    occasions: list.default([]),
    target_audience: str(200).optional(),
    price_range: str(80).optional(),
  }),
  topic: z.object({
    id: str(120).min(1),
    title: str(200).min(1),
    angle_category: str(40).optional(),
    hook: str(300).optional(),
    cta: str(200).optional(),
    format: str(40).optional(),
  }),
})

/**
 * `POST /api/v1/creative-production/scene-plans` — AI viết kịch bản bối cảnh
 * cho một chủ đề (`I1`, feature `creative.scene_plan`, header
 * `Idempotency-Key` bắt buộc). Trùng khoá thì trả kịch bản cũ, không trừ credit.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const idempotencyKey = readIdempotencyKey(request)
  if (!idempotencyKey) throw validationFailed({ "Idempotency-Key": "Bắt buộc (YC-U7)" })

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const d = parsed.data

  const result = await generateScenePlan(ctx, {
    idempotencyKey,
    productId: d.product_id ?? null,
    assetId: d.asset_id ?? null,
    brief: {
      mode: d.mode,
      productName: d.product.name,
      category: d.product.category,
      style: d.product.style,
      colors: d.product.colors,
      components: d.product.components,
      occasions: d.product.occasions,
      targetAudience: d.product.target_audience,
      priceRange: d.product.price_range,
      topic: {
        id: d.topic.id,
        title: d.topic.title,
        angleCategory: d.topic.angle_category,
        hook: d.topic.hook,
        cta: d.topic.cta,
        format: d.topic.format,
      },
    },
  })

  return jsonResponse(
    {
      job_id: result.jobId,
      status: result.status,
      error: result.error,
      plan: result.plan,
      deduped: result.deduped,
      usage: { cost_credit: result.usage.costCredit, balance_after: result.usage.balanceAfter },
    },
    { status: result.deduped ? 200 : 201 }
  )
})

const lookupSchema = z.object({
  asset_id: z.string().uuid(),
  topic_id: z.string().trim().min(1).max(120),
  mode: z.enum(["CREATIVE", "AUTHENTIC"]),
})

/**
 * `GET /api/v1/creative-production/scene-plans?asset_id&topic_id&mode` — tra
 * kịch bản đã có của đúng ảnh + chủ đề + mode, KHÔNG tạo job, không trừ credit.
 * Chưa có thì `{ plan: null }`.
 */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const url = new URL(request.url)
  const parsed = lookupSchema.safeParse({
    asset_id: url.searchParams.get("asset_id"),
    topic_id: url.searchParams.get("topic_id"),
    mode: url.searchParams.get("mode"),
  })
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const found = await findScenePlanByKey(
    ctx,
    scenePlanKey({ assetId: parsed.data.asset_id, topicId: parsed.data.topic_id, mode: parsed.data.mode })
  )
  return jsonResponse(
    found
      ? { job_id: found.jobId, status: found.status, error: found.error, plan: found.plan }
      : { job_id: null, status: null, error: null, plan: null }
  )
})
