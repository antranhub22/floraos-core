import { log } from "@/core/observability/log"
import { removeExpiredStoreExports, runNextStoreExport } from "./run-store-export"

const STARTED = Symbol.for("floraos.storage.store-export")
export const STORE_EXPORT_POLL_MS = 20 * 1000
/** Mỗi vòng chạy tối đa chừng này lượt xuất — mỗi lượt dựng ZIP trong bộ nhớ, chạy tuần tự. */
const MAX_EXPORTS_PER_TICK = 2

/**
 * Hàng đợi "Tải dữ liệu cửa hàng" chạy trong tiến trình web (gọi từ `src/instrumentation.ts`),
 * nhận job `store.export` bằng `FOR UPDATE SKIP LOCKED` nên nhiều tiến trình không chạy trùng.
 * Tắt bằng `STORE_EXPORT_WORKER=off`.
 */
export function startStoreExportWorker(): void {
  const g = globalThis as unknown as Record<symbol, boolean | undefined>
  if (g[STARTED]) return
  if (process.env["STORE_EXPORT_WORKER"] === "off") return
  g[STARTED] = true
  let running = false
  const timer = setInterval(() => {
    if (running) return
    running = true
    void (async () => {
      for (let i = 0; i < MAX_EXPORTS_PER_TICK; i += 1) {
        if (!(await runNextStoreExport())) break
      }
      await removeExpiredStoreExports()
    })()
      .catch((error: unknown) => {
        log.error("storage.export.worker_failed", {
          feature: "storage",
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        running = false
      })
  }, STORE_EXPORT_POLL_MS)
  timer.unref?.()
}
