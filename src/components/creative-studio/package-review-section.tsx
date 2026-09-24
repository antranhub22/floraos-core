"use client"

/**
 * Chặng 07 — xem lại, sửa nhẹ và làm lại toàn bộ tài sản của gói (24/09/2026).
 *
 * Nguyên tắc (anh Tony chốt): XEM + DUYỆT tại chỗ; SỬA nhẹ (chọn/bỏ/đổi tài
 * sản) tại chỗ, không tốn credit; LÀM LẠI (tốn credit) mở đúng khu vực gốc với
 * đúng cảnh/job — mỗi loại tài sản chỉ có MỘT nơi sản xuất (cổng integrity,
 * trừ credit, nhật ký). Quay về từ khu vực gốc thì tài sản mới được đề xuất
 * thay vào gói.
 */

import { useState } from "react"
import { Check, CheckCircle2, Film, Headphones, ImageIcon, Loader2, RefreshCw, ShieldCheck, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CampaignPackageDto } from "./package-client"
import type { ScenePlan } from "./scene-plan-client"

export interface ReviewAsset {
  id: string
  url: string | null
  aspect_ratio: string | null
  identity_score: number | null
  approval_state: string
  created_at?: string
  metadata?: Record<string, unknown> | null
}

export interface ReviewVideoJob {
  id: string
  title: string
  stage: string
  video_approval: string
  aspect_ratio: string
}

type Rework = (area: "b" | "c" | "d" | "e", extra?: Record<string, string>) => void

async function post(path: string, body?: unknown): Promise<void> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(b.error?.message || `HTTP ${res.status}`)
  }
}

const pct = (v: number | null) => (typeof v === "number" ? `${(v * 100).toFixed(2)}%` : "chưa đo")

export function PackageReviewSection(props: {
  pkg: CampaignPackageDto
  approved: boolean
  scenePlan: ScenePlan | null
  planRef: string | null
  marketing: ReviewAsset[]
  selectedVariants: string[]
  setSelectedVariants: (fn: (prev: string[]) => string[]) => void
  videoJobs: ReviewVideoJob[]
  videoJobId: string | null
  setVideoJobId: (id: string | null) => void
  audioJobId: string | null
  setAudioJobId: (id: string | null) => void
  urlVideoJobId: string | null
  urlAudioJobId: string | null
  onAssetsChanged: () => void
  onPackageRefresh: () => Promise<void>
  onRework: Rework
}) {
  const {
    pkg, approved, scenePlan, planRef, marketing, selectedVariants, setSelectedVariants,
    videoJobs, videoJobId, setVideoJobId, audioJobId, setAudioJobId, urlVideoJobId, urlAudioJobId,
    onAssetsChanged, onPackageRefresh, onRework,
  } = props
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const act = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thao tác không thành công")
    } finally {
      setBusy(null)
    }
  }

  const byId = new Map(marketing.map((a) => [a.id, a]))
  const styled = marketing.filter((a) => a.metadata?.variant_key === "styled" || a.metadata?.variant_key === "branded")
  const samePlan = (a: ReviewAsset) => {
    const v = a.metadata?.scene_plan_id
    if (!planRef) return true
    return planRef.startsWith("rule:") ? typeof v === "string" && v.startsWith("rule:") : v === planRef
  }
  // Bản MỚI NHẤT mỗi cảnh của kịch bản đang mở (`marketing` sắp mới → cũ).
  const latestByScene = new Map<number, ReviewAsset>()
  for (const a of styled) {
    const idx = a.metadata?.scene_index
    if (typeof idx === "number" && samePlan(a) && !latestByScene.has(idx)) latestByScene.set(idx, a)
  }
  const selectedByScene = new Map<number, ReviewAsset>()
  for (const id of selectedVariants) {
    const a = byId.get(id)
    const idx = a?.metadata?.scene_index
    if (a && typeof idx === "number" && !selectedByScene.has(idx)) selectedByScene.set(idx, a)
  }

  const scenes =
    scenePlan?.scenes.map((s) => ({ index: s.sceneIndex, beat: s.beat, title: s.title, setting: s.setting })) ??
    [...new Set([...latestByScene.keys(), ...selectedByScene.keys()])]
      .sort((a, b) => a - b)
      .map((i) => ({ index: i, beat: "", title: `Cảnh ${i}`, setting: "" }))

  const swapIn = (idx: number, next: ReviewAsset) =>
    setSelectedVariants((prev) => {
      const old = selectedByScene.get(idx)
      return [...prev.filter((x) => x !== old?.id), next.id]
    })

  const approveImage = (a: ReviewAsset) =>
    act(`img-${a.id}`, async () => {
      const jobId = a.metadata?.job_id
      if (typeof jobId !== "string" || !jobId) throw new Error("Ảnh này không gắn job biến thể — duyệt ở Khu vực D.")
      await post(`/api/v1/media/variants/${encodeURIComponent(jobId)}/approve`, { asset_id: a.id })
      onAssetsChanged()
    })

  const video = pkg.video && pkg.video.id === videoJobId ? pkg.video : null
  const newerVideo = urlVideoJobId && urlVideoJobId !== videoJobId ? urlVideoJobId : null
  const newerAudio = urlAudioJobId && urlAudioJobId !== audioJobId ? urlAudioJobId : null

  return (
    <div className="space-y-5">
      {error && <div className="rounded-lg border border-danger bg-danger-bg px-3 py-2 text-[12px] text-danger">{error}</div>}

      {/* Kịch bản — để đối chiếu ảnh/video/lời thoại có kể cùng một câu chuyện */}
      {scenePlan && (
        <section className="rounded-lg border border-border bg-surface-alt p-3 text-[12px] text-text-muted">
          <span className="font-bold text-text">Kịch bản bối cảnh: </span>
          {scenePlan.topicTitle} — {scenePlan.scenes.map((s) => `${s.sceneIndex}. ${s.title}`).join(" → ")}
        </section>
      )}

      {/* ẢNH theo cảnh */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[12px] font-bold text-text flex items-center gap-1.5">
            <ImageIcon size={13} /> Ảnh theo cảnh (Khu vực D) — {selectedByScene.size}/{scenes.length} cảnh trong gói
          </div>
          <button type="button" className="text-[11.5px] text-primary hover:underline" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Ẩn kho ảnh" : "Chọn ảnh khác từ kho"}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scenes.map((sc) => {
            const chosen = selectedByScene.get(sc.index) ?? null
            const latest = latestByScene.get(sc.index) ?? null
            const shown = chosen ?? latest
            const hasNewer = !!(chosen && latest && latest.id !== chosen.id)
            return (
              <div key={sc.index} className="rounded-xl border border-border overflow-hidden bg-surface">
                <div className="relative aspect-square bg-stone-50 flex items-center justify-center">
                  {shown?.url ? (
                    <img src={shown.url} alt={sc.title} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[12px] text-text-muted">Chưa có ảnh cảnh này</span>
                  )}
                  <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10.5px] font-bold text-white">
                    Cảnh {sc.index}{sc.beat ? ` · ${sc.beat}` : ""}
                  </span>
                  {shown && !chosen && (
                    <span className="absolute right-2 top-2 rounded bg-warning-bg px-1.5 py-0.5 text-[10px] text-warning">chưa trong gói</span>
                  )}
                </div>
                <div className="p-3 space-y-1.5 text-[11.5px]">
                  <div className="font-bold text-text">{sc.title}</div>
                  {sc.setting && <div className="text-text-muted line-clamp-2">{sc.setting}</div>}
                  {shown && (
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">Lõi bó hoa: {pct(shown.identity_score)}</span>
                      <Badge tone={shown.approval_state === "APPROVED" ? "success" : "neutral"} className="text-[10px]">
                        {shown.approval_state === "APPROVED" ? "Đã duyệt (I5)" : "Chưa duyệt"}
                      </Badge>
                    </div>
                  )}
                  {hasNewer && !approved && (
                    <button type="button" className="text-primary font-bold hover:underline" onClick={() => swapIn(sc.index, latest)}>
                      ↻ Có ảnh mới hơn cho cảnh này — dùng ảnh mới
                    </button>
                  )}
                  {!approved && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {shown && !chosen && (
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => swapIn(sc.index, shown)}>
                          Đưa vào gói
                        </Button>
                      )}
                      {chosen && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px]"
                          onClick={() => setSelectedVariants((prev) => prev.filter((x) => x !== chosen.id))}
                        >
                          Bỏ khỏi gói
                        </Button>
                      )}
                      {shown && shown.approval_state !== "APPROVED" && (
                        <Button size="sm" className="h-7 text-[11px] gap-1" disabled={busy !== null} onClick={() => void approveImage(shown)}>
                          {busy === `img-${shown.id}` ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Duyệt ảnh
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] gap-1"
                        onClick={() => onRework("d", { focusScene: String(sc.index) })}
                      >
                        <Wand2 size={11} /> Sinh lại cảnh {sc.index}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {showAll && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
            {styled.map((a) => {
              const on = selectedVariants.includes(a.id)
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={approved}
                  onClick={() => setSelectedVariants((prev) => (on ? prev.filter((x) => x !== a.id) : [...prev, a.id]))}
                  className={`rounded-lg border-2 overflow-hidden ${on ? "border-primary" : "border-border"}`}
                  title={`Cảnh ${String(a.metadata?.scene_index ?? "?")} · ${pct(a.identity_score)}`}
                >
                  {a.url && <img src={a.url} alt="" className="aspect-square w-full object-cover" />}
                  <div className="text-[10px] p-1">Cảnh {String(a.metadata?.scene_index ?? "?")}</div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* VIDEO */}
      <section className="space-y-2">
        <div className="text-[12px] font-bold text-text flex items-center gap-1.5"><Film size={13} /> Video (Khu vực E)</div>
        {newerVideo && !approved && (
          <button type="button" className="text-[12px] text-primary font-bold hover:underline" onClick={() => setVideoJobId(newerVideo)}>
            ↻ Có video mới từ Khu vực E (job {newerVideo.slice(0, 8)}) — dùng video này
          </button>
        )}
        {video?.view_url ? (
          <video src={video.view_url} controls playsInline className="max-h-[420px] mx-auto rounded-xl border border-border bg-black" />
        ) : videoJobId ? (
          <p className="text-[12px] text-text-muted">
            {pkg.video && pkg.video.id !== videoJobId ? "Lưu gói để xem video vừa chọn." : "Video chưa render xong — render ở Khu vực E."}
          </p>
        ) : (
          <p className="text-[12px] text-text-muted">Chưa kèm video.</p>
        )}
        {video && (
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <Badge tone={video.video_approval === "APPROVED" ? "success" : "neutral"} className="text-[10.5px]">
              {video.video_approval === "APPROVED" ? "Đã duyệt P4" : video.stage === "RENDER_COMPLETED" ? "Đã render — chưa duyệt P4" : video.stage}
            </Badge>
            {!approved && video.stage === "RENDER_COMPLETED" && video.video_approval !== "APPROVED" && (
              <Button
                size="sm"
                className="h-7 text-[11px] gap-1"
                disabled={busy !== null}
                onClick={() =>
                  void act("video", async () => {
                    await post(`/api/v1/video/jobs/${encodeURIComponent(video.id)}/approve-video`)
                    await onPackageRefresh()
                  })
                }
              >
                {busy === "video" ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} />} Duyệt video (P4)
              </Button>
            )}
          </div>
        )}
        {!approved && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={videoJobId ?? ""}
              onChange={(e) => setVideoJobId(e.target.value || null)}
              className="flex-1 min-w-[220px] rounded-lg border border-border px-3 py-1.5 text-xs"
            >
              <option value="">— Không kèm video —</option>
              {videoJobs.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} · {v.aspect_ratio} · {v.stage} · P4: {v.video_approval}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px] gap-1"
              onClick={() => onRework("e", videoJobId ? { videoJobId } : {})}
            >
              <RefreshCw size={11} /> Sửa storyboard / render lại
            </Button>
          </div>
        )}
      </section>

      {/* ÂM THANH */}
      <section className="space-y-2">
        <div className="text-[12px] font-bold text-text flex items-center gap-1.5"><Headphones size={13} /> Âm thanh (Khu vực C)</div>
        {newerAudio && !approved && (
          <button type="button" className="text-[12px] text-primary font-bold hover:underline" onClick={() => setAudioJobId(newerAudio)}>
            ↻ Có bản phối mới từ Khu vực C (job {newerAudio.slice(0, 8)}) — dùng bản này
          </button>
        )}
        {pkg.audio?.audio_url && pkg.audio.job_id === audioJobId ? (
          <audio controls src={pkg.audio.audio_url} className="w-full" />
        ) : audioJobId ? (
          <p className="text-[12px] text-text-muted">
            {pkg.audio && pkg.audio.job_id !== audioJobId ? "Lưu gói để nghe bản phối vừa chọn." : "Bản phối chưa sẵn sàng."}
          </p>
        ) : (
          <p className="text-[12px] text-text-muted">Chưa kèm âm thanh.</p>
        )}
        {!approved && (
          <div className="flex flex-wrap gap-2">
            {audioJobId && (
              <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setAudioJobId(null)}>
                Bỏ khỏi gói
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => onRework("c", audioJobId ? { audioJobId } : {})}>
              <RefreshCw size={11} /> Phối lại ở Khu vực C
            </Button>
          </div>
        )}
      </section>

      {approved && (
        <p className="text-[12px] text-success flex items-center gap-1.5">
          <CheckCircle2 size={13} /> Gói đã duyệt — không đổi tài sản được nữa.
        </p>
      )}
    </div>
  )
}
