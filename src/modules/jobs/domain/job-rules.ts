/**
 * Ba trục tách rời của job (`YC-J1` `YC-J2`, đặc tả 07 mục 6) và luật chuyển
 * trạng thái quanh nó (`YC-J3` `YC-J4`, đặc tả 05 mục 7). Tệp thuần — không
 * import Prisma, test không cần cơ sở dữ liệu.
 *
 *   PENDING → PROCESSING → COMPLETED (result: bất kỳ, kể cả REJECTED)
 *           ↘ CANCELLED (chỉ từ PENDING)
 *   PROCESSING → FAILED (timeout/crash/lỗi nhà cung cấp, kể cả do quét treo)
 *   FAILED → PENDING (retry, attempts += 1)
 *
 * `COMPLETED` không bao giờ retry được, kể cả khi `result = REJECTED` — đó
 * là job chạy đúng và đi tới phán quyết, không phải job lỗi.
 */
export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"

const TERMINAL: ReadonlySet<JobStatus> = new Set(["COMPLETED", "FAILED", "CANCELLED"])

export function isTerminalStatus(status: JobStatus): boolean {
  return TERMINAL.has(status)
}

/** `POST /jobs/:id/cancel` (`G6`) — chỉ job còn `PENDING`. */
export function canCancel(status: JobStatus): boolean {
  return status === "PENDING"
}

/**
 * `POST /jobs/:id/retry` (`G7`) — chỉ job `FAILED`. Job `COMPLETED` với
 * `result = REJECTED` trả 409, không phải 200 (đặc tả 06 mục 7): chạy lại
 * cho ra đúng phán quyết cũ, chỉ tốn GPU.
 */
export function canRetry(status: JobStatus): boolean {
  return status === "FAILED"
}

const STUCK_TIMEOUT_MS = 15 * 60 * 1000

/**
 * Job `PROCESSING` quá `started_at + 15 phút` (`YC-J10`, đặc tả 05 mục 7).
 * Tiến trình quét gọi hàm này để quyết định, rồi
 * `GenerationJobRepository.markStuckAsFailed` ghi bằng một câu SQL có điều
 * kiện tương đương — hàm ở đây chỉ để test khoá đúng ngưỡng 15 phút, không
 * tự nó chạy trên dữ liệu thật.
 */
export function isStuck(
  job: { status: JobStatus; started_at: Date | null },
  now: Date
): boolean {
  if (job.status !== "PROCESSING" || !job.started_at) return false
  return now.getTime() - job.started_at.getTime() > STUCK_TIMEOUT_MS
}

export const STUCK_JOB_TIMEOUT_MS = STUCK_TIMEOUT_MS
