import { conflict, notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { canApproveOptimization, isGuardResult } from "@/modules/media/domain/optimization-rules"

const HAN_URL_GIAY = 5 * 60

/**
 * `GET /media/optimizations/:id/download` (`I3`, đặc tả 06 mục 8).
 *
 * **Tải ảnh về KHÔNG phải là phê duyệt** (M04 mục 5.1) — hai việc, hai mã
 * năng lực. Người có `I3` mà không có `I2` tải được ảnh về xem, nhưng không
 * biến nó thành ảnh chính thức của sản phẩm được.
 *
 * Ảnh bị Identity Guard từ chối không tải được: worker không ghi dòng
 * `assets` nào cho nó, nên `findMasterByJobId` trả `null` và ta dừng ở 404.
 * Điều kiện `REJECTED` dưới đây là lớp chặn thứ hai, phòng khi có ngày một
 * đường ghi khác lỡ tạo asset cho job bị từ chối.
 */
export async function downloadOptimization(
  ctx: TenantContext,
  jobId: string,
  ratio?: string | undefined
): Promise<{ url: string; asset_id: string; expires_in: number }> {
  const job = await new GenerationJobRepository().findById(ctx, jobId)
  if (!job) throw notFound()

  if (isGuardResult(job.result) && !canApproveOptimization(job.result)) {
    throw conflict("Identity Guard đã từ chối ảnh này — chỉ ảnh gốc còn dùng được")
  }

  const assetRepo = new AssetRepository()
  const master = await assetRepo.findMasterByJobId(ctx, jobId)
  if (!master) throw notFound()

  let targetAsset = master
  if (ratio) {
    const derived = await assetRepo.listDerivedFrom(ctx, master.id)
    const matched = derived.find((d) => {
      if (d.kind !== "RATIO") return false
      const meta = d.metadata && typeof d.metadata === "object" ? (d.metadata as Record<string, unknown>) : null
      return meta?.ratio === ratio
    })
    if (matched) {
      targetAsset = matched
    }
  }

  const url = await getStorageProvider().signedUrl(targetAsset.storage_key, HAN_URL_GIAY)
  return { url, asset_id: targetAsset.id, expires_in: HAN_URL_GIAY }
}
