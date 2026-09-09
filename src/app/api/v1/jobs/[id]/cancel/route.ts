import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { cancelJob } from "@/modules/jobs/use-cases/cancel-job"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G6")

  const { id } = await context.params
  return jsonResponse({ job: await cancelJob(ctx, id) })
})
