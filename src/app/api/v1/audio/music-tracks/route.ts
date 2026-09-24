import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { listMusicTracks, uploadMusicTrack } from "@/modules/audio-studio/use-cases/music-tracks"

/** `GET /api/v1/audio/music-tracks` (`I1`) — thư viện nhạc: bài tiệm tải + bài hệ thống, kèm giấy phép (24/09/2026). */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  return jsonResponse({ tracks: await listMusicTracks(ctx) })
})

/**
 * `POST /api/v1/audio/music-tracks` (`I1`, multipart) — tiệm tải nhạc riêng:
 * `file` (MP3/WAV/M4A ≤ 20MB), `title`, `mood`, `license_type`,
 * `license_source`, `license_note?`, `attest=true`.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const form = await request.formData().catch(() => null)
  if (!form) throw validationFailed({ body: "Cần multipart/form-data" })
  const file = form.get("file")
  if (!(file instanceof Blob)) throw validationFailed({ file: "Thiếu tệp nhạc" })
  const track = await uploadMusicTrack(ctx, {
    title: String(form.get("title") ?? ""),
    mood: String(form.get("mood") ?? ""),
    licenseType: String(form.get("license_type") ?? ""),
    licenseSource: String(form.get("license_source") ?? ""),
    licenseNote: form.get("license_note") ? String(form.get("license_note")) : null,
    attest: String(form.get("attest") ?? "") === "true",
    file: new Uint8Array(await file.arrayBuffer()),
  })
  return jsonResponse({ track }, { status: 201 })
})
