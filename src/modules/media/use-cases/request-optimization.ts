import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job"

export const MEDIA_OPTIMIZE_FEATURE = "media.optimize"

export type RequestOptimizationInput = {
  assetId: string
  config?: Record<string, unknown> | undefined
  idempotencyKey: string
}

/**
 * `POST /media/optimizations` (`I1`, đặc tả 06 mục 8). Tái dùng nguyên
 * `enqueueJob` của P3 — cùng đường hạn mức, cùng giao dịch, cùng
 * `Idempotency-Key`. Không có đường tắt riêng cho M04a.
 *
 * Kiểm asset TRƯỚC khi vào hàng đợi: một job trỏ vào asset của tổ chức khác
 * (hoặc không tồn tại) sẽ chạy tới worker rồi mới `FAILED`, trong khi credit
 * đã bị trừ ở bước enqueue. Chặn ở đây là chặn trước khi tính tiền.
 */
export async function requestOptimization(
  ctx: TenantContext,
  input: RequestOptimizationInput
) {
  const asset = await new AssetRepository().findById(ctx, input.assetId)
  if (!asset) throw notFound()

  return enqueueJob(ctx, {
    feature: MEDIA_OPTIMIZE_FEATURE,
    productId: asset.product_id,
    payload: { asset_id: input.assetId, config: input.config ?? {} },
    idempotencyKey: input.idempotencyKey,
  })
}
