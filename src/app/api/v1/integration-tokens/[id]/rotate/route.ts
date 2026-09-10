import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { rotateIntegrationToken } from "@/modules/integration/use-cases/rotate-integration-token"

/**
 * `POST /integration-tokens/:id/rotate` (`F9`) — cấp token mới, KHÔNG thu
 * hồi token cũ (đặc tả 08 mục 3: hai token cùng lúc trong thời gian xoay).
 * Thu hồi token cũ là một lời gọi riêng: `DELETE /integration-tokens/:id`.
 */
export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F9")

  const { id } = await context.params
  const result = await rotateIntegrationToken(ctx, id)
  return jsonResponse(result, { status: 201 })
})
