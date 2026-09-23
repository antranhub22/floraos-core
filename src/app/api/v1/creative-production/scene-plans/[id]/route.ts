import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getScenePlan } from "@/modules/creative-production/use-cases/generate-scene-plan"

/** `GET /api/v1/creative-production/scene-plans/:id` (`I1`). */
export const GET = handle(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const { id } = await params
  const found = await getScenePlan(ctx, id)
  return jsonResponse({ job_id: found.jobId, status: found.status, error: found.error, plan: found.plan })
})
