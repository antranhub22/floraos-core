import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { JobEventRepository } from "@/modules/jobs/infra/job-event-repository"

/**
 * `GET /jobs/:id/events` (`G4`, đặc tả 06 mục 7). `afterSeq` đến từ
 * `Last-Event-ID` — 0 nghĩa là từ đầu. Kiểm quyền đọc job trước (bộ gác tổ
 * chức) rồi mới đọc nhật ký, vì `job_events` không tự mang `organization_id`
 * — nó thuộc về job, không thuộc trực tiếp về tổ chức.
 */
export async function getJobEvents(ctx: TenantContext, jobId: string, afterSeq: number) {
  const job = await new GenerationJobRepository().findById(ctx, jobId)
  if (!job) throw notFound()
  return new JobEventRepository().listSince(jobId, afterSeq)
}
