import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { PrismaDispatchReminderRepository } from "@/modules/coordinator/infra/prisma-dispatch-reminder-repository"
import { getCoordinatorReminders } from "@/modules/coordinator/use-cases/get-coordinator-reminders"

/**
 * `GET /api/v1/coordinator/reminders` (R1)
 * Lấy danh sách các thông báo nhắc việc đang active (M0..M5) của các đơn hàng.
 */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R1")

  const repository = new PrismaDispatchReminderRepository()
  const result = await getCoordinatorReminders(ctx.organizationId, repository)

  return jsonResponse(result)
})
