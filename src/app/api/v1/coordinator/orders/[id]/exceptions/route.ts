import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, openExceptionSchema } from "@/modules/coordinator/adapters/http-schemas"
import { openCoordinatorException } from "@/modules/coordinator/use-cases/manage-exceptions"

type Params = { params: Promise<{ id: string }> }

/** `POST /api/v1/coordinator/orders/:id/exceptions` (R3) — mở sự cố (F13). */
export const POST = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R3")
  const { id } = await context.params
  const body = await parseBody(request, openExceptionSchema)
  const order = await openCoordinatorException(ctx, id, body)
  return jsonResponse({ order }, { status: 201 })
})
