import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { BrochureOrderRepository, ORDER_STATUSES } from "@/modules/greeting-card/infra/brochure-order-repository"
import { parseListQuery, toPage } from "@/modules/greeting-card/contracts/list-query"
import { resolveSaleScope } from "@/modules/greeting-card/use-cases/order-scope"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const url = new URL(request.url)
  const statusParam = url.searchParams.get("status") || undefined
  const status = ORDER_STATUSES.find((s) => s === statusParam)
  if (statusParam && !status) throw validationFailed({ status: `Phải là một trong: ${ORDER_STATUSES.join(", ")}` })

  const paymentParam = url.searchParams.get("payment") || undefined
  const payment = (["OUTSTANDING", "PAID"] as const).find((p) => p === paymentParam)
  if (paymentParam && !payment) throw validationFailed({ payment: "Phải là OUTSTANDING hoặc PAID" })
  const { limit, cursor } = parseListQuery(url)
  const q = url.searchParams.get("q")?.trim().slice(0, 40) || undefined
  const reported = url.searchParams.get("reported") === "1"

  const repo = new BrochureOrderRepository()
  const saleId = (await resolveSaleScope(ctx)) ?? undefined
  const rows = await repo.listBrochureOrders(ctx, { status, payment, saleId, q, reported, limit, cursor })
  return jsonResponse(toPage(rows, limit))
})
