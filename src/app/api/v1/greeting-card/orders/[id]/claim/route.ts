import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { claimOrder } from "@/modules/greeting-card/use-cases/inbox-follow-ups"

/**
 * `POST /api/v1/greeting-card/orders/:id/claim`
 * Sale (R2) nhận đơn chưa có Sale phụ trách: ghi mình vào link của đơn. Đơn tổ chức khác → 404;
 * đã có Sale khác nhận → 409. Sale "chỉ khách của mình" vẫn nhận được đơn chưa thuộc ai.
 */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.manage)
  const { id } = await context.params
  return jsonResponse({ data: await claimOrder(ctx, id) })
})

export const dynamic = "force-dynamic"
