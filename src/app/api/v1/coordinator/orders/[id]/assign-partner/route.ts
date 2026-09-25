import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, assignPartnerSchema } from "@/modules/coordinator/adapters/http-schemas"
import { assignPartner } from "@/modules/coordinator/use-cases/operations"

type Params = { params: Promise<{ id: string }> }

/** `POST /api/v1/coordinator/orders/:id/assign-partner` (R4) — phân công đối tác xưởng (F05). */
export const POST = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R4")
  const { id } = await context.params
  const body = await parseBody(request, assignPartnerSchema)
  const order = await assignPartner(ctx, id, body)
  return jsonResponse({ order })
})
