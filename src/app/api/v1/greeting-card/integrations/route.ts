import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getIntegrationStatus } from "@/modules/greeting-card/use-cases/integration-status"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

/** GET /api/v1/greeting-card/integrations — trạng thái tích hợp (không bao giờ trả khoá/bí mật). */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  return jsonResponse({ data: await getIntegrationStatus(ctx) })
})
