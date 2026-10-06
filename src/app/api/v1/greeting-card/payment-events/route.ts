import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { listPaymentEvents } from "@/modules/greeting-card/use-cases/payment-webhook"
import { parseListQuery, toPage } from "@/modules/greeting-card/contracts/list-query"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

const STATUSES = ["RECEIVED", "MATCHED", "UNMATCHED", "IGNORED"] as const

/** GET /api/v1/greeting-card/payment-events?status=UNMATCHED — giao dịch ngân hàng nhận qua webhook. */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.paymentRecord)
  const url = new URL(request.url)
  const raw = url.searchParams.get("status") || undefined
  const status = STATUSES.find((s) => s === raw)
  if (raw && !status) throw validationFailed({ status: `Phải là một trong: ${STATUSES.join(", ")}` })
  const { limit, cursor } = parseListQuery(url)
  const rows = await listPaymentEvents(ctx, { status, limit, cursor })
  return jsonResponse(toPage(rows, limit))
})
