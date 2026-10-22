import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { markCustomerNotified } from "@/modules/greeting-card/use-cases/inbox-follow-ups"

/**
 * `POST /api/v1/greeting-card/orders/:id/customer-notified`
 * Sale (R2) xác nhận đã báo khách đơn bị huỷ — đóng việc "Báo khách" trong Hộp việc.
 * Đơn tổ chức khác hoặc ngoài phạm vi xem của Sale → 404; đã xác nhận rồi → 409.
 */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.manage)
  const { id } = await context.params
  return jsonResponse({ data: await markCustomerNotified(ctx, id) })
})

export const dynamic = "force-dynamic"
