import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { getOptimization } from "@/modules/media/use-cases/get-optimization"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

/** `GET /media/optimizations/:id` (`I1`, đặc tả 06 mục 8). `:id` là `job_id`. */
export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")

  const { id } = await context.params
  return jsonResponse(await getOptimization(ctx, id))
})
