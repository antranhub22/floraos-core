import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { STUCK_JOB_TIMEOUT_MS } from "@/modules/jobs/domain/job-rules"

/**
 * `YC-J10` — job `PROCESSING` quá 15 phút bị đánh dấu `FAILED`. Không có
 * người dùng nào chờ đáp ứng của hàm này; nó chạy định kỳ ngoài request HTTP
 * (`scripts/scan-stuck-jobs.ts`), không phải một route.
 */
export function scanStuckJobs(now: Date = new Date()): Promise<number> {
  return new GenerationJobRepository().markStuckAsFailed(now, STUCK_JOB_TIMEOUT_MS)
}
