import type { StorageProvider } from "@/core/ports"
import type { TenantContext } from "@/core/tenancy"
import { log } from "@/core/observability/log"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { ZipArchive, writeWorkbook } from "../adapters/zip-archive"
import {
  STORE_EXPORT_LINK_TTL_MS,
  STORE_EXPORT_README,
  extensionFor,
  pickImagesWithinBudget,
  readStoreExportOutput,
  safeFileName,
  storeExportKey,
  toPlain,
  type StoreExportOutput,
} from "../domain/store-export"
import { buildStoreSheets } from "../domain/store-export-sheets"
import { StoreExportJobRepository, type generation_jobs } from "../infra/store-export-job-repository"
import { StoreExportQuery } from "../infra/store-export-query"

export const STORE_EXPORT_CLEANUP_BATCH = 50

function jobContext(job: generation_jobs): TenantContext {
  return {
    organizationId: job.organization_id,
    workspaceId: job.workspace_id,
    userId: job.user_id,
    branchId: null,
    capabilities: new Set(),
  }
}

/** Dựng ZIP cho một cửa hàng: Excel + data.json + ảnh gốc (trong trần dung lượng). */
export async function buildStoreArchive(
  ctx: TenantContext,
  query = new StoreExportQuery(),
  storage: StorageProvider = getStorageProvider(),
  now = new Date()
): Promise<{ bytes: Uint8Array; imageCount: number; skippedImageCount: number; counts: Record<string, number> }> {
  const data = await query.loadData(ctx)
  const zip = new ZipArchive()
  zip.add("doc-truoc.txt", STORE_EXPORT_README)
  zip.add("du-lieu-cua-hang.xlsx", writeWorkbook(buildStoreSheets(data)))
  zip.add(
    "data.json",
    JSON.stringify({ exported_at: now.toISOString(), organization_id: ctx.organizationId, tables: toPlain(data) }, null, 2)
  )

  const { picked, skipped } = pickImagesWithinBudget(await query.listOriginalImages(ctx))
  const missing: string[] = []
  const usedNames = new Set<string>()
  for (const image of picked) {
    const base = safeFileName(image.name.replace(/\.[a-z0-9]{2,5}$/i, ""))
    const name = usedNames.has(base) ? `${base}-${image.id.slice(0, 8)}` : base
    usedNames.add(name)
    try {
      zip.add(`anh-goc/${name}.${extensionFor(image.mimeType, image.storageKey)}`, await storage.get(image.storageKey))
    } catch {
      missing.push(`${image.name} (không còn tệp trong kho)`)
    }
  }
  const notIncluded = [...skipped.map((image) => image.name), ...missing]
  if (notIncluded.length > 0) zip.add("anh-bo-qua.txt", notIncluded.join("\n"))

  const counts = Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, rows.length]))
  return { bytes: zip.toBytes(), imageCount: picked.length - missing.length, skippedImageCount: notIncluded.length, counts }
}

/** Nhận MỘT lượt xuất đang chờ và chạy nó. Trả `false` khi hàng đợi trống. */
export async function runNextStoreExport(
  repo = new StoreExportJobRepository(),
  storage: StorageProvider = getStorageProvider(),
  build: typeof buildStoreArchive = buildStoreArchive
): Promise<boolean> {
  const job = await repo.claimNext()
  if (!job) return false
  const ctx = jobContext(job)
  try {
    const archive = await build(ctx, undefined, storage)
    const storageKey = storeExportKey(job.organization_id, job.id)
    await storage.put(storageKey, archive.bytes, "application/zip")
    const output: StoreExportOutput = {
      storageKey,
      sizeBytes: archive.bytes.byteLength,
      imageCount: archive.imageCount,
      skippedImageCount: archive.skippedImageCount,
      counts: archive.counts,
    }
    await repo.finish(ctx, job.id, { ok: true, output, now: new Date() })
  } catch (error) {
    log.error("storage.export.failed", { feature: "storage", message: error instanceof Error ? error.message : String(error) })
    await repo.finish(ctx, job.id, { ok: false, error: "Không dựng được bản sao lưu", now: new Date() })
  }
  return true
}

/** Xoá tệp ZIP đã quá 24 giờ — bản sao lưu tải về là của chủ tiệm, không giữ trên máy chủ. */
export async function removeExpiredStoreExports(
  now = new Date(),
  repo = new StoreExportJobRepository(),
  storage: StorageProvider = getStorageProvider()
): Promise<number> {
  const jobs = await repo.listExpiredFiles(new Date(now.getTime() - STORE_EXPORT_LINK_TTL_MS), STORE_EXPORT_CLEANUP_BATCH)
  let removed = 0
  for (const job of jobs) {
    const output = readStoreExportOutput(job.output)
    try {
      if (output && storage.remove) await storage.remove(output.storageKey)
      await repo.markFileRemoved(job)
      removed += 1
    } catch (error) {
      log.warn("storage.export.cleanup_failed", { feature: "storage", message: error instanceof Error ? error.message : String(error) })
    }
  }
  return removed
}
