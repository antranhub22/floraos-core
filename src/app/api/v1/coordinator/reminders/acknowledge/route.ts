import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { PrismaDispatchReminderRepository } from "@/modules/coordinator/infra/prisma-dispatch-reminder-repository"
import { acknowledgeCoordinatorReminder } from "@/modules/coordinator/use-cases/acknowledge-coordinator-reminder"

const acknowledgeSchema = z.object({
  orderId: z.string().min(1, "orderId không được để trống"),
  milestone: z.enum(["M0", "M1", "M2", "M3", "M4", "M5"]),
  action: z.enum(["ACKNOWLEDGED", "SNOOZED", "DISMISSED"]),
  snoozeMinutes: z.number().int().min(1).max(120).optional(),
  note: z.string().max(500).optional(),
})

/**
 * `POST /api/v1/coordinator/reminders/acknowledge` (R3)
 * Điều phối viên xác nhận hoàn tất, hẹn lại hoặc bỏ qua mốc nhắc việc.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R3")

  const raw = await request.json().catch(() => null)
  const parsed = acknowledgeSchema.safeParse(raw)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  const repository = new PrismaDispatchReminderRepository()
  const result = await acknowledgeCoordinatorReminder(
    {
      organizationId: ctx.organizationId,
      orderId: parsed.data.orderId,
      milestone: parsed.data.milestone,
      action: parsed.data.action,
      actorId: ctx.userId,
      snoozeMinutes: parsed.data.snoozeMinutes,
      note: parsed.data.note,
    },
    repository
  )

  return jsonResponse(result)
})
