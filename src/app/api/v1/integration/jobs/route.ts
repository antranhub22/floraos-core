import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import {
  requireIntegrationContext,
  toTenantContext,
} from "@/modules/integration/use-cases/resolve-integration-context"
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job"

const postSchema = z.object({
  feature: z.string().min(1),
  payload: z.unknown(),
  product_id: z.string().min(1).nullable().optional(),
  idempotency_key: z.string().min(1),
})

/**
 * `POST /integration/jobs` (đặc tả 06 mục 11): "Tạo job thay mặt tổ chức".
 * Tái dùng thẳng `enqueueJob` (P3) — cùng một đường kiểm hạn mức → ghi usage
 * → tạo `generation_jobs` → NOTIFY cho mọi nguồn tạo job, nội bộ lẫn bên
 * ngoài, không có đường tắt nào bỏ qua hạn mức cho engine ngoài (`YC-U3`).
 *
 * Cho phép mọi giá trị `feature` — core chưa có danh sách trắng theo
 * `client` (nợ #31, `TECHNICAL_DEBT.md`); hạn mức/credit vẫn chặn đúng dù
 * `feature` là gì.
 */
export const POST = handle(async (request) => {
  const ic = await requireIntegrationContext(request)
  const ctx = await toTenantContext(ic)

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await enqueueJob(ctx, {
    feature: parsed.data.feature,
    payload: parsed.data.payload,
    productId: parsed.data.product_id ?? null,
    idempotencyKey: parsed.data.idempotency_key,
  })

  return jsonResponse(result, { status: result.deduped ? 200 : 201 })
})
