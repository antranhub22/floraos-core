import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { listRecipients } from "@/modules/greeting-card/use-cases/internal-messages"

/** GET /api/v1/greeting-card/messages/recipients — lựa chọn "Gửi cho" (vai + thành viên). */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  return jsonResponse({ data: await listRecipients(ctx) })
})
