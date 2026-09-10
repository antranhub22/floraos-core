import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { revokeIntegrationToken } from "@/modules/integration/use-cases/revoke-integration-token"

/** `DELETE /integration-tokens/:id` (`F9`) — thu hồi ngay, không xoá bản ghi. */
export const DELETE = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F9")

  const { id } = await context.params
  await revokeIntegrationToken(ctx, id)
  return jsonResponse({ ok: true })
})
