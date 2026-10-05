import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { FUNNEL_PERIODS, getSalesFunnel } from "@/modules/greeting-card/use-cases/get-sales-funnel"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

/** GET /api/v1/greeting-card/stats?days=30 — phễu chuyển đổi theo sale. */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const raw = new URL(request.url).searchParams.get("days") ?? "30"
  const days = FUNNEL_PERIODS.find((d) => String(d) === raw)
  if (!days) throw validationFailed({ days: `Phải là một trong: ${FUNNEL_PERIODS.join(", ")}` })
  return jsonResponse({ data: await getSalesFunnel(ctx, days) })
})
