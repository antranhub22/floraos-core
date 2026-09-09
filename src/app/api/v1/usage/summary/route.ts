import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getUsageSummary } from "@/modules/usage/use-cases/get-usage-summary"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G8")
  return jsonResponse(await getUsageSummary(ctx))
})
