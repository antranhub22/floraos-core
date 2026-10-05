import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { disablePaymentWebhook, rotatePaymentWebhookKey } from "@/modules/greeting-card/use-cases/payment-webhook"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

/** POST — sinh khoá webhook SePay mới (trả khoá MỘT lần; khoá cũ hết hiệu lực). */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.integrationManage)
  return jsonResponse({ data: await rotatePaymentWebhookKey(ctx) }, { status: 201 })
})

/** DELETE — tắt đối soát tự động. */
export const DELETE = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.integrationManage)
  return jsonResponse({ data: await disablePaymentWebhook(ctx) })
})
