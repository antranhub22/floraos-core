"use client"

/**
 * Sửa tại chỗ ở Chặng 07 (quyết định PO 24/09/2026): người dùng sửa rồi bấm
 * Sửa — hệ thống gọi ĐÚNG backend của khu vực gốc (cùng cổng kiểm, trừ credit,
 * nhật ký), chạy ngầm, người dùng vẫn ở Chặng 07; có kết quả thì hiện ngay và
 * tự thay vào gói.
 */

import { useState } from "react"
import { Loader2, Mic, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { costCreditForFeature } from "@/modules/usage/domain/pricing"
import type { ScenePlanScene } from "@/modules/creative-production/domain/scene-plan-rules"
import type { AudioQualityTier, AudioTaskType, TtsProviderKey } from "@/modules/audio-studio/domain/audio-types"
import { audioJobCreditCost, estimateSpeechSeconds } from "@/modules/audio-studio/domain/audio-task-rules"
import { VideoJobLifecycle, type VideoJobDetail } from "./video-job-lifecycle"
import { describeIntegrity, type M04bIntegrity } from "./types"
import { variantUnitCostCredit } from "@/modules/media/domain/variant-candidates"

async function readError(res: Response): Promise<string> {
  const b = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
  return b.error?.message || `HTTP ${res.status}`
}

async function postJson<T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as T
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ─────────────────────────────────────────────────────────────────────────────
// ẢNH — sửa MỘT cảnh: AI viết lại cảnh theo yêu cầu → sinh lại ảnh cảnh đó
// ─────────────────────────────────────────────────────────────────────────────

type VariantPoll = {
  status: string
  result: string | null
  error: string | null
  subject_integrity: M04bIntegrity | null
  variants: Array<{ asset_id: string; variant_key: string }>
}

export function sceneReviseCredit(scene: ScenePlanScene | null, mode: string): number {
  const cloud = mode === "CREATIVE" && scene?.localBackdrop !== "studio_white"
  // Ảnh cảnh: đúng giá `enqueueJob` trừ — đám mây mặc định là nhà cung cấp trọn gói (25/09/2026).
  return costCreditForFeature("creative.scene_revise") + variantUnitCostCredit(cloud ? "cloud_provider" : "local_studio")
}

/**
 * Hai bước chạy nối tiếp: `POST /creative-production/scene-revisions` (AI sửa cảnh,
 * ghi vào kịch bản) → `POST /media/variants` (sinh ảnh, qua cổng integrity) →
 * chờ job xong. Trả asset ảnh mới.
 */
export async function reviseSceneAndRender(input: {
  instruction: string
  scenePlanRef: string | null
  scene: ScenePlanScene
  mode: "CREATIVE" | "AUTHENTIC"
  topicTitle: string
  productName: string
  colors: string[]
  masterAssetId: string
  ratio: string
  onStage: (s: string) => void
}): Promise<{ scene: ScenePlanScene; assetId: string; revision: number | null }> {
  const planId = input.scenePlanRef && !input.scenePlanRef.startsWith("rule:") ? input.scenePlanRef : null
  input.onStage("AI đang viết lại cảnh...")
  const revised = await postJson<{ scene: ScenePlanScene; scene_plan_revision?: number | null }>(
    "/api/v1/creative-production/scene-revisions",
    {
      instruction: input.instruction,
      scene_plan_id: planId,
      scene_index: input.scene.sceneIndex,
      scene: planId ? null : input.scene,
      mode: input.mode,
      topic_title: input.topicTitle,
      product_name: input.productName,
      colors: input.colors.slice(0, 12),
    },
    `scene-revise-${crypto.randomUUID()}`
  )
  const sc = revised.scene
  const cloud = input.mode === "CREATIVE" && sc.localBackdrop !== "studio_white"
  input.onStage(cloud ? "Stability đang vẽ hậu cảnh mới..." : "Đang dựng ảnh với phông cục bộ...")
  const job = await postJson<{ job_id: string }>(
    "/api/v1/media/variants",
    {
      master_asset_id: input.masterAssetId,
      engine: cloud ? "cloud_provider" : "local_studio",
      preset: sc.localBackdrop,
      ratio: input.ratio,
      watermark: true,
      scene_index: sc.sceneIndex,
      ...(input.scenePlanRef ? { scene_plan_id: input.scenePlanRef } : {}),
      ...(revised.scene_plan_revision ? { scene_plan_revision: revised.scene_plan_revision } : {}),
      ...(cloud ? { scene_prompt: sc.backgroundPrompt } : {}),
    },
    `scene-${input.masterAssetId}-${sc.sceneIndex}-${crypto.randomUUID()}`
  )
  const deadline = Date.now() + 6 * 60 * 1000
  while (Date.now() < deadline) {
    await sleep(2500)
    const res = await fetch(`/api/v1/media/variants/${encodeURIComponent(job.job_id)}`)
    if (!res.ok) continue
    const d = (await res.json()) as VariantPoll
    if (d.status === "FAILED" || d.status === "CANCELLED") throw new Error(d.error || "Worker không dựng được ảnh")
    if (d.status !== "COMPLETED") continue
    if (d.result === "REJECTED") {
      const si = d.subject_integrity
      throw new Error(
        `Cổng Subject Integrity từ chối${si ? ` (${describeIntegrity(si)})` : ""} — không ghi ảnh`
      )
    }
    const v =
      d.variants.find((x) => x.variant_key === "branded") ?? d.variants.find((x) => x.variant_key === "styled")
    if (!v) throw new Error("Job xong nhưng không có ảnh")
    return { scene: sc, assetId: v.asset_id, revision: revised.scene_plan_revision ?? null }
  }
  throw new Error("Quá thời gian chờ worker — kiểm tra npm run worker:media")
}

// ─────────────────────────────────────────────────────────────────────────────
// ÂM THANH — sửa lời thoại / nhạc → phối lại (`audio.generate`)
// ─────────────────────────────────────────────────────────────────────────────

const MOODS = [
  { id: "keep", label: "Giữ nhạc của bản cũ" },
  { id: "none", label: "Không nhạc" },
  { id: "romantic", label: "Lãng mạn" },
  { id: "upbeat", label: "Tươi vui" },
  { id: "chill", label: "Thư giãn" },
  { id: "warm", label: "Ấm áp" },
  { id: "luxury", label: "Sang trọng" },
]

interface OriginalAudioJob {
  task_type: AudioTaskType
  voice_id: string | null
  voice_clone_id: string | null
  provider_key: string | null
  quality_tier: string | null
  music_track_id: string | null
  music_provider_used?: string | null
}

/**
 * Sửa âm thanh tại Chặng 07. 24/09/2026 (rà soát Khu vực C): giữ nguyên giọng
 * (kể cả giọng nhân bản), nhà cung cấp, chất lượng và bài nhạc của bản đang
 * trong gói — trước đây luôn gửi VOICEOVER + OpenAI + giọng mặc định.
 */
export function AudioRevisePanel(props: {
  initialLines: Array<{ sceneIndex: number; voiceScript: string }>
  angleCategory?: string | undefined
  /** Job âm thanh đang trong gói — đọc lại cấu hình để phối lại đúng. */
  audioJobId?: string | null | undefined
  onDone: (audioJobId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState(props.initialLines)
  const [mood, setMood] = useState("keep")
  const [original, setOriginal] = useState<OriginalAudioJob | null>(null)
  const [stage, setStage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openPanel = async () => {
    setOpen(true)
    if (!props.audioJobId || original) return
    const res = await fetch(`/api/v1/audio/jobs/${encodeURIComponent(props.audioJobId)}`).catch(() => null)
    if (res?.ok) setOriginal((await res.json()) as OriginalAudioJob)
  }

  const scenes = lines
    .filter((l) => l.voiceScript.trim())
    .map((l) => ({
      sceneIndex: l.sceneIndex,
      voiceScript: l.voiceScript.trim(),
      targetDurationSeconds: Math.max(3, Math.ceil(estimateSpeechSeconds(l.voiceScript) + 0.5)),
    }))
  const isClone = original?.task_type === "VOICE_CLONE" && Boolean(original.voice_clone_id)
  const keepMusic = mood === "keep" ? original?.music_track_id ?? null : null
  const hasMusic = mood === "keep" ? Boolean(keepMusic) : mood !== "none"
  const taskType: AudioTaskType = isClone ? "VOICE_CLONE" : hasMusic ? "AUDIO_MIX" : "VOICEOVER"
  const providerKey = ((original?.provider_key as TtsProviderKey | null) ?? "openai") as TtsProviderKey
  const qualityTier = ((original?.quality_tier as AudioQualityTier | null) ?? "hd") as AudioQualityTier
  // Nhạc: giữ bài thư viện của bản cũ thì không sinh lại (0 credit); bản cũ là nhạc AI hoặc đổi tâm trạng → sinh mới.
  const musicLibraryOnly = mood === "keep" && Boolean(keepMusic) && !original?.music_provider_used
  const credit = audioJobCreditCost({
    taskType,
    providerKey,
    qualityTier,
    scenes,
    musicProvider: hasMusic && !musicLibraryOnly ? "elevenlabs_music" : null,
    musicSeconds: scenes.reduce((a, s) => a + s.targetDurationSeconds, 0),
  })

  const run = async () => {
    setError(null)
    setStage("Đang gửi yêu cầu phối...")
    try {
      if (scenes.length === 0) throw new Error("Cần ít nhất một câu lời thoại")
      const created = await postJson<{ jobId: string }>(
        "/api/v1/audio/jobs",
        {
          taskType,
          scenes,
          voiceId: isClone ? undefined : original?.voice_id ?? undefined,
          voiceCloneId: isClone ? original?.voice_clone_id ?? undefined : undefined,
          providerKey: isClone ? undefined : providerKey,
          qualityTier,
          ...(mood === "keep"
            ? keepMusic
              ? { musicTrackId: keepMusic }
              : { musicMood: "none" }
            : { musicMood: mood }),
          ...(musicLibraryOnly ? { musicProvider: "library" } : {}),
          topicAngleCategory: props.angleCategory,
        },
        `audio-${crypto.randomUUID()}`
      )
      const deadline = Date.now() + 6 * 60 * 1000
      while (Date.now() < deadline) {
        setStage("Worker đang đọc lời thoại và phối nhạc...")
        await sleep(3000)
        const res = await fetch(`/api/v1/audio/jobs/${encodeURIComponent(created.jobId)}`)
        if (!res.ok) continue
        const j = (await res.json()) as { stage: string; audio_url: string | null; error: string | null; refunded?: boolean }
        if (j.stage === "FAILED") throw new Error((j.error || "Phối âm thanh lỗi") + (j.refunded ? " — đã hoàn credit" : ""))
        if (j.stage === "COMPLETED" && j.audio_url) {
          setStage(null)
          setOpen(false)
          props.onDone(created.jobId)
          return
        }
      }
      throw new Error("Quá thời gian chờ worker âm thanh")
    } catch (e) {
      setStage(null)
      setError(e instanceof Error ? e.message : "Không phối được")
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => void openPanel()}>
        <Mic size={11} /> Sửa âm thanh
      </Button>
    )
  }
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2 text-[12px]">
      <div className="font-bold text-text">
        Sửa lời thoại / nhạc rồi phối lại ({credit === 0 ? "miễn phí" : `${credit} credit`}
        {isClone ? " · giọng nhân bản" : ""})
      </div>
      {lines.map((l, i) => (
        <div key={l.sceneIndex} className="flex gap-2 items-start">
          <span className="w-14 shrink-0 pt-1.5 text-text-muted">Cảnh {l.sceneIndex}</span>
          <textarea
            rows={2}
            value={l.voiceScript}
            disabled={stage !== null}
            onChange={(e) => setLines((prev) => prev.map((x, k) => (k === i ? { ...x, voiceScript: e.target.value } : x)))}
            className="flex-1 rounded border border-border px-2 py-1 text-xs"
          />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-text-muted">Nhạc nền</label>
        <select value={mood} disabled={stage !== null} onChange={(e) => setMood(e.target.value)} className="rounded border border-border px-2 py-1 text-xs">
          {MOODS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <Button size="sm" className="h-7 text-[11px] gap-1" disabled={stage !== null} onClick={() => void run()}>
          {stage ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />} Sửa & phối lại
        </Button>
        <button type="button" className="text-text-muted underline" disabled={stage !== null} onClick={() => setOpen(false)}>
          Đóng
        </button>
      </div>
      {stage && <div className="text-primary">{stage}</div>}
      {error && <div className="text-danger">{error}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO — sửa storyboard → tạo bản sửa → duyệt P3 → render → P4 (tại chỗ)
// ─────────────────────────────────────────────────────────────────────────────

export type EditableVideoScene = {
  sceneIndex: number
  durationSeconds: number
  textOverlay: string
  voiceScript: string
  motionEffect: string
  imageAssetId: string | null
}

const MOTIONS = [
  { id: "ZOOM_IN", label: "Zoom in" },
  { id: "ZOOM_OUT", label: "Zoom out" },
  { id: "PAN_RIGHT", label: "Lia ngang" },
  { id: "PAN_UP", label: "Lia lên" },
  { id: "STATIC", label: "Tĩnh" },
]

const VOICES = [
  { code: "vi-VN-Standard-A", label: "Nữ truyền cảm" },
  { code: "vi-VN-Standard-C", label: "Nữ trẻ trung" },
  { code: "vi-VN-Standard-B", label: "Nam ấm áp" },
  { code: "none", label: "Không lồng tiếng" },
]

export function VideoRevisePanel(props: {
  base: {
    title: string
    format: string
    aspect_ratio: string
    has_subtitle?: boolean
    caption_style?: string
    has_watermark?: boolean
    voice_code?: string | null
    product_id?: string | null
  }
  initialScenes: EditableVideoScene[]
  imageChoices: Array<{ assetId: string; label: string }>
  onReady: (videoJobId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [scenes, setScenes] = useState(props.initialScenes)
  const [voice, setVoice] = useState(props.base.voice_code || "vi-VN-Standard-A")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newJobId, setNewJobId] = useState<string | null>(null)
  const renderCredit = costCreditForFeature("video.render")

  const create = async () => {
    setCreating(true)
    setError(null)
    try {
      if (scenes.some((s) => !s.imageAssetId)) throw new Error("Mỗi cảnh cần một ảnh sản phẩm")
      const created = await postJson<{ id: string }>("/api/v1/video/jobs", {
        productId: props.base.product_id ?? null,
        title: `${props.base.title} (bản sửa)`.slice(0, 200),
        format: props.base.format,
        aspectRatio: props.base.aspect_ratio,
        hasSubtitle: props.base.has_subtitle ?? true,
        captionStyle: props.base.caption_style ?? "MODERN_BADGE",
        hasWatermark: props.base.has_watermark ?? true,
        voiceCode: voice === "none" ? null : voice,
        scenes: scenes.map((s, i) => ({
          sceneIndex: i + 1,
          durationSeconds: s.durationSeconds,
          imageAssetId: s.imageAssetId,
          textOverlay: s.voiceScript || null,
          voiceScript: s.voiceScript || null,
          transitionEffect: "fade",
          motionEffect: s.motionEffect,
        })),
      })
      setNewJobId(created.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được bản sửa")
    } finally {
      setCreating(false)
    }
  }

  const onJob = (j: VideoJobDetail) => {
    if (j.stage === "RENDER_COMPLETED" || j.stage === "APPROVED") props.onReady(j.id)
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1" onClick={() => setOpen(true)}>
        <Wand2 size={11} /> Sửa video
      </Button>
    )
  }
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3 text-[12px]">
      <div className="flex items-center justify-between">
        <div className="font-bold text-text">Sửa storyboard → tạo bản sửa → duyệt kịch bản (P3) → render ({renderCredit} credit)</div>
        <button type="button" className="text-text-muted underline" onClick={() => setOpen(false)}>Đóng</button>
      </div>
      {!newJobId && (
        <>
          {scenes.map((s, i) => (
            <div key={i} className="rounded border border-border bg-surface p-2 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">Cảnh {i + 1}</span>
                <input
                  type="number"
                  min={1}
                  max={15}
                  step={0.5}
                  value={s.durationSeconds}
                  onChange={(e) => setScenes((p) => p.map((x, k) => (k === i ? { ...x, durationSeconds: Number(e.target.value) || 1 } : x)))}
                  className="w-16 rounded border border-border px-1.5 py-0.5 text-xs"
                />
                <span className="text-text-muted">giây</span>
                <select
                  value={s.motionEffect}
                  onChange={(e) => setScenes((p) => p.map((x, k) => (k === i ? { ...x, motionEffect: e.target.value } : x)))}
                  className="rounded border border-border px-1.5 py-0.5 text-xs"
                >
                  {MOTIONS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={s.imageAssetId ?? ""}
                  onChange={(e) => setScenes((p) => p.map((x, k) => (k === i ? { ...x, imageAssetId: e.target.value || null } : x)))}
                  className="rounded border border-border px-1.5 py-0.5 text-xs max-w-[220px]"
                >
                  <option value="">— chọn ảnh —</option>
                  {props.imageChoices.map((c) => (
                    <option key={c.assetId} value={c.assetId}>{c.label}</option>
                  ))}
                </select>
              </div>
              <textarea
                rows={2}
                value={s.voiceScript}
                placeholder="Lời thoại (cũng là phụ đề)"
                onChange={(e) => setScenes((p) => p.map((x, k) => (k === i ? { ...x, voiceScript: e.target.value } : x)))}
                className="w-full rounded border border-border px-2 py-1 text-xs"
              />
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-text-muted">Giọng đọc</label>
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className="rounded border border-border px-2 py-1 text-xs">
              {VOICES.map((v) => (
                <option key={v.code} value={v.code}>{v.label}</option>
              ))}
            </select>
            <Button size="sm" className="h-7 text-[11px] gap-1" disabled={creating} onClick={() => void create()}>
              {creating ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />} Tạo bản sửa
            </Button>
          </div>
        </>
      )}
      {error && <div className="text-danger">{error}</div>}
      {newJobId && (
        <>
          <p className="text-text-muted">
            Bản sửa đã lập. Duyệt kịch bản (P3) rồi bấm Render — xong sẽ tự thay vào gói; duyệt P4 ở đây hoặc ở khung video phía trên.
          </p>
          <VideoJobLifecycle key={newJobId} jobId={newJobId} renderCredit={renderCredit} onChange={onJob} />
        </>
      )}
    </div>
  )
}

/**
 * Đợt 5 (24/09/2026): sửa cảnh ở Chặng 07 xong thì cập nhật NGAY cảnh đó trong
 * storyboard của video trong gói (ảnh mới + phụ đề mới). Storyboard đổi → video
 * về "kịch bản sẵn sàng", cần duyệt P3 + render lại. Trả lời nhắn cho người dùng.
 */
export async function propagateSceneToVideo(input: {
  videoJobId: string | null
  sceneIndex: number
  assetId: string
  scene: ScenePlanScene
  voiceChanged: boolean
}): Promise<string | null> {
  if (!input.videoJobId) return null
  const res = await fetch(`/api/v1/video/jobs/${encodeURIComponent(input.videoJobId)}`)
  if (!res.ok) return null
  const job = (await res.json()) as {
    stage: string
    audio_storage_key?: string | null
    scenes?: Array<{
      scene_index: number
      duration_seconds: number
      image_asset_id: string | null
      text_overlay: string | null
      voice_script: string | null
      transition_effect: string | null
      motion_effect: string | null
    }>
  }
  if (job.stage === "RENDERING") return "Video đang render — cảnh mới sẽ cần render lại sau khi xong."
  const scenes = [...(job.scenes ?? [])].sort((a, b) => a.scene_index - b.scene_index)
  if (!scenes.some((s) => s.scene_index === input.sceneIndex)) return null
  const patch = await fetch(`/api/v1/video/jobs/${encodeURIComponent(input.videoJobId)}/storyboard`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenes: scenes.map((s) => ({
        sceneIndex: s.scene_index,
        durationSeconds: s.duration_seconds,
        imageAssetId: s.scene_index === input.sceneIndex ? input.assetId : s.image_asset_id,
        textOverlay: s.scene_index === input.sceneIndex ? input.scene.voiceScript : s.voice_script,
        voiceScript: s.scene_index === input.sceneIndex ? input.scene.voiceScript : s.voice_script,
        ...(s.transition_effect ? { transitionEffect: s.transition_effect } : {}),
        ...(s.motion_effect ? { motionEffect: s.motion_effect } : {}),
      })),
    }),
  })
  if (!patch.ok) return "Không cập nhật được cảnh vào video — mở \"Sửa video\" để gắn ảnh mới."
  return input.voiceChanged && job.audio_storage_key
    ? `Đã thay cảnh ${input.sceneIndex} trong video. Lời thoại đổi nên bản âm thanh cũ không còn khớp — "Sửa âm thanh" rồi dựng lại video ở Khu vực E.`
    : `Đã thay ảnh + phụ đề cảnh ${input.sceneIndex} trong video — duyệt kịch bản (P3) và render lại để có video mới.`
}
