import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getCampaignPerformance } from "@/modules/creative-production/use-cases/get-campaign-performance"

/**
 * `GET /api/v1/creative-production/packages/:id/performance` (`R1` order.read) —
 * Chặng 11–14 tính trên dữ liệu thật của tổ chức; chưa đủ dữ liệu thì nói rõ.
 */
export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R1")
  const { id } = await context.params
  return jsonResponse(await getCampaignPerformance(ctx, id))
})
