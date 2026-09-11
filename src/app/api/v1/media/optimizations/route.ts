import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { readIdempotencyKey } from "@/modules/jobs/domain/idempotency"
import { listPendingOptimizations } from "@/modules/media/use-cases/list-pending-optimizations"
import { requestOptimization } from "@/modules/media/use-cases/request-optimization"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

const postSchema = z.object({
  asset_id: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional(),
})

/** `POST /media/optimizations` (`I1`, đặc tả 06 mục 8). */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")

  const idempotencyKey = readIdempotencyKey(request)
  if (!idempotencyKey) {
    throw validationFailed({ "idempotency-key": "Bắt buộc trên mọi endpoint tạo job (YC-U7)" })
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await requestOptimization(ctx, {
    assetId: parsed.data.asset_id,
    config: parsed.data.config,
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

/**
 * `GET /media/optimizations` (`I2`, nợ #48 — TECHNICAL_DEBT.md). Chỉ liệt
 * kê hàng chờ duyệt — xem `list-pending-optimizations.ts` vì sao đây không
 * phải một trang phân trang con trỏ thật.
 */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I2")

  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam === null ? undefined : Number(limitParam)
  if (limit !== undefined && !Number.isInteger(limit)) {
    throw validationFailed({ limit: "Phải là số nguyên" })
  }

  const result = await listPendingOptimizations(ctx, { limit })
  return jsonResponse(result)
})
