"use client"

import { useState, useCallback, useContext, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Film, Sparkles, Send, Loader2, CheckCircle2, AlertCircle, Play, Clock, Coins } from "lucide-react"
import { CreativeStudioContext } from "@/app/(app)/creative-studio/page"
import { StoryboardEditor } from "@/components/video-studio/storyboard-editor"
import { VideoJobList, type VideoJobSummary } from "@/components/video-studio/video-job-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VideoFormat, VIDEO_FORMAT_SPECS, CaptionStyle, CAPTION_STYLE_SPECS, VideoSceneItem } from "@/modules/video-studio/domain/video-types"
import { StageGateApprovalBar } from "@/components/ui/stage-gate-approval-bar"
import { resolveApprovedMaster } from "./package-client"
import { buildStoryboardFromPlan, buildStoryboardFromTopic, type SceneImage } from "./video-storyboard-builder"
import { findScenePlan, type ScenePlan } from "./scene-plan-client"

export function VideoWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const context = useContext(CreativeStudioContext)

  const navigateToArea = (area: "b" | "c" | "d" | "e" | "f") => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("area", area)
    router.push(`/creative-studio?${params.toString()}` as never)
  }

  const [format, setFormat] = useState<VideoFormat>("REEL_15S")
  const [title, setTitle] = useState(context?.productName ? `Video giới thiệu ${context.productName}` : "Video giới thiệu bó hoa tươi")
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("MODERN_BADGE")
  const [hasSubtitle, setHasSubtitle] = useState(true)
  const [hasWatermark, setHasWatermark] = useState(true)
  const [scenes, setScenes] = useState<VideoSceneItem[]>([])
  const [storyboardKey, setStoryboardKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [jobResult, setJobResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jobsLoading, setJobsLoading] = useState(false)
  const [videoJobs, setVideoJobs] = useState<VideoJobSummary[]>([])

  const spec = VIDEO_FORMAT_SPECS[format]

  // Storyboard theo KỊCH BẢN BỐI CẢNH của chủ đề (24/09/2026): số cảnh, lời
  // thoại, phụ đề, chuyển động lấy từ kịch bản Chặng 05; ảnh từng cảnh là ảnh
  // biến thể CÙNG kịch bản ở Khu vực D (đúng `scene_index`), cảnh chưa có ảnh
  // dùng Master Image của sản phẩm. Không còn khuôn 3 cảnh viết cứng hay ảnh
  // mẫu Unsplash — những ảnh đó không phải sản phẩm của tiệm.
  const [scenePlan, setScenePlan] = useState<ScenePlan | null>(null)
  const [buildingStoryboard, setBuildingStoryboard] = useState(false)
  const [storyboardNote, setStoryboardNote] = useState<string | null>(null)
  const urlPlanId = searchParams?.get("scenePlanId") ?? null

  useEffect(() => {
    if (scenes.length > 0 || !context) return
    let cancelled = false
    ;(async () => {
      setBuildingStoryboard(true)
      try {
        const [{ loaded }, masterId] = await Promise.all([
          findScenePlan(
            {
              mode: context.mode,
              productName: context.productName,
              productId: context.productId,
              assetId: context.assetId,
              selectedTopic: context.selectedTopic,
              commercialPassport: context.commercialPassport,
            },
            urlPlanId
          ).catch(() => ({ loaded: null })),
          resolveApprovedMaster(context.assetId).catch(() => null),
        ])

        // Ảnh Master (sản phẩm thật) — dùng cho cảnh chưa có ảnh biến thể.
        let master: SceneImage | null = null
        if (masterId) {
          const r = await fetch(`/api/v1/assets/${encodeURIComponent(masterId)}/view-url`)
          if (r.ok) master = { assetId: masterId, url: ((await r.json()) as { url: string }).url }
        }

        // Ảnh biến thể của ĐÚNG kịch bản, bản mới nhất mỗi cảnh.
        const byScene: Record<number, SceneImage> = {}
        if (masterId && loaded) {
          const r = await fetch(
            `/api/v1/assets?kind=MARKETING&parent_asset_id=${encodeURIComponent(masterId)}&limit=100`
          )
          if (r.ok) {
            const body = (await r.json()) as {
              data?: Array<{ id: string; url?: string | null; metadata?: Record<string, unknown> | null }>
            }
            for (const a of body.data ?? []) {
              const m = a.metadata ?? {}
              const idx = typeof m.scene_index === "number" ? m.scene_index : null
              if (!idx || byScene[idx] || m.scene_plan_id !== loaded.ref || !a.url) continue
              if (m.variant_key !== "styled" && m.variant_key !== "branded") continue
              byScene[idx] = { assetId: a.id, url: a.url }
            }
          }
        }
        if (cancelled) return

        if (loaded) {
          const built = buildStoryboardFromPlan(loaded.plan, spec.targetDurationSeconds, byScene, master)
          setScenePlan(loaded.plan)
          setScenes(built.scenes)
          setStoryboardNote(
            built.missingImages > 0
              ? `${built.missingImages}/${built.scenes.length} cảnh chưa có ảnh biến thể ở Khu vực D — tạm dùng Master Image của sản phẩm.`
              : null
          )
        } else {
          setScenes(buildStoryboardFromTopic(context.selectedTopic, context.productName, spec.targetDurationSeconds, master))
          setStoryboardNote(
            "Chưa có kịch bản bối cảnh cho chủ đề này — storyboard tạm dựng từ hook/tiêu đề/CTA. Bấm \"Bắt đầu sáng tạo\" ở Chặng 05 (hoặc viết kịch bản ở Khu vực D) để video kể đúng câu chuyện."
          )
        }
        setStoryboardKey((k) => k + 1)
      } finally {
        if (!cancelled) setBuildingStoryboard(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes.length, format, context?.assetId, context?.selectedTopic?.id, context?.mode, urlPlanId])

  const handleCreate = useCallback(async () => {
    if (scenes.length === 0) {
      setError("Storyboard chưa có cảnh nào.")
      return
    }
    setLoading(true); setError(null); setJobResult(null)
    try {
      const res = await fetch("/api/v1/video/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: context?.productId ?? null, title, format, aspectRatio: spec.aspectRatio,
          hasSubtitle, captionStyle, hasWatermark,
          scenes: scenes.map((s) => ({
            sceneIndex: s.sceneIndex, durationSeconds: s.durationSeconds,
            imageAssetId: s.imageAssetId ?? null, textOverlay: s.textOverlay ?? null,
            voiceScript: s.voiceScript ?? null, transitionEffect: s.transitionEffect,
            ...(s.motionEffect ? { motionEffect: s.motionEffect } : {}),
          })),
        }),
      })
      if (!res.ok) { const body = (await res.json().catch(() => ({}))).error?.message ?? `Lỗi ${res.status}`; throw new Error(body) }
      const created = (await res.json()) as Record<string, unknown> & { id?: string }
      setJobResult(created)
      if (created.id) {
        // Mang định danh video sang Khu vực F (gói chiến dịch đọc lại qua API).
        const params = new URLSearchParams(searchParams?.toString() || "")
        params.set("videoJobId", created.id)
        router.replace(`/creative-studio?${params.toString()}` as never)
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Lỗi") }
    finally { setLoading(false) }
  }, [context, title, format, spec, hasSubtitle, captionStyle, hasWatermark, scenes, router, searchParams])

  const loadJobs = useCallback(async () => {
    setJobsLoading(true)
    try {
      const res = await fetch(`/api/v1/video/jobs?productId=${context?.productId ?? ""}&limit=10`)
      if (res.ok) { const json = await res.json(); setVideoJobs(json.data ?? []) }
    } catch { /* ignore */ }
    finally { setJobsLoading(false) }
  }, [context])

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2"><Film size={14} /> Khuôn định dạng</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(VIDEO_FORMAT_SPECS) as VideoFormat[]).map((fmtKey) => {
            const s = VIDEO_FORMAT_SPECS[fmtKey]
            const sel = format === fmtKey
            return (
              <div key={fmtKey} onClick={() => { setFormat(fmtKey); setScenes([]) }} className={`cursor-pointer rounded-xl border p-3 transition-all ${sel ? "border-primary bg-primary/5 shadow-xs" : "border-border bg-background hover:border-border-hover"}`}>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-bold text-text">{s.label}</span>
                  <Badge tone={sel ? "success" : "neutral"} className="text-[10px] px-1.5 py-0">{s.aspectRatio}</Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted mt-1">
                  <span className="flex items-center gap-1"><Clock size={11} /> ~{s.targetDurationSeconds}s</span>
                  <span className="font-semibold text-amber-600 flex items-center gap-0.5"><Coins size={11} /> {s.defaultCreditCost} cr</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-bold text-text mb-3">Cấu hình cơ bản</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Tiêu đề</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:border-primary focus:outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-text-muted block mb-1">Phụ đề</label>
              <Select value={captionStyle} onValueChange={(v: CaptionStyle) => setCaptionStyle(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CAPTION_STYLE_SPECS) as CaptionStyle[]).map((cs) => <SelectItem key={cs} value={cs}>{CAPTION_STYLE_SPECS[cs].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={hasSubtitle} onChange={(e) => setHasSubtitle(e.target.checked)} />
              <span className="text-xs text-text">Phụ đề</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={hasWatermark} onChange={(e) => setHasWatermark(e.target.checked)} />
              <span className="text-xs text-text">Watermark</span>
            </div>
          </div>
        </div>
      </Card>
      {(buildingStoryboard || storyboardNote || scenePlan) && (
        <Card className="p-4 text-[12px] text-text-muted flex flex-col gap-1">
          {buildingStoryboard && <span>Đang dựng storyboard từ kịch bản bối cảnh và ảnh Khu vực D...</span>}
          {scenePlan && (
            <span>
              <Badge tone={scenePlan.source === "ai" ? "success" : "neutral"} className="text-[10px] mr-2">
                {scenePlan.source === "ai" ? "Kịch bản AI" : "Kịch bản cơ bản"}
              </Badge>
              Storyboard theo kịch bản bối cảnh của chủ đề <strong className="text-text">{scenePlan.topicTitle}</strong> —{" "}
              {scenePlan.scenes.map((sc) => sc.beat).join(" → ")}.
            </span>
          )}
          {storyboardNote && <span className="text-warning">{storyboardNote}</span>}
        </Card>
      )}
      {scenes.length > 0 && (
        <Card className="p-5">
          <StoryboardEditor
            key={`${format}-${storyboardKey}`}
            format={format}
            initialScenes={scenes}
            isLocked={false}
            onSaveScenes={async (u) => setScenes(u)}
            onChange={setScenes}
          />
        </Card>
      )}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-muted">Gọi <code className="bg-surface px-1.5 py-0.5 rounded text-xs">POST /api/v1/video/jobs</code></p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadJobs} className="gap-2"><Play size={14} /> Danh sách</Button>
          <Button onClick={handleCreate} disabled={loading || !title.trim()} className="gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Đang tạo...</> : <><Sparkles size={14} /> Tạo video</>}
          </Button>
        </div>
      </div>
      {error && <Card className="border-rose-200 bg-rose-50 p-4 flex items-center gap-3"><AlertCircle size={16} className="text-rose-600 shrink-0" /><p className="text-xs text-rose-800">{error}</p></Card>}
      {jobResult && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> Đã tạo video job</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-surface p-3 rounded-lg"><p className="text-[11px] text-text-muted">Job ID</p><p className="font-mono text-[11px] font-bold">{jobResult.id as string}</p></div>
            <div className="bg-surface p-3 rounded-lg"><p className="text-[11px] text-text-muted">Stage</p><p className="font-bold">{jobResult.stage as string ?? "DRAFT"}</p></div>
            <div className="bg-surface p-3 rounded-lg"><p className="text-[11px] text-text-muted">Credit</p><p className="font-bold text-amber-600">{spec.defaultCreditCost}</p></div>
          </div>
        </Card>
      )}
      {videoJobs.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-text mb-4"><Film size={14} /> Danh sách video ({videoJobs.length})</h3>
          <VideoJobList jobs={videoJobs} loading={jobsLoading} onSelectJob={() => {}} onCreateNew={() => setVideoJobs([])} />
        </Card>
      )}

      {/* ── CỔNG PHÊ DUYỆT CHẶNG 06d (STAGE-GATE APPROVAL) ── */}
      <div className="space-y-2 pt-2">
        <StageGateApprovalBar
          stageCode="Chặng 06d — SẢN XUẤT VIDEO MARKETING"
          title="Phê duyệt Kịch bản Storyboard & Video Clip (M04c)"
          description={`Storyboard ${scenes.length} phân cảnh theo khuôn ${spec.aspectRatio}, ~${spec.targetDurationSeconds}s. Tạo job ở đây là BẢN NHÁP: duyệt kịch bản (P3), render và duyệt video thành phẩm (P4) thực hiện ở màn Video; Khu vực F chỉ coi video là đạt khi đã duyệt P4.`}
          isApproved={Boolean(jobResult)}
          approveLabel="Phê duyệt Video & Tiến đến Đóng gói chiến dịch (Chặng 07) →"
          onApprove={() => navigateToArea("f")}
          metrics={[
            { label: "Khuôn video", value: spec.label },
            { label: "Tỷ lệ", value: spec.aspectRatio },
            { label: "Thời lượng", value: `~${spec.targetDurationSeconds}s` },
            { label: "Phụ đề", value: hasSubtitle ? "Có" : "Không" },
          ]}
        />
        <div className="flex justify-between items-center text-xs text-stone-500 pt-1">
          <button
            type="button"
            onClick={() => navigateToArea("d")}
            className="hover:text-stone-800 transition"
          >
            ← Quay lại Khu vực D (Tạo ảnh biến thể)
          </button>
          <button
            type="button"
            onClick={() => navigateToArea("f")}
            className="font-medium text-stone-500 hover:text-stone-800 transition underline decoration-dotted"
          >
            ⚡ Đóng gói chiến dịch ngay (Chặng 07) →
          </button>
        </div>
      </div>
    </div>
  )
}
