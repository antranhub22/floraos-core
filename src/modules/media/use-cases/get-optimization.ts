import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { JobEventRepository } from "@/modules/jobs/infra/job-event-repository"
import {
  canApproveOptimization,
  isGuardResult,
  parseIdentityGuardBlock,
  requiresWarningBeforeApprove,
  type IdentityGuardBlock,
} from "@/modules/media/domain/optimization-rules"

export type OptimizationDetail = {
  job_id: string
  status: string
  result: string | null
  identity_guard: IdentityGuardBlock | null
  outputs: { master: string | null; ratios: Record<string, string> }
  approval: {
    state: "pending" | "approved" | "rejected"
    approved_by: string | null
    approved_at: string | null
    /** `YC-R5` — `REJECTED` không vào được luồng duyệt. */
    can_approve: boolean
    /** `YC-R6` — giao diện PHẢI cảnh báo trước khi bấm duyệt. Máy chủ nói
     *  thẳng cờ này thay vì để mỗi màn hình tự suy từ chuỗi `result`. */
    requires_warning: boolean
  }
  flags: Record<string, unknown>
}

const TRANG_THAI: Record<string, "pending" | "approved" | "rejected"> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
}

/**
 * `GET /media/optimizations/:id` (`I1`, đặc tả 06 mục 8). `:id` là `job_id` —
 * M04a không có bảng riêng, một lượt tối ưu CHÍNH LÀ một `generation_jobs`.
 */
export async function getOptimization(
  ctx: TenantContext,
  jobId: string
): Promise<OptimizationDetail> {
  const job = await new GenerationJobRepository().findById(ctx, jobId)
  if (!job) throw notFound()

  // Quyền sở hữu job đã kiểm ở trên — `job_events` không mang
  // `organization_id` nên thứ tự này là bắt buộc, không phải tuỳ chọn.
  const suKien = await new JobEventRepository().findLatestByType(jobId, "guard")
  const guard = parseIdentityGuardBlock(suKien?.payload)

  const master = await new AssetRepository().findMasterByJobId(ctx, jobId)
  const ketQua = isGuardResult(job.result) ? job.result : null

  return {
    job_id: job.id,
    status: job.status,
    result: job.result,
    identity_guard: guard,
    outputs: {
      // Bị từ chối thì KHÔNG có Master Image — worker không ghi asset nào
      // (M04 mục 5: "Giữ Original, không trả ảnh đã enhance").
      master: master?.id ?? null,
      // Smart Reframe (các tỉ lệ 1x1/4x5/9x16/16x9) thuộc nửa sau của P9,
      // chưa dựng. Trả object RỖNG chứ không bịa khoá trỏ vào đâu cả.
      ratios: {},
    },
    approval: {
      state: master ? (TRANG_THAI[master.approval_state] ?? "pending") : "pending",
      approved_by: master?.approved_by ?? null,
      approved_at: master?.approved_at?.toISOString() ?? null,
      can_approve: Boolean(master) && ketQua !== null && canApproveOptimization(ketQua),
      requires_warning: ketQua !== null && requiresWarningBeforeApprove(ketQua),
    },
    flags: (master?.generated_flags as Record<string, unknown> | null) ?? {},
  }
}
