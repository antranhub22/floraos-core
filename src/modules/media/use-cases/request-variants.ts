import { conflict, notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job"
import {
  isEligibleMasterForVariants,
  MEDIA_VARIANT_FEATURE,
  type VariantPresetId,
  type VariantRatio,
} from "@/modules/media/domain/variant-rules"

export { MEDIA_VARIANT_FEATURE }

export type RequestVariantsInput = {
  masterAssetId: string
  preset: VariantPresetId
  ratio: VariantRatio
  watermark: boolean
  idempotencyKey: string
}

/**
 * `POST /media/variants` (`I4`) — M04b, đường DUY NHẤT tạo biến thể marketing.
 *
 * Đi qua nguyên `enqueueJob` của P3, giống hệt M04a: cùng đường hạn mức, cùng
 * giao dịch, cùng `Idempotency-Key`. Bản trước của M04b chạy bằng một route
 * tự `spawn` Python rồi đọc stdout — đường đó không có tổ chức, không có
 * năng lực, không trừ credit, và vi phạm thẳng luật "cấm `subprocess` +
 * parse stdout, cấm chạy job qua HTTP" ở `AGENTS.md`.
 *
 * Kiểm asset TRƯỚC khi vào hàng đợi, cùng lý do như `request-optimization.ts`:
 * một job trỏ vào asset của tổ chức khác chỉ `FAILED` ở worker, sau khi
 * credit đã bị trừ ở bước enqueue.
 *
 * `409` chứ không `403` khi Master chưa duyệt: người gọi CÓ năng lực `I4`,
 * chỉ là bản ghi chưa ở trạng thái dùng được. Trả `403` sẽ đẩy người dùng đi
 * xin thêm quyền cho một việc mà quyền không giải quyết được.
 */
export async function requestVariants(ctx: TenantContext, input: RequestVariantsInput) {
  const master = await new AssetRepository().findById(ctx, input.masterAssetId)
  if (!master) throw notFound()

  if (!isEligibleMasterForVariants(master)) {
    throw conflict(
      "Biến thể marketing chỉ dựng được trên Master Image đã duyệt (cổng 2, media.approve)"
    )
  }

  return enqueueJob(ctx, {
    feature: MEDIA_VARIANT_FEATURE,
    productId: master.product_id,
    payload: {
      master_asset_id: input.masterAssetId,
      preset: input.preset,
      ratio: input.ratio,
      watermark: input.watermark,
    },
    idempotencyKey: input.idempotencyKey,
  })
}
