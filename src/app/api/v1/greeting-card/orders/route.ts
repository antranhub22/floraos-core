import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  const url = new URL(request.url)
  const status = url.searchParams.get("status") || undefined

  const repo = new GreetingCardRepository()
  const orders = await repo.listBrochureOrders(ctx, { status })
  return jsonResponse({ data: orders })
})
