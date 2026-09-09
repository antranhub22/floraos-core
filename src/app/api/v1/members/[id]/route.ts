import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { removeMember } from "@/modules/organization/use-cases/remove-member"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

export const DELETE = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F4")

  const { id } = await context.params
  await removeMember(ctx, id)
  return jsonResponse(null, { status: 204 })
})
