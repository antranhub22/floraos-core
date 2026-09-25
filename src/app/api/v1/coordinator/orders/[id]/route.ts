import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getCoordinatorOrder } from "@/modules/coordinator/use-cases/get-coordinator-order"

type Params = { params: Promise<{ id: string }> }

/** `GET /api/v1/coordinator/orders/:id` (R1) — chi tiết đơn điều phối (F04). Tổ chức khác → 404. */
export const GET = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R1")
  const { id } = await context.params
  return jsonResponse({ order: await getCoordinatorOrder(ctx, id) })
})
