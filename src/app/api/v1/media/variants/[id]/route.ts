import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { getVariantJob } from "@/modules/media/use-cases/get-variant-job"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

/** `GET /media/variants/:id` (`I4`) — `:id` là `job_id`. */
export const GET = handle(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { ctx } = await requireTenantContext(request)
    requireCapability(ctx, "I4")
    const { id } = await params
    return jsonResponse(await getVariantJob(ctx, id))
  }
)
