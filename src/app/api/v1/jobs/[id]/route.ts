import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { getJob } from "@/modules/jobs/use-cases/get-job"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G4")

  const { id } = await context.params
  return jsonResponse({ job: await getJob(ctx, id) })
})
