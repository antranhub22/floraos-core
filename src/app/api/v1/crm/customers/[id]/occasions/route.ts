/**
 * POST /api/v1/crm/customers/[id]/occasions
 * Thêm dịp kỷ niệm mới cho khách hàng.
 * Quyền: Q5
 */

import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { addCustomerOccasion } from "@/modules/crm/use-cases/add-customer-occasion"

export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "Q5")

  const { id } = await context.params
  const body = await request.json()
  const occasion = await addCustomerOccasion(ctx, id, {
    name: body.name,
    date: body.date,
    isRecurring: body.isRecurring,
    reminderDaysBefore: body.reminderDaysBefore,
    recipientName: body.recipientName,
    notes: body.notes,
  })

  return jsonResponse({ occasion }, { status: 201 })
})
