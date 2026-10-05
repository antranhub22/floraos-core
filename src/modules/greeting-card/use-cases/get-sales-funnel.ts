import type { TenantContext } from "@/core/tenancy"
import { GreetingStatsRepository } from "../infra/greeting-stats-repository"
import { buildSalesFunnel } from "../domain/sales-funnel"

export const FUNNEL_PERIODS = [7, 30, 90] as const

/** Phễu chuyển đổi theo sale trong `days` ngày gần nhất. */
export async function getSalesFunnel(ctx: TenantContext, days: number, repo = new GreetingStatsRepository()) {
  const since = new Date(Date.now() - days * 86_400_000)
  const counts = await repo.countFunnelBySale(ctx, since)
  const names = await repo.memberNames(ctx, counts.map((c) => c.saleId))
  return { days, ...buildSalesFunnel(counts, names) }
}
