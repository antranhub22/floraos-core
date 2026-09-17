import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { readIdempotencyKey } from "@/modules/jobs/domain/idempotency"
import { VARIANT_PRESET_IDS, VARIANT_RATIOS } from "@/modules/media/domain/variant-rules"
import { listPendingVariants } from "@/modules/media/use-cases/list-pending-variants"
import { requestVariants } from "@/modules/media/use-cases/request-variants"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

const postSchema = z.object({
  master_asset_id: z.string().min(1),
  preset: z.enum(VARIANT_PRESET_IDS),
  ratio: z.enum(VARIANT_RATIOS),
  watermark: z.boolean().default(true),
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

  const result = await requestVariants(ctx, {
    masterAssetId: parsed.data.master_asset_id,
    preset: parsed.data.preset,
    ratio: parsed.data.ratio,
    watermark: parsed.data.watermark,
    idempotencyKey,
  })

  return jsonResponse(
    {
      job_id: result.job.id,
      status: result.job.status,
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
