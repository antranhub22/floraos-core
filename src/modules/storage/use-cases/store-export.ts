import type { TenantContext } from "@/core/tenancy"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { AuditLogRepository } from "@/modules/audit/infra/audit-log-repository"
import {
  isStoreExportExpired,
  readStoreExportOutput,
  storeExportExpiresAt,
  type StoreExportStatus,
  type StoreExportView,
} from "../domain/store-export"
import { StoreExportJobRepository, type generation_jobs } from "../infra/store-export-job-repository"

type Signer = { signedUrl(key: string, expiresInSeconds: number): Promise<string> }

/** Ảnh chụp trạng thái cho giao diện; link tải chỉ có khi đã xong và còn hạn. */
export async function toStoreExportView(job: generation_jobs, now: Date, signer: Signer): Promise<StoreExportView> {
  const output = readStoreExportOutput(job.output)
  const expired = job.status === "COMPLETED" && isStoreExportExpired(job.completed_at, now)
  const status: StoreExportStatus = expired ? "EXPIRED" : (job.status as StoreExportStatus)
  const expiresAt = job.status === "COMPLETED" && job.completed_at ? storeExportExpiresAt(job.completed_at) : null

  let downloadUrl: string | null = null
  if (status === "COMPLETED" && output && expiresAt) {
    const seconds = Math.max(60, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
    downloadUrl = await signer.signedUrl(output.storageKey, seconds)
  }

  return {
    id: job.id,
    status,
    requestedAt: job.created_at.toISOString(),
    completedAt: job.completed_at?.toISOString() ?? null,
    expiresAt: expiresAt?.toISOString() ?? null,
    sizeBytes: output?.sizeBytes ?? null,
    counts: output?.counts ?? null,
    imageCount: output?.imageCount ?? null,
    skippedImageCount: output?.skippedImageCount ?? null,
    error: job.status === "FAILED" ? "Không tạo được bản sao lưu. Vui lòng thử lại." : null,
    downloadUrl,
  }
}

/** `GET /storage/export` — lần xuất gần nhất của cửa hàng (hoặc `null`). */
export async function getStoreExport(
  ctx: TenantContext,
  repo = new StoreExportJobRepository(),
  now = new Date()
): Promise<StoreExportView | null> {
  const job = await repo.findLatest(ctx)
  return job ? toStoreExportView(job, now, getStorageProvider()) : null
}

/**
 * `POST /storage/export` — xếp một lượt xuất vào hàng đợi. Đang có lượt chờ/đang chạy
 * thì trả lại chính lượt đó, không tạo trùng.
 */
export async function requestStoreExport(
  ctx: TenantContext,
  repo = new StoreExportJobRepository(),
  audit: Pick<AuditLogRepository, "record"> = new AuditLogRepository(),
  now = new Date()
): Promise<StoreExportView> {
  const active = await repo.findActive(ctx)
  const job = active ?? (await repo.create(ctx))
  if (!active) {
    await audit.record(ctx, { action: "store.export.request", entityType: "store_export", entityId: job.id })
  }
  return toStoreExportView(job, now, getStorageProvider())
}
