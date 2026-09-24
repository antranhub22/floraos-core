import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { deleteMusicTrack } from "@/modules/audio-studio/use-cases/music-tracks"

/** `DELETE /api/v1/audio/music-tracks/:id` (`I1`) — gỡ bài tiệm đã tải (`org:<uuid>` hoặc `<uuid>`). */
export const DELETE = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const { id } = await context.params
  await deleteMusicTrack(ctx, decodeURIComponent(id))
  return jsonResponse({ ok: true })
})
