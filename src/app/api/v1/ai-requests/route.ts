import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { listAiRequests } from "@/modules/ai-governance/use-cases/list-ai-requests"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

import { readFilter } from "./filter"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "U3")
  return jsonResponse(await listAiRequests(ctx, readFilter(request.url)))
})
