import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { deleteVoiceClone, getVoiceClone } from "@/modules/audio-studio/use-cases/voice-clones"

/** `GET /api/v1/audio/voice-clones/:id` (`I1`) — trạng thái + URL nghe mẫu (ký 1 giờ). */
export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const { id } = await context.params
  return jsonResponse({ voice_clone: await getVoiceClone(ctx, id) })
})

/** `DELETE /api/v1/audio/voice-clones/:id` (`I1`) — gỡ giọng trên ElevenLabs và đánh dấu `DELETED`. */
export const DELETE = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const { id } = await context.params
  return jsonResponse(await deleteVoiceClone(ctx, id))
})
