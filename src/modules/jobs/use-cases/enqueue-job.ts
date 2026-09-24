import { AppError, quotaExceeded, validationFailed } from "@/core/http/errors"
import { log } from "@/core/observability/log"
import { docCauHinhTran, moc, vuotTran } from "@/modules/jobs/domain/rate-limit"
import type { TenantContext } from "@/core/tenancy"
import { OrganizationRepository } from "@/modules/organization/infra/organization-repository"
import { WorkspaceRepository } from "@/modules/organization/infra/workspace-repository"
import { costCreditForFeature } from "@/modules/usage/domain/pricing"
import { fundingSourceForWorkspace } from "@/modules/usage/domain/quota"
import { UsageRepository } from "@/modules/usage/infra/usage-repository"

import { isDuplicateIdempotencyError } from "@/modules/jobs/domain/job-rules"
import { PostgresQueueProvider } from "@/modules/jobs/adapters/postgres-queue-provider"
import type { generation_jobs } from "@/modules/jobs/infra/entities"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { runInTransaction } from "@/modules/jobs/infra/transaction"

export type EnqueueJobInput = {
  feature: string
  payload: unknown
  productId?: string | null | undefined
  idempotencyKey: string
  /** Gom nhiều job cùng một lượt chạy lô (vd 30 biến thể, nợ #108) về một
   *  màn tiến độ chung — KHÔNG phải khoá nghiệp vụ, không đổi hạn mức/credit. */
  jobGroupId?: string | null | undefined
  /** Credit của RIÊNG lượt này khi giá phụ thuộc tham số (Audio Studio,
   *  24/09/2026: số cảnh × nhà cung cấp × chất lượng). Không truyền = giá
   *  theo feature (`pricing.ts`). Số nguyên ≥ 0; 0 vẫn tiêu một lượt dùng thử. */
  costCredit?: number | undefined
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

  const dedupe = async (): Promise<EnqueueJobResult | null> => {
    const existing = await new GenerationJobRepository().findByIdempotencyKey(
      ctx,
      input.feature,
      input.idempotencyKey
    )
    if (!existing) return null
    return { job: existing, deduped: true, usage: { costCredit: 0, balanceAfter: null } }
  }

  const before = await dedupe()
  if (before) return before

  // Trần vận hành, đứng TRƯỚC hạn mức credit. Hai thứ khác nhau: credit nói
  // tổ chức còn bao nhiêu lượt, trần này nói bao nhiêu lượt cùng lúc. Đếm ở
  // cơ sở dữ liệu chứ không đếm trong bộ nhớ tiến trình — nhiều tiến trình
  // web đếm riêng thì trần thành vô nghĩa, và đó đúng là lỗi hệ v1 đã mắc
  // với trạng thái job.
  const cauHinhTran = docCauHinhTran(process.env)
  const daTao = await new GenerationJobRepository().countSince(ctx, moc(new Date(), cauHinhTran))
  if (vuotTran(daTao, cauHinhTran)) {
    log.warn("job.rate_limited", {
      organizationId: ctx.organizationId,
      feature: input.feature,
      daTao,
      tran: cauHinhTran.tranMoiCuaSo,
      cuaSoGiay: cauHinhTran.cuaSoGiay,
    })
    throw new AppError("RATE_LIMITED", "Quá nhiều lượt chạy trong thời gian ngắn, thử lại sau", {
      da_tao: daTao,
      tran: cauHinhTran.tranMoiCuaSo,
      cua_so_giay: cauHinhTran.cuaSoGiay,
    })
  }

  if (input.costCredit !== undefined && (!Number.isInteger(input.costCredit) || input.costCredit < 0)) {
    throw validationFailed({ cost_credit: "Phải là số nguyên ≥ 0" })
  }
  const cost = input.costCredit ?? costCreditForFeature(input.feature)

  async function runTransaction(): Promise<EnqueueJobResult> {
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
          jobGroupId: input.jobGroupId ?? null,
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

  try {
    return await runTransaction()
  } catch (error) {
    // Cuộc đua: hai request cùng `Idempotency-Key` cùng qua được `dedupe()`
    // ở trên, người thua vỡ ở `@@unique([organization_id, feature,
    // idempotency_key])`. Giao dịch đã cuộn lại nên không có job thừa và
    // không có credit bị trừ hai lần — chỉ cần đọc lại job của người thắng
    // và trả về đúng ngữ nghĩa `Idempotency-Key` (`YC-U7`), thay vì để lỗi
    // Prisma nổi lên thành 500.
    if (!isDuplicateIdempotencyError(error)) throw error
    const after = await dedupe()
    if (after) return after
    // Trùng khoá mà đọc lại vẫn không thấy là mâu thuẫn thật, không phải đua.
    throw error
  }
}
