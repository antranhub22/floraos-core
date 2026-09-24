import { requireCapability } from "@/core/rbac/capabilities"
import { handle } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { readSystemTrack } from "@/modules/audio-studio/use-cases/music-tracks"

/** `GET /api/v1/audio/music-tracks/system/:trackId` (`I1`) — nghe thử bài của thư viện hệ thống. */
export const GET = handle(async (request, context: { params: Promise<{ trackId: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const { trackId } = await context.params
  const { bytes, mime } = await readSystemTrack(ctx, decodeURIComponent(trackId))
  return new Response(bytes as unknown as BodyInit, {
    headers: { "content-type": mime, "content-length": String(bytes.byteLength), "cache-control": "private, max-age=3600" },
  })
})
