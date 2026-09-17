import { validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { MEDIA_VARIANT_FEATURE } from "@/modules/media/domain/variant-rules"

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100
// Cùng giới hạn quét với `list-pending-optimizations.ts`, cùng lý do: không
// có quan hệ Prisma ngược từ `assets` về `generation_jobs` nên không JOIN
// được trong một truy vấn.
const MAX_SCAN = 200

export type PendingVariantJob = {
  job_id: string
  completed_at: string | null
  pending_count: number
  total_count: number
}

/**
 * `GET /media/variants` (`I5`) — hàng chờ duyệt biến thể marketing.
 *
 * "Chờ duyệt" nghĩa là: job `COMPLETED`, không `REJECTED`, VÀ còn ít nhất
 * một biến thể chưa `APPROVED`. Một lượt có ba biến thể mà người bán mới
 * duyệt một tấm thì lượt đó VẪN nằm trong hàng chờ — người vận hành cần
 * thấy phần việc còn lại, không phải một dấu tích cho cả lượt.
 */
export async function listPendingVariants(
  ctx: TenantContext,
  options: { limit?: number | undefined }
): Promise<{ data: PendingVariantJob[] }> {
  const limit = options.limit ?? DEFAULT_LIMIT
  if (limit < 1 || limit > MAX_LIMIT) {
    throw validationFailed({ limit: `Phải trong khoảng 1..${MAX_LIMIT}` })
  }

  const jobRepo = new GenerationJobRepository()
  const assetRepo = new AssetRepository()

  const candidates = await jobRepo.listCompletedNotRejected(ctx, {
    feature: MEDIA_VARIANT_FEATURE,
    limit: MAX_SCAN,
  })

  const pending: PendingVariantJob[] = []
  for (const job of candidates) {
    const rows = await assetRepo.listByJobId(ctx, job.id, "MARKETING")
    if (rows.length === 0) continue
    const choDuyet = rows.filter((r) => r.approval_state !== "APPROVED").length
    if (choDuyet === 0) continue

    pending.push({
      job_id: job.id,
      completed_at: job.completed_at?.toISOString() ?? null,
      pending_count: choDuyet,
      total_count: rows.length,
    })
    if (pending.length >= limit) break
  }

  return { data: pending }
}
