import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { readIdempotencyKey } from "@/modules/jobs/domain/idempotency"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { requestAnalysis } from "@/modules/products/use-cases/request-analysis"

const postSchema = z.object({
  asset_ids: z.array(z.string().min(1)).min(1),
  product_id: z.string().min(1).nullable().optional(),
})

/**
 * `POST /vision/analyses` (`H1`, đặc tả 06 mục 8). `Idempotency-Key` bắt
 * buộc trên mọi endpoint tạo job (`YC-U7`) — đóng nợ đã ghi ở
 * `Checklist_Thuc_Thi.md` P3: "chưa có endpoint tạo job cụ thể theo feature
 * để nối header thật vào".
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "H1")

  const idempotencyKey = readIdempotencyKey(request)
  if (!idempotencyKey) {
    throw validationFailed({ "idempotency-key": "Bắt buộc trên mọi endpoint tạo job (YC-U7)" })
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await requestAnalysis(ctx, {
    assetIds: parsed.data.asset_ids,
    productId: parsed.data.product_id ?? null,
    idempotencyKey,
  })

  return jsonResponse(
    {
      job_id: result.jobId,
      status: result.status,
      usage: { cost_credit: result.usage.costCredit, balance_after: result.usage.balanceAfter },
    },
    { status: 201 }
  )
})
