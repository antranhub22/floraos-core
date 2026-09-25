import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, closeOrderSchema } from "@/modules/coordinator/adapters/http-schemas"
import { closeCoordinatorOrder } from "@/modules/coordinator/use-cases/operations"

type Params = { params: Promise<{ id: string }> }

/** `POST /api/v1/coordinator/orders/:id/close` (R3) — nghiệm thu, chốt tiền công đối tác, đóng đơn (F14). */
export const POST = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R3")
  const { id } = await context.params
  const body = await parseBody(request, closeOrderSchema)
  const order = await closeCoordinatorOrder(ctx, id, body)
  return jsonResponse({ order })
})
