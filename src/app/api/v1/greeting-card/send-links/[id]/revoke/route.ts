import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { revokeSendLink } from "@/modules/greeting-card/use-cases/create-send-link"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

/** POST /api/v1/greeting-card/send-links/[id]/revoke — thu hồi link chưa có đơn. */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.manage)
  const { id } = await context.params
  return jsonResponse({ data: await revokeSendLink(ctx, id) })
})
