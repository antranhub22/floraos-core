import { conflict, notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { JobEventRepository } from "@/modules/jobs/infra/job-event-repository"
import { canApproveVariant, parseVariantIntegrityBlock } from "@/modules/media/domain/variant-rules"

const HAN_URL_GIAY = 5 * 60

/**
 * `GET /media/variants/:id/download?asset_id=…` (`I3`).
 *
 * **Tải về KHÔNG phải là duyệt** — cùng luật M04 mục 5.1 đã áp cho M04a.
 * Người có `I3` mà không có `I5` tải biến thể về xem được, nhưng không biến
 * nó thành ảnh chính thức được.
 *
 * Lượt bị cổng Subject Integrity từ chối thì không tải được: worker không
 * ghi asset nào cho nó. Điều kiện dưới đây là lớp chặn thứ hai, phòng khi
 * một ngày có đường ghi khác lỡ tạo asset cho lượt bị từ chối.
 */
export async function downloadVariant(
  ctx: TenantContext,
  jobId: string,
  assetId: string
): Promise<{ url: string; asset_id: string; expires_in: number }> {
  const job = await new GenerationJobRepository().findById(ctx, jobId)
  if (!job) throw notFound()

  const suKien = await new JobEventRepository().findLatestByType(jobId, "variant_integrity")
  const integrity = parseVariantIntegrityBlock(suKien?.payload)
  if (integrity && !canApproveVariant(integrity.result)) {
    throw conflict("Cổng Subject Integrity đã từ chối lượt này — chỉ Master Image còn dùng được")
  }

  const thuocJob = await new AssetRepository().listByJobId(ctx, jobId, "MARKETING")
  const target = thuocJob.find((a) => a.id === assetId)
  if (!target) throw notFound()

  const url = await getStorageProvider().signedUrl(target.storage_key, HAN_URL_GIAY)
  return { url, asset_id: target.id, expires_in: HAN_URL_GIAY }
}
