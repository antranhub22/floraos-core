import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getOrder } from "@/modules/orders/use-cases/get-order"

/** `GET /api/v1/orders/:id/events` (R1) — Nhật ký đổi trạng thái, nguồn đo SLA */
export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R1")

  const { id } = await context.params

  const { order, sla } = await getOrder(ctx, id)
  return jsonResponse({
    events: order.events ?? [],
    sla,
  })
})
