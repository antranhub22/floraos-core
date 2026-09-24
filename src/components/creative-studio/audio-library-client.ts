/**
 * Gọi API thư viện âm thanh Khu vực C (24/09/2026): nhạc nền (hệ thống + tiệm
 * tự tải) và giọng nhân bản. Chỉ fetch — không giữ trạng thái.
 */

export interface MusicTrackItem {
  track_id: string
  title: string
  mood: string
  duration_seconds: number | null
  source: "system" | "org"
  license_type: string
  license_source: string
  license_verified: boolean
  preview_url: string
}

export interface VoiceCloneItem {
  id: string
  name: string
  status: "PENDING" | "READY" | "FAILED" | "DELETED"
  provider: string
  error: string | null
  job_id: string | null
  sample_url: string | null
  created_at: string
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string; details?: Record<string, unknown> }
  }
  const details = body.error?.details
  if (details && typeof details === "object") {
    const first = Object.values(details).find((v) => typeof v === "string")
    if (typeof first === "string") return first
  }
  return body.error?.message ?? `Lỗi ${res.status}`
}

export async function fetchMusicTracks(): Promise<MusicTrackItem[]> {
  const res = await fetch("/api/v1/audio/music-tracks")
  if (!res.ok) throw new Error(await readError(res))
  return ((await res.json()) as { tracks: MusicTrackItem[] }).tracks
}

export async function uploadMusicTrack(input: {
  file: File
  title: string
  mood: string
  licenseType: string
  licenseSource: string
  licenseNote?: string
  attest: boolean
}): Promise<MusicTrackItem> {
  const form = new FormData()
  form.set("file", input.file)
  form.set("title", input.title)
  form.set("mood", input.mood)
  form.set("license_type", input.licenseType)
  form.set("license_source", input.licenseSource)
  if (input.licenseNote) form.set("license_note", input.licenseNote)
  form.set("attest", input.attest ? "true" : "false")
  const res = await fetch("/api/v1/audio/music-tracks", { method: "POST", body: form })
  if (!res.ok) throw new Error(await readError(res))
  return ((await res.json()) as { track: MusicTrackItem }).track
}

export async function removeMusicTrack(trackId: string): Promise<void> {
  const res = await fetch(`/api/v1/audio/music-tracks/${encodeURIComponent(trackId)}`, { method: "DELETE" })
  if (!res.ok) throw new Error(await readError(res))
}

export async function fetchVoiceClones(): Promise<VoiceCloneItem[]> {
  const res = await fetch("/api/v1/audio/voice-clones")
  if (!res.ok) throw new Error(await readError(res))
  return ((await res.json()) as { voice_clones: VoiceCloneItem[] }).voice_clones
}

export async function createVoiceClone(input: { name: string; sample: File; consent: boolean }) {
  const form = new FormData()
  form.set("name", input.name)
  form.set("sample", input.sample)
  form.set("consent", input.consent ? "true" : "false")
  const res = await fetch("/api/v1/audio/voice-clones", {
    method: "POST",
    headers: { "idempotency-key": `voice-clone-${crypto.randomUUID()}` },
    body: form,
  })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as { voice_clone: VoiceCloneItem | null; usage: { costCredit: number } }
}

export async function removeVoiceClone(id: string): Promise<void> {
  const res = await fetch(`/api/v1/audio/voice-clones/${encodeURIComponent(id)}`, { method: "DELETE" })
  if (!res.ok) throw new Error(await readError(res))
}

export { readError as readAudioApiError }
