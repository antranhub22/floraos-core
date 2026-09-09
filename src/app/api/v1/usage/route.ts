import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { listUsage } from "@/modules/usage/use-cases/list-usage"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G8")

  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam === null ? undefined : Number(limitParam)
  if (limit !== undefined && !Number.isInteger(limit)) {
    throw validationFailed({ limit: "Phải là số nguyên" })
  }

  const result = await listUsage(ctx, { limit, cursor: url.searchParams.get("cursor") })
  return jsonResponse(result)
})
