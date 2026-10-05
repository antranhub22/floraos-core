import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { BrochureOrderRepository, ORDER_STATUSES } from "@/modules/greeting-card/infra/brochure-order-repository"
import { parseListQuery, toPage } from "@/modules/greeting-card/contracts/list-query"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const url = new URL(request.url)
  const statusParam = url.searchParams.get("status") || undefined
  const status = ORDER_STATUSES.find((s) => s === statusParam)
  if (statusParam && !status) throw validationFailed({ status: `Phải là một trong: ${ORDER_STATUSES.join(", ")}` })

  const { limit, cursor } = parseListQuery(url)

  const repo = new BrochureOrderRepository()
  const rows = await repo.listBrochureOrders(ctx, { status, limit, cursor })
  return jsonResponse(toPage(rows, limit))
})
