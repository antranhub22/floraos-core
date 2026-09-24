import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { readIdempotencyKey } from "@/modules/jobs/domain/idempotency"
import {
  MAX_SCENE_PROMPT_LENGTH,
  NARRATIVE_SCENE_INDEXES,
  VARIANT_CLOUD_PROVIDERS,
  VARIANT_PRESET_IDS,
  VARIANT_RATIOS,
  type NarrativeSceneIndex,
} from "@/modules/media/domain/variant-rules"
import { listPendingVariants } from "@/modules/media/use-cases/list-pending-variants"
import { requestCloudVariant, requestVariants } from "@/modules/media/use-cases/request-variants"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

const postSchema = z.object({
  master_asset_id: z.string().min(1),
  engine: z.enum(["local_studio", "cloud_provider"]).default("local_studio"),
  preset: z.enum(VARIANT_PRESET_IDS),
  ratio: z.enum(VARIANT_RATIOS),
  watermark: z.boolean().default(true),
  // AIC-14 — chốt 18/09 (AskUserQuestion): chỉ chỉnh vùng nền, mặc định tắt.
  auto_enhance: z.boolean().default(false),
  // Phân cảnh theo kịch bản bối cảnh của chủ đề (CREATIVE 5 cảnh, AUTHENTIC 3).
  scene_index: z
    .number()
    .int()
    .refine((v) => (NARRATIVE_SCENE_INDEXES as readonly number[]).includes(v), "scene_index 1..5")
    .optional(),
  // Job `creative.scene_plan` mà cảnh này thuộc về — ghi vào metadata asset.
  scene_plan_id: z.string().trim().min(1).max(160).optional(),
  scene_plan_revision: z.number().int().min(1).max(100000).optional(),
  // Chỉ nhánh cloud_provider:
  provider_key: z.enum(VARIANT_CLOUD_PROVIDERS).default("stability"),
  scene_prompt: z.string().max(MAX_SCENE_PROMPT_LENGTH).optional(),
})

/**
 * `POST /media/variants` (`I4`) — M04b, dựng biến thể marketing.
 *
 * CẢ HAI nhánh đi qua `enqueueJob` (23/09/2026): `local_studio` → feature
 * `media.variant`, `cloud_provider` → feature `media.variant.cloud`. Không nhánh
 * nào chạy mô hình trong request HTTP. Kết quả đọc qua `GET /media/variants/:id`.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I4")

  const idempotencyKey = readIdempotencyKey(request)
  if (!idempotencyKey) {
    throw validationFailed({ "idempotency-key": "Bắt buộc trên mọi endpoint tạo job (YC-U7)" })
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const data = parsed.data

  const common = {
    masterAssetId: data.master_asset_id,
    preset: data.preset,
    ratio: data.ratio,
    watermark: data.watermark,
    autoEnhance: data.auto_enhance,
    idempotencyKey,
    sceneIndex: data.scene_index as NarrativeSceneIndex | undefined,
    scenePlanId: data.scene_plan_id,
    scenePlanRevision: data.scene_plan_revision,
  }

  const result =
    data.engine === "cloud_provider"
      ? await requestCloudVariant(ctx, {
          ...common,
          provider: data.provider_key,
          scenePrompt: data.scene_prompt,
        })
      : await requestVariants(ctx, common)

  return jsonResponse(
    {
      job_id: result.job.id,
      status: result.job.status,
      engine: data.engine,
      deduped: result.deduped,
      usage: { cost_credit: result.usage.costCredit, balance_after: result.usage.balanceAfter },
    },
    { status: 201 }
  )
})

/** `GET /media/variants` (`I5`) — hàng chờ duyệt biến thể. */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I5")

  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam === null ? undefined : Number(limitParam)
  if (limit !== undefined && !Number.isInteger(limit)) {
    throw validationFailed({ limit: "Phải là số nguyên" })
  }

  return jsonResponse(await listPendingVariants(ctx, { limit }))
})
