import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, resolveExceptionSchema } from "@/modules/coordinator/adapters/http-schemas"
import { resolveCoordinatorException } from "@/modules/coordinator/use-cases/manage-exceptions"

type Params = { params: Promise<{ id: string }> }

/** `POST /api/v1/coordinator/exceptions/:id/resolve` (R3) — xử lý xong sự cố; hết sự cố thì đơn tự về bước cũ (F13). */
export const POST = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R3")
  const { id } = await context.params
  const body = await parseBody(request, resolveExceptionSchema)
  const order = await resolveCoordinatorException(ctx, id, body)
  return jsonResponse({ order })
})
