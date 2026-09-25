import type { TenantContext } from "@/core/tenancy"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { runInTransaction } from "@/modules/jobs/infra/transaction"
import { OrganizationRepository } from "@/modules/organization/infra/organization-repository"
import { soCreditHoanMotPhan, type LyDoHoanMotPhan } from "@/modules/usage/domain/refund-policy"
import { UsageRepository } from "@/modules/usage/infra/usage-repository"

/**
 * Hoàn MỘT PHẦN credit của một job — khách nhận kết quả nhưng rẻ hơn thứ đã
 * trả (lý do ở `refund-policy.ts#LyDoHoanMotPhan`).
 *
 * Ghi một dòng `usage` `status = PARTIAL_REFUND` với `cost_credit` ÂM đúng số
 * hoàn, cùng giao dịch với cộng lại `credit_balance`. Số âm là chủ đích:
 * `refundJob` hoàn "tổng `cost_credit` các dòng", nên nếu job về sau thuộc
 * diện hoàn toàn phần thì nó chỉ hoàn phần còn lại — không bao giờ hoàn quá số
 * đã trừ; và tổng chi tiêu theo feature (`summarizeByFeature`) tự trừ đúng.
 *
 * Idempotent theo (job, lý do), chốt trong giao dịch có khoá tư vấn theo job
 * — hai lượt đọc song song không hoàn hai lần.
 */
export async function refundPartial(
  ctx: TenantContext,
  jobId: string,
  lyDo: LyDoHoanMotPhan,
  soCredit: number
): Promise<{ refunded: number }> {
  const job = await new GenerationJobRepository().findById(ctx, jobId)
  if (!job) return { refunded: 0 }

  return runInTransaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`refund:${jobId}`}))`
    const usageRepo = new UsageRepository(tx)
    const dong = await usageRepo.listByJob(ctx, jobId)
    const hoan = soCreditHoanMotPhan(dong, lyDo, soCredit)
    if (hoan <= 0) return { refunded: 0 }
    await usageRepo.record(ctx, {
      workspaceId: job.workspace_id,
      userId: job.user_id,
      jobId,
      feature: job.feature,
      costCredit: -hoan,
      status: "PARTIAL_REFUND",
      metadata: { reason: lyDo },
    })
    await new OrganizationRepository(tx).refundCredit(ctx, hoan)
    return { refunded: hoan }
  })
}
