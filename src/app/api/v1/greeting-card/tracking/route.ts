import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { parseTrackingQuery } from "@/modules/greeting-card/contracts/tracking-query"
import { queryTracking } from "@/modules/greeting-card/use-cases/query-tracking"

/**
 * GET /api/v1/greeting-card/tracking?view=kanban|list|calendar|queue|dashboard&… — mọi view
 * "Theo dõi tiến độ" trên cùng một tập dữ liệu, cùng bộ lọc, cùng phạm vi xem (R1).
 */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  return jsonResponse({ data: await queryTracking(ctx, parseTrackingQuery(new URL(request.url))) })
})
