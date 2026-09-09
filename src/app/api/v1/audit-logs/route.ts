import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { listAuditLogs } from "@/modules/audit/use-cases/list-audit-logs"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G9")

  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam === null ? undefined : Number(limitParam)
  if (limit !== undefined && !Number.isInteger(limit)) {
    throw validationFailed({ limit: "Phải là số nguyên" })
  }

  const result = await listAuditLogs(ctx, { limit, cursor: url.searchParams.get("cursor") })
  return jsonResponse(result)
})
