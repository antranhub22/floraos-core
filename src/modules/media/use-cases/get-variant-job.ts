import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { JobEventRepository } from "@/modules/jobs/infra/job-event-repository"
import {
  canApproveVariant,
  MEDIA_VARIANT_CLOUD_FEATURE,
  MEDIA_VARIANT_FEATURES,
  parseVariantIntegrityBlock,
  variantRequiresWarning,
  type VariantIntegrityBlock,
} from "@/modules/media/domain/variant-rules"

const PREVIEW_EXPIRES_IN = 3600

export type VariantItem = {
  asset_id: string
  variant_key: string
  title: string
  background: string
  ratio: string
  watermark: boolean
  generative_fill_used: boolean
  url: string
  approval_state: "pending" | "approved" | "rejected"
  approved_at: string | null
}

export type VariantJobDetail = {
  job_id: string
  status: string
  stage: string | null
  error: string | null
  result: string | null
  source: {
    master_asset_id: string | null
    master_url: string | null
    preset: string | null
    ratio: string | null
    watermark: boolean
    /** `local_studio` | `cloud_provider` — theo `feature` của job (23/09/2026). */
    engine: "local_studio" | "cloud_provider"
    /** Phân cảnh Narrative Arc 1..4 nếu job sinh từ Khu vực D. */
    scene_index: number | null
    /** Nhánh cloud mà nhà cung cấp lỗi, worker đã lùi về phông cục bộ. */
    cloud_fallback: boolean
    /** Lý do nhà cung cấp hậu cảnh lỗi (vd "Stability trả HTTP 402 …") — hiển thị cho người dùng. */
    cloud_fallback_reason: string | null
  }
  /** Số ĐO, không phải số trang trí — xem `variant-rules.ts`. */
  subject_integrity: VariantIntegrityBlock | null
  variants: VariantItem[]
  approval: {
    can_approve: boolean
    requires_warning: boolean
  }
}

const TRANG_THAI: Record<string, "pending" | "approved" | "rejected"> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
}

function doc<T>(nguon: unknown, khoa: string, mac_dinh: T): T {
  if (typeof nguon !== "object" || nguon === null) return mac_dinh
  const value = (nguon as Record<string, unknown>)[khoa]
  return (value ?? mac_dinh) as T
}

/**
 * `GET /media/variants/:id` (`I4`) — M04b.
 *
 * `:id` là `job_id`: M04b cũng không có bảng riêng, một lượt dựng biến thể
 * CHÍNH LÀ một `generation_jobs` (`feature = "media.variant"`), cùng khuôn
 * với M04a.
 *
 * Mọi URL trả về đây là URL KÝ CÓ HẠN của kho tệp, không phải `data:` base64.
 * Bản trước trả ảnh dưới dạng base64 thẳng trong đáp ứng JSON: ảnh không
 * nằm trong kho, không có dòng `assets`, nên tắt trình duyệt là mất, và
 * không có gì để duyệt hay để đem đi đăng.
 */
export async function getVariantJob(ctx: TenantContext, jobId: string): Promise<VariantJobDetail> {
  const job = await new GenerationJobRepository().findById(ctx, jobId)
  // Chỉ job biến thể — `:id` của một job khác (vd. video) không được đọc qua đây.
  if (!job || !(MEDIA_VARIANT_FEATURES as readonly string[]).includes(job.feature)) throw notFound()

  // Quyền sở hữu job đã kiểm ở trên — `job_events` không mang
  // `organization_id`, nên thứ tự này bắt buộc, không phải tuỳ chọn.
  const suKien = await new JobEventRepository().findLatestByType(jobId, "variant_integrity")
  const integrity = parseVariantIntegrityBlock(suKien?.payload)

  const assetRepo = new AssetRepository()
  const storage = getStorageProvider()

  const payload = job.payload
  const masterAssetId = doc<string | null>(payload, "master_asset_id", null)
  const preset = doc<string | null>(payload, "preset", null)
  const ratio = doc<string | null>(payload, "ratio", null)
  const watermark = doc<boolean>(payload, "watermark", false)
  const sceneIndex = doc<number | null>(payload, "scene_index", null)
  const engine: "local_studio" | "cloud_provider" =
    job.feature === MEDIA_VARIANT_CLOUD_FEATURE ? "cloud_provider" : "local_studio"
  const cloudFallback = doc<boolean>(job.output, "cloud_fallback", false)
  const cloudFallbackReason = doc<string | null>(job.output, "cloud_fallback_reason", null)

  let masterUrl: string | null = null
  if (masterAssetId) {
    const master = await assetRepo.findById(ctx, masterAssetId)
    if (master) masterUrl = await storage.signedUrl(master.storage_key, PREVIEW_EXPIRES_IN)
  }

  const rows = await assetRepo.listByJobId(ctx, jobId, "MARKETING")
  const variants: VariantItem[] = []
  for (const row of rows) {
    const meta = row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {}
    const flags =
      row.generated_flags && typeof row.generated_flags === "object"
        ? (row.generated_flags as Record<string, unknown>)
        : {}
    variants.push({
      asset_id: row.id,
      variant_key: typeof meta.variant_key === "string" ? meta.variant_key : "unknown",
      title: typeof meta.title === "string" ? meta.title : "Biến thể",
      background: typeof meta.background === "string" ? meta.background : "",
      ratio: row.aspect_ratio ?? (typeof meta.ratio === "string" ? meta.ratio : ""),
      watermark: meta.watermark === true,
      generative_fill_used: flags.generative_fill_used === true,
      url: await storage.signedUrl(row.storage_key, PREVIEW_EXPIRES_IN),
      approval_state: TRANG_THAI[row.approval_state] ?? "pending",
      approved_at: row.approved_at?.toISOString() ?? null,
    })
  }

  const ketQua = integrity?.result ?? null

  return {
    job_id: job.id,
    status: job.status,
    stage: job.stage,
    error: job.error,
    result: job.result,
    source: {
      master_asset_id: masterAssetId,
      master_url: masterUrl,
      preset,
      ratio,
      watermark,
      engine,
      scene_index: typeof sceneIndex === "number" ? sceneIndex : null,
      cloud_fallback: cloudFallback === true,
      cloud_fallback_reason: typeof cloudFallbackReason === "string" ? cloudFallbackReason : null,
    },
    subject_integrity: integrity,
    variants,
    approval: {
      can_approve: variants.length > 0 && ketQua !== null && canApproveVariant(ketQua),
      requires_warning: ketQua !== null && variantRequiresWarning(ketQua),
    },
  }
}
