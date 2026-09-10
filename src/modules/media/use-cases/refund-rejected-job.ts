import type { TenantContext } from "@/core/tenancy"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { runInTransaction } from "@/modules/jobs/infra/transaction"
import { isGuardResult, canApproveOptimization } from "@/modules/media/domain/optimization-rules"
import { OrganizationRepository } from "@/modules/organization/infra/organization-repository"
import { UsageRepository } from "@/modules/usage/infra/usage-repository"

export type RefundOutcome =
  | { refunded: false; reason: "khong-phai-job-bi-tu-choi" | "da-hoan-truoc-do" | "khong-co-gi-de-hoan" }
  | { refunded: true; creditHoanLai: number }

/**
 * Quyết định D3 — **job bị Identity Guard từ chối không tính phí khách**
 * (đặc tả 07 mục 7, "Job bị Identity Guard từ chối").
 *
 * Ghi một dòng `usage` mới `status = REFUNDED` với `cost_credit = 0` (không
 * trừ thêm) và hoàn lại đúng số credit đã trừ lúc enqueue vào
 * `organizations.credit_balance` — hai việc trong MỘT giao dịch. Dòng
 * `ENQUEUED` cũ giữ nguyên: nó là lịch sử, không phải trạng thái.
 *
 * Lý do của D3, chép lại vì nó dễ bị đảo ngược khi ai đó "tối ưu" sau này:
 * GPU đã tiêu thụ nên chi phí phía nền tảng là thật và phải vào sổ để đối
 * soát; nhưng khách không dùng được kết quả, nên trừ credit của họ là bán
 * một thứ không giao.
 *
 * **Vì sao không nằm trong worker:** `YC-U4` — worker không bao giờ ghi
 * `usage`. Hạn mức và credit là việc của core. Hệ quả là hoàn credit không
 * xảy ra ngay lúc worker ra phán quyết mà ở lần chạy `npm run hoan-credit`
 * kế tiếp (hoặc lần đọc `GET /media/optimizations/:id` kế tiếp) — nhất quán
 * sau một khoảng, không tức thì.
 *
 * Idempotent: gọi lại không hoàn hai lần. Chốt là sự tồn tại của một dòng
 * `REFUNDED` cho chính `job_id` đó.
 */
export async function refundRejectedJob(
  ctx: TenantContext,
  jobId: string
): Promise<RefundOutcome> {
  const job = await new GenerationJobRepository().findById(ctx, jobId)
  if (!job || job.status !== "COMPLETED") {
    return { refunded: false, reason: "khong-phai-job-bi-tu-choi" }
  }
  if (!isGuardResult(job.result) || canApproveOptimization(job.result)) {
    return { refunded: false, reason: "khong-phai-job-bi-tu-choi" }
  }

  const usageRepo = new UsageRepository()
  const dong = await usageRepo.listByJob(ctx, jobId)
  if (dong.some((d) => d.status === "REFUNDED")) {
    return { refunded: false, reason: "da-hoan-truoc-do" }
  }

  const daTru = dong.reduce((tong, d) => tong + d.cost_credit, 0)
  if (daTru <= 0) {
    // Workspace trải nghiệm đi đường hạn mức TRIAL, không trừ credit — không
    // có gì để hoàn, và ghi một dòng REFUNDED rỗng chỉ làm bẩn sổ.
    return { refunded: false, reason: "khong-co-gi-de-hoan" }
  }

  const costUsd = dong.reduce<number | null>(
    (tong, d) => (d.cost_usd === null ? tong : (tong ?? 0) + d.cost_usd),
    null
  )

  await runInTransaction(async (tx) => {
    await new UsageRepository(tx).recordRefund(ctx, {
      workspaceId: job.workspace_id,
      userId: job.user_id,
      jobId,
      feature: job.feature,
      costUsd,
    })
    await new OrganizationRepository(tx).refundCredit(ctx, daTru)
  })

  return { refunded: true, creditHoanLai: daTru }
}
