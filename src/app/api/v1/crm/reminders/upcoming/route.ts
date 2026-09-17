/**
 * GET /api/v1/crm/reminders/upcoming
 * Quét các dịp kỷ niệm sắp tới của khách hàng (AI Reminder Scan).
 * Quyền: Q7
 */

import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { scanUpcomingReminders } from "@/modules/crm/use-cases/scan-upcoming-reminders"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "Q7")

  const url = new URL(request.url)
  const daysAhead = url.searchParams.get("days") ? Number(url.searchParams.get("days")) : 14

  const result = await scanUpcomingReminders(ctx, Number.isNaN(daysAhead) ? 14 : daysAhead)
  return jsonResponse(result)
})
