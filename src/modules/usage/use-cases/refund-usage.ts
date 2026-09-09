import type { TenantContext } from "@/core/tenancy"
import { OrganizationRepository } from "@/modules/organization/infra/organization-repository"
import { UsageRepository } from "@/modules/usage/infra/usage-repository"
import type { DbClient } from "@/modules/usage/infra/db-client"

/**
 * Job bị Identity Guard từ chối (`result = REJECTED`) — quyết định D3
 * (đặc tả 07 mục 7): không tính phí khách, hoàn credit đã trừ lúc enqueue,
 * `cost_usd` thật vẫn vào sổ vì GPU đã tiêu thụ. Chưa có nơi gọi trong P3
 * (M04a Identity Guard là P9) — dựng sẵn để module đó gọi trong cùng giao
 * dịch xử lý kết quả job của nó (`db` tuỳ chọn cho đúng lý do đó).
 */
export async function refundUsage(
  ctx: TenantContext,
  input: {
    workspaceId: string
    userId: string
    jobId: string
    feature: string
    creditToRefund: number
    costUsd: number | null
  },
  db?: DbClient
): Promise<void> {
  await new UsageRepository(db).recordRefund(ctx, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    jobId: input.jobId,
    feature: input.feature,
    costUsd: input.costUsd,
  })
  await new OrganizationRepository(db).refundCredit(ctx, input.creditToRefund)
}
