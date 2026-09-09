import { conflict, notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { canCancel } from "@/modules/jobs/domain/job-rules"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"

/** `POST /jobs/:id/cancel` (`G6`) — chỉ job còn `PENDING` (`YC-J4`). */
export async function cancelJob(ctx: TenantContext, id: string) {
  const repo = new GenerationJobRepository()
  const current = await repo.findById(ctx, id)
  if (!current) throw notFound()
  if (!canCancel(current.status)) {
    throw conflict(`Job đang ở trạng thái ${current.status}, không huỷ được`)
  }

  const cancelled = await repo.cancelIfPending(ctx, id)
  // Trượt điều kiện đua: job vừa đổi trạng thái giữa lúc kiểm và lúc ghi.
  if (!cancelled) throw conflict("Job không còn ở trạng thái PENDING")
  return cancelled
}
