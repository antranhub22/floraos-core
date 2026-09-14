import { conflict, notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { LocalDiskStorageProvider } from "@/modules/assets/adapters/local-disk-storage-provider"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import { runInTransaction } from "@/modules/jobs/infra/transaction"

const PREVIEW_EXPIRES_IN = 24 * 60 * 60

/**
 * `approveAsset` — Duyệt một asset (Master Image hoặc Biến thể Marketing M04b).
 * - Yêu cầu quyền `I2` (hoặc `P2`) gác ở route.
 * - Chỉ duyệt asset ở trạng thái `PENDING`.
 * - Ghi nhận `approved_by`, `approved_at` và `audit_logs` trong một giao dịch.
 */
export async function approveAsset(ctx: TenantContext, assetId: string) {
  const assetRepo = new AssetRepository()
  const asset = await assetRepo.findById(ctx, assetId)
  if (!asset) throw notFound()

  if (asset.approval_state === "APPROVED") {
    // Idempotent: nếu đã duyệt rồi thì trả về luôn
    let url: string | null = null
    try {
      url = await new LocalDiskStorageProvider().signedUrl(asset.storage_key, PREVIEW_EXPIRES_IN)
    } catch {
      url = null
    }
    return { ...asset, url, image_url: url }
  }

  let approvedAsset = await runInTransaction(async (tx) => {
    const updated = await new AssetRepository(tx).approve(ctx, assetId, {
      approvedBy: ctx.userId,
      approvedAt: new Date(),
    })
    if (!updated) throw conflict("Bản ghi vừa đổi trạng thái hoặc không thể duyệt, vui lòng thử lại")

    await recordAuditLog(
      ctx,
      {
        action: "asset.approve",
        entityType: "assets",
        entityId: assetId,
        before: { approval_state: asset.approval_state },
        after: { approval_state: "APPROVED" },
      },
      tx
    )

    return updated
  })

  let url: string | null = null
  try {
    url = await new LocalDiskStorageProvider().signedUrl(approvedAsset.storage_key, PREVIEW_EXPIRES_IN)
  } catch {
    url = null
  }

  return { ...approvedAsset, url, image_url: url }
}
