import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { runCampaignQa } from "@/modules/creative-production/use-cases/manage-campaign-package"

/**
 * `POST /api/v1/creative-production/packages/:id/qa` (`I1`) — Chặng 08: chạy
 * năm trục kiểm định trên dữ liệu thật phía máy chủ (`evaluateCampaignQa`).
 */
export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const { id } = await context.params
  return jsonResponse(await runCampaignQa(ctx, id))
})
