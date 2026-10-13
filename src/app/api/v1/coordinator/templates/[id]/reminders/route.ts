import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { PrismaDispatchReminderRepository } from "@/modules/coordinator/infra/prisma-dispatch-reminder-repository"
import {
  getTemplateReminderOverrides,
  updateTemplateReminderOverrides,
} from "@/modules/coordinator/use-cases/manage-template-reminder-settings"

const updateTemplateOverridesSchema = z.object({
  m0MinutesAfterPaid: z.number().int().min(0).max(1440).nullable().optional(),
  m1MinutesBeforeDelivery: z.number().int().min(0).max(1440).nullable().optional(),
  m2MinutesBeforeDelivery: z.number().int().min(0).max(1440).nullable().optional(),
  m3MinutesAfterShipperAssigned: z.number().int().min(0).max(1440).nullable().optional(),
  m5MinutesAfterDelivery: z.number().int().min(0).max(1440).nullable().optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * `GET /api/v1/coordinator/templates/[id]/reminders` (R1)
 * Lấy cấu hình override nhắc việc của một Thẻ chào mẫu hoa.
 */
export const GET = handle(async (request, context: unknown) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R1")

  const { id: productId } = await (context as RouteContext).params
  const repository = new PrismaDispatchReminderRepository()
  const overrides = await getTemplateReminderOverrides(
    ctx.organizationId,
    productId,
    repository
  )

  return jsonResponse({ overrides })
})

/**
 * `PUT /api/v1/coordinator/templates/[id]/reminders` (R3)
 * Cập nhật cấu hình override nhắc việc cho một Thẻ chào mẫu hoa.
 */
export const PUT = handle(async (request, context: unknown) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R3")

  const { id: productId } = await (context as RouteContext).params
  const raw = await request.json().catch(() => null)
  const parsed = updateTemplateOverridesSchema.safeParse(raw)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  // Lọc các giá trị null/undefined thành object hợp lệ
  const sanitizedOverrides = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined && v !== null)
  )

  const repository = new PrismaDispatchReminderRepository()
  const updated = await updateTemplateReminderOverrides(
    ctx.organizationId,
    productId,
    sanitizedOverrides,
    repository
  )

  return jsonResponse({ overrides: updated })
})
