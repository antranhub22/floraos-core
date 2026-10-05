import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { FUNNEL_PERIODS } from "@/modules/greeting-card/use-cases/get-sales-funnel"
import { getChannelFunnel } from "@/modules/greeting-card/use-cases/catalog-channel-events"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

/** GET /api/v1/greeting-card/stats/channels?days=30 — phễu link bộ sưu tập theo kênh chia sẻ. */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const raw = new URL(request.url).searchParams.get("days") ?? "30"
  const days = FUNNEL_PERIODS.find((d) => String(d) === raw)
  if (!days) throw validationFailed({ days: `Phải là một trong: ${FUNNEL_PERIODS.join(", ")}` })
  return jsonResponse({ data: await getChannelFunnel(ctx, days) })
})
