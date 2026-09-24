import { randomUUID } from "node:crypto"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { POST as postAudioJob } from "@/app/api/v1/audio/jobs/route"
import { DELETE as deleteTrack } from "@/app/api/v1/audio/music-tracks/[id]/route"
import { GET as listTracks, POST as uploadTrack } from "@/app/api/v1/audio/music-tracks/route"
import { GET as getClone } from "@/app/api/v1/audio/voice-clones/[id]/route"
import { GET as listClones } from "@/app/api/v1/audio/voice-clones/route"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, readJson, type Tenant } from "../helpers/fixtures"

// Khu vực C (24/09/2026): nhạc tiệm tự tải (`music_tracks`) và giọng nhân bản
// (`voice_clones`) là dữ liệu TENANT — tổ chức khác không thấy, không dùng được.

const BASE = "http://localhost/api/v1/audio"

function req(url: string, t: Tenant, init?: RequestInit): Request {
  const headers = new Headers(init?.headers)
  headers.set("cookie", `floraos_session=${encodeURIComponent(t.token)}`)
  return new Request(url, { ...init, headers })
}

function fakeMp3(): Blob {
  const bytes = new Uint8Array(4096)
  bytes.set([0x49, 0x44, 0x33]) // "ID3"
  return new Blob([bytes], { type: "audio/mpeg" })
}

async function upload(t: Tenant) {
  const form = new FormData()
  form.set("file", fakeMp3(), "bai.mp3")
  form.set("title", "Nhạc riêng của tiệm")
  form.set("mood", "romantic")
  form.set("license_type", "licensed")
  form.set("license_source", "Epidemic Sound — giấy phép số 123")
  form.set("attest", "true")
  return uploadTrack(req(`${BASE}/music-tracks`, t, { method: "POST", body: form }))
}

describe("cách ly tenant — thư viện âm thanh Khu vực C", () => {
  let a: Tenant
  let b: Tenant

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
    b = await createTenant("beta")
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it("nhạc tiệm A tải lên: A thấy, B không thấy / không xoá / không dùng được", async () => {
    const res = await upload(a)
    expect(res.status).toBe(201)
    const { track } = (await readJson(res)) as { track: { track_id: string } }
    expect(track.track_id.startsWith("org:")).toBe(true)

    const mine = (await readJson(await listTracks(req(`${BASE}/music-tracks`, a)))) as { tracks: Array<{ track_id: string }> }
    expect(mine.tracks.some((x) => x.track_id === track.track_id)).toBe(true)
    const theirs = (await readJson(await listTracks(req(`${BASE}/music-tracks`, b)))) as { tracks: Array<{ track_id: string }> }
    expect(theirs.tracks.some((x) => x.track_id === track.track_id)).toBe(false)

    const del = await deleteTrack(req(`${BASE}/music-tracks/${track.track_id}`, b, { method: "DELETE" }), {
      params: Promise.resolve({ id: track.track_id }),
    })
    expect(del.status).toBe(404)

    const job = await postAudioJob(
      req(`${BASE}/jobs`, b, {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": randomUUID() },
        body: JSON.stringify({ taskType: "MUSIC_SELECT", scenes: [], totalDurationSeconds: 10, musicTrackId: track.track_id }),
      })
    )
    expect(job.status).toBe(422)
  })

  it("thiếu cam kết giấy phép thì không nhận tệp", async () => {
    const form = new FormData()
    form.set("file", fakeMp3(), "bai.mp3")
    form.set("title", "Bài")
    form.set("mood", "romantic")
    form.set("license_type", "licensed")
    form.set("license_source", "abc")
    const res = await uploadTrack(req(`${BASE}/music-tracks`, a, { method: "POST", body: form }))
    expect(res.status).toBe(422)
  })

  it("giọng nhân bản của A: B không đọc được, không dùng được", async () => {
    const id = randomUUID()
    await prisma.voice_clones.create({
      data: {
        id,
        organization_id: a.ctx.organizationId,
        name: "Chị Lan",
        status: "READY",
        provider_voice_id: "V".repeat(20),
        sample_storage_key: `org/${a.ctx.organizationId}/audio/voice-samples/${id}.mp3`,
        sample_mime_type: "audio/mpeg",
        sample_bytes: 100000,
        consent_text: "x",
        consented_by: a.ctx.userId,
        consented_at: new Date(),
      },
    })
    const mine = (await readJson(await listClones(req(`${BASE}/voice-clones`, a)))) as { voice_clones: Array<{ id: string }> }
    expect(mine.voice_clones.map((v) => v.id)).toContain(id)
    const theirs = (await readJson(await listClones(req(`${BASE}/voice-clones`, b)))) as { voice_clones: unknown[] }
    expect(theirs.voice_clones).toHaveLength(0)

    const get = await getClone(req(`${BASE}/voice-clones/${id}`, b), { params: Promise.resolve({ id }) })
    expect(get.status).toBe(404)

    const job = await postAudioJob(
      req(`${BASE}/jobs`, b, {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": randomUUID() },
        body: JSON.stringify({
          taskType: "VOICE_CLONE",
          voiceCloneId: id,
          scenes: [{ sceneIndex: 1, voiceScript: "Xin chào", targetDurationSeconds: 3 }],
        }),
      })
    )
    expect(job.status).toBe(404)
  })
})
