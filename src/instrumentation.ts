/**
 * Next.js gọi `register()` một lần khi tiến trình máy chủ khởi động (Next 16, `instrumentation.ts`).
 * Chỉ chạy ở runtime Node — bộ quét nền dùng Prisma, không chạy ở Edge.
 */
export async function register(): Promise<void> {
  if (process.env["NEXT_RUNTIME"] !== "nodejs") return
  const { startBackgroundSweep } = await import("@/modules/greeting-card/use-cases/background-sweep-scheduler")
  startBackgroundSweep()
  const { startTrashPurge } = await import("@/modules/storage/use-cases/trash-purge-scheduler")
  startTrashPurge()
  const { startStoreExportWorker } = await import("@/modules/storage/use-cases/store-export-scheduler")
  startStoreExportWorker()
}
