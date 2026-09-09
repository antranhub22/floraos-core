import { AppError, quotaExceeded, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { OrganizationRepository } from "@/modules/organization/infra/organization-repository"
import { WorkspaceRepository } from "@/modules/organization/infra/workspace-repository"
import { costCreditForFeature } from "@/modules/usage/domain/pricing"
import { fundingSourceForWorkspace } from "@/modules/usage/domain/quota"
import { UsageRepository } from "@/modules/usage/infra/usage-repository"

import { PostgresQueueProvider } from "@/modules/jobs/adapters/postgres-queue-provider"
import type { generation_jobs } from "@/modules/jobs/infra/entities"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { runInTransaction } from "@/modules/jobs/infra/transaction"

export type EnqueueJobInput = {
  feature: string
  payload: unknown
  productId?: string | null | undefined
  idempotencyKey: string
}

export type EnqueueJobResult = {
  job: generation_jobs
  deduped: boolean
  usage: { costCredit: number; balanceAfter: number | null }
}

/**
 * Điểm vào chung cho mọi module tạo job (M01/M04a/M05/M06, đặc tả 06 mục 2 và
 * 7). Bốn việc trong MỘT giao dịch (đặc tả 05 mục 6, `YC-U3`):
 *
 *   kiểm hạn mức → ghi usage (ENQUEUED) → tạo generation_jobs → NOTIFY
 *
 * Idempotency (`YC-U7`) kiểm TRƯỚC khi mở giao dịch: đã có job cũ thì trả
 * lại nguyên nó, không chạm hạn mức lần hai.
 */
export async function enqueueJob(
  ctx: TenantContext,
  input: EnqueueJobInput
): Promise<EnqueueJobResult> {
  if (!input.feature) throw validationFailed({ feature: "Bắt buộc" })
  if (!input.idempotencyKey) {
    throw validationFailed({ idempotency_key: "Bắt buộc trên mọi endpoint tạo job (YC-U7)" })
  }

  const existing = await new GenerationJobRepository().findByIdempotencyKey(
    ctx,
    input.feature,
    input.idempotencyKey
  )
  if (existing) {
    return { job: existing, deduped: true, usage: { costCredit: 0, balanceAfter: null } }
  }

  const cost = costCreditForFeature(input.feature)

  return runInTransaction(async (tx) => {
    const workspaceRepo = new WorkspaceRepository(tx)
    const workspace = await workspaceRepo.findById(ctx, ctx.workspaceId)
    if (!workspace) throw new AppError("INTERNAL", "Workspace của ngữ cảnh không tồn tại")

    const fundingSource = fundingSourceForWorkspace(workspace.kind)

    if (fundingSource === "trial") {
      const ok = await workspaceRepo.tryConsumeTrial(workspace.id)
      if (!ok) throw quotaExceeded("Đã hết lượt dùng thử", { workspace_id: workspace.id })
    } else {
      const ok = await new OrganizationRepository(tx).tryDeductCredit(ctx, cost)
      if (!ok) throw quotaExceeded("Không đủ credit", { required: cost })
    }

    const { jobId } = await new PostgresQueueProvider().enqueue(
      {
        ctx,
        branchId: ctx.branchId,
        productId: input.productId ?? null,
        feature: input.feature,
        payload: input.payload,
        idempotencyKey: input.idempotencyKey,
      },
      tx
    )

    await new UsageRepository(tx).record(ctx, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      jobId,
      feature: input.feature,
      costCredit: fundingSource === "credit" ? cost : 0,
      status: "ENQUEUED",
      metadata: { funded_by: fundingSource },
    })

    const job = await new GenerationJobRepository(tx).findById(ctx, jobId)
    if (!job) throw new AppError("INTERNAL", "Job vừa tạo không đọc lại được trong cùng giao dịch")

    let balanceAfter: number | null = null
    if (fundingSource === "credit") {
      const organization = await new OrganizationRepository(tx).current(ctx)
      balanceAfter = organization?.credit_balance ?? null
    }

    return {
      job,
      deduped: false,
      usage: { costCredit: fundingSource === "credit" ? cost : 0, balanceAfter },
    }
  })
}
