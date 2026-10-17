import { log } from "@/core/observability/log"
import { purgeExpiredTrash } from "./purge-expired-trash"

const STARTED = Symbol.for("floraos.storage.trash-purge")
/** Mỗi giờ một vòng — mục quá hạn bị xoá chậm nhất ~1 giờ sau mốc 30 ngày. */
export const TRASH_PURGE_INTERVAL_MS = 60 * 60 * 1000

/**
 * Chạy bộ dọn Thùng rác trong tiến trình web (gọi từ `src/instrumentation.ts`).
 * Một lần mỗi tiến trình; vòng trước chưa xong thì bỏ lượt; không giữ tiến trình sống (`unref`).
 * Tắt bằng `TRASH_PURGE=off`.
 */
export function startTrashPurge(): void {
  const g = globalThis as unknown as Record<symbol, boolean | undefined>
  if (g[STARTED]) return
  if (process.env["TRASH_PURGE"] === "off") return
  g[STARTED] = true
  let running = false
  const timer = setInterval(() => {
    if (running) return
    running = true
    purgeExpiredTrash()
      .then((r) => {
        if (r.purged + r.failed > 0) log.info("storage.trash.purge", { feature: "storage", ...r })
      })
      .catch((error: unknown) => {
        log.error("storage.trash.purge_sweep_failed", {
          feature: "storage",
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        running = false
      })
  }, TRASH_PURGE_INTERVAL_MS)
  timer.unref?.()
}
