import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, deliveryUpdateSchema } from "@/modules/coordinator/adapters/http-schemas"
import { recordDeliveryUpdate } from "@/modules/coordinator/use-cases/operations"

type Params = { params: Promise<{ id: string }> }

/** `POST /api/v1/coordinator/orders/:id/delivery` (R5) — theo dõi giao hàng và POD (F11/F12). */
export const POST = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R5")
  const { id } = await context.params
  const body = await parseBody(request, deliveryUpdateSchema)
  const order = await recordDeliveryUpdate(ctx, id, body)
  return jsonResponse({ order })
})
