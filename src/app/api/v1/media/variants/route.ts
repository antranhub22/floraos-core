import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { readIdempotencyKey } from "@/modules/jobs/domain/idempotency"
import { VARIANT_PRESET_IDS, VARIANT_RATIOS } from "@/modules/media/domain/variant-rules"
import { listPendingVariants } from "@/modules/media/use-cases/list-pending-variants"
import { requestVariants } from "@/modules/media/use-cases/request-variants"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

import { executeCloudCreative } from "@/modules/media/use-cases/execute-cloud-creative"

const postSchema = z.object({
  master_asset_id: z.string().min(1),
  engine: z.enum(["local_studio", "cloud_provider"]).default("local_studio"),
  // Dành cho local_studio:
  preset: z.enum(VARIANT_PRESET_IDS).optional(),
  ratio: z.enum(VARIANT_RATIOS).optional(),
  watermark: z.boolean().default(true),
  // AIC-14 — chốt 18/09 (AskUserQuestion): chỉ chỉnh vùng nền, mặc định tắt.
  auto_enhance: z.boolean().default(false),
  // Dành cho cloud_provider:
  provider_key: z.enum(["photoroom", "imagen", "fal", "stability", "router"]).optional(),
  camera_angle: z.string().optional(),
  human_interaction: z.string().optional(),
  custom_directives: z.array(z.string()).optional(),
})

/** `POST /media/variants` (`I4`) — M04b, dựng biến thể marketing. */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I4")

  const idempotencyKey = readIdempotencyKey(request)
  if (!idempotencyKey) {
    throw validationFailed({ "idempotency-key": "Bắt buộc trên mọi endpoint tạo job (YC-U7)" })
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  // Nhánh 1: Cloud AI Providers Engine — Độc lập 100%, không gọi Python worker
  if (parsed.data.engine === "cloud_provider") {
    const cloudRes = await executeCloudCreative(ctx, {
      assetId: parsed.data.master_asset_id,
      taskType: "GENERATE_SCENE_VARIANT",
      providerKey: parsed.data.provider_key || "stability",
      cameraAngle: parsed.data.camera_angle as any,
      humanInteraction: parsed.data.human_interaction as any,
      ...(parsed.data.custom_directives ? { customDirectives: parsed.data.custom_directives } : {}),
      targetRatios: parsed.data.ratio ? [parsed.data.ratio] : ["1:1"],
    })

    return jsonResponse(
      {
        job_id: cloudRes.assetId,
        status: "COMPLETED",
        engine: "cloud_provider",
        asset_id: cloudRes.assetId,
        image_url: cloudRes.imageUrl,
        provider: cloudRes.provider,
        model: cloudRes.model,
        camera_angle: cloudRes.cameraAngle,
        human_interaction: cloudRes.humanInteraction,
        usage: { cost_credit: 1, balance_after: 99 },
      },
      { status: 201 }
    )
  }

  // Nhánh 2: Local Studio Engine — Đẩy vào hàng đợi Python worker
  if (!parsed.data.preset || !parsed.data.ratio) {
    throw validationFailed({ preset: "Bắt buộc khi chạy Local Studio Engine", ratio: "Bắt buộc khi chạy Local Studio Engine" })
  }

  const result = await requestVariants(ctx, {
    masterAssetId: parsed.data.master_asset_id,
    preset: parsed.data.preset,
    ratio: parsed.data.ratio,
    watermark: parsed.data.watermark,
    autoEnhance: parsed.data.auto_enhance,
    idempotencyKey,
  })

  return jsonResponse(
    {
      job_id: result.job.id,
      status: result.job.status,
      engine: "local_studio",
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
