import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { markSendLinkCopied } from "@/modules/greeting-card/use-cases/share-links"

/** POST /api/v1/greeting-card/send-links/[mã gửi]/copied — ghi mốc sao chép đầu tiên của link riêng. */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.manage)
  const { id } = await context.params
  return jsonResponse({ data: await markSendLinkCopied(ctx, decodeURIComponent(id)) })
})
