import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { PrismaDispatchReminderRepository } from "@/modules/coordinator/infra/prisma-dispatch-reminder-repository"
import {
  getReminderPolicyConfig,
  updateReminderPolicyConfig,
} from "@/modules/coordinator/use-cases/manage-reminder-policy"
import type { DispatchReminderPolicyConfig } from "@/modules/coordinator/domain/dispatch-reminder-types"

const updatePolicySchema = z.object({
  m0MinutesAfterPaid: z.number().int().min(0).max(1440).optional(),
  m1MinutesBeforeDelivery: z.number().int().min(0).max(1440).optional(),
  m2MinutesBeforeDelivery: z.number().int().min(0).max(1440).optional(),
  m3MinutesAfterShipperAssigned: z.number().int().min(0).max(1440).optional(),
  m5MinutesAfterDelivery: z.number().int().min(0).max(1440).optional(),
})

/**
 * `GET /api/v1/coordinator/settings/reminders` (D1)
 * Lấy cấu hình chính sách nhắc việc điều phối cấp tổ chức.
 */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "D1")

  const repository = new PrismaDispatchReminderRepository()
  const config = await getReminderPolicyConfig(ctx.organizationId, repository)

  return jsonResponse({ config })
})

/**
 * `PUT /api/v1/coordinator/settings/reminders` (D1)
 * Cập nhật cấu hình chính sách nhắc việc điều phối cấp tổ chức.
 */
export const PUT = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "D1")

  const raw = await request.json().catch(() => null)
  const parsed = updatePolicySchema.safeParse(raw)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  const cleanData: Partial<DispatchReminderPolicyConfig> = {}
  if (parsed.data.m0MinutesAfterPaid !== undefined) {
    cleanData.m0MinutesAfterPaid = parsed.data.m0MinutesAfterPaid
  }
  if (parsed.data.m1MinutesBeforeDelivery !== undefined) {
    cleanData.m1MinutesBeforeDelivery = parsed.data.m1MinutesBeforeDelivery
  }
  if (parsed.data.m2MinutesBeforeDelivery !== undefined) {
    cleanData.m2MinutesBeforeDelivery = parsed.data.m2MinutesBeforeDelivery
  }
  if (parsed.data.m3MinutesAfterShipperAssigned !== undefined) {
    cleanData.m3MinutesAfterShipperAssigned = parsed.data.m3MinutesAfterShipperAssigned
  }
  if (parsed.data.m5MinutesAfterDelivery !== undefined) {
    cleanData.m5MinutesAfterDelivery = parsed.data.m5MinutesAfterDelivery
  }

  const repository = new PrismaDispatchReminderRepository()
  const updated = await updateReminderPolicyConfig(
    ctx.organizationId,
    cleanData,
    repository
  )

  return jsonResponse({ config: updated })
})
