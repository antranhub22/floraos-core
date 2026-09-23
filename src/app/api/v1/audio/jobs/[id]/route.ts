import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { getAudioJob } from "@/modules/audio-studio/use-cases/get-audio-job"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

/** `GET /api/v1/audio/jobs/:id` (`I1`) — trạng thái và URL bản phối âm thanh. */
export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const { id } = await context.params
  return jsonResponse(await getAudioJob(ctx, id))
})
