import { conflict, notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { canRetry } from "@/modules/jobs/domain/job-rules"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"

/**
 * `POST /jobs/:id/retry` (`G7`) — chỉ job `FAILED` (`YC-J3`). Job
 * `COMPLETED` với `result = REJECTED` trả 409, không phải 200: chạy lại cho
 * ra đúng phán quyết cũ, chỉ tốn GPU (đặc tả 06 mục 7).
 */
export async function retryJob(ctx: TenantContext, id: string) {
  const repo = new GenerationJobRepository()
  const current = await repo.findById(ctx, id)
  if (!current) throw notFound()
  if (!canRetry(current.status)) {
    throw conflict(`Job đang ở trạng thái ${current.status}, không chạy lại được`)
  }

  const retried = await repo.retryIfFailed(ctx, id)
  if (!retried) throw conflict("Job không còn ở trạng thái FAILED")
  return retried
}
