import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, cancelOrderSchema } from "@/modules/coordinator/adapters/http-schemas"
import { cancelCoordinatorOrder } from "@/modules/coordinator/use-cases/operations"

type Params = { params: Promise<{ id: string }> }

/** `POST /api/v1/coordinator/orders/:id/cancel` (R6, trần cứng điều hành) — huỷ đơn, bắt buộc lý do. */
export const POST = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R6")
  const { id } = await context.params
  const body = await parseBody(request, cancelOrderSchema)
  const order = await cancelCoordinatorOrder(ctx, id, body)
  return jsonResponse({ order })
})
