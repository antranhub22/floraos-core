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
import { resolveSceneImages } from "./scene-images-client"
import { buildStoryboardFromPlan, buildStoryboardFromTopic, type SceneImage } from "./video-storyboard-builder"
import { findScenePlan, type LoadedScenePlan, type ScenePlan } from "./scene-plan-client"
import { PlanVideoAssembly } from "./plan-video-assembly"
import { VideoJobLifecycle, type VideoJobDetail } from "./video-job-lifecycle"
import { costCreditForFeature } from "@/modules/usage/domain/pricing"

/** Credit THẬT trừ khi render (`enqueueJob` feature `video.render`) — không phải `defaultCreditCost` của khuôn. */
const RENDER_CREDIT = costCreditForFeature("video.render")

/**
 * Giọng đọc cho video (24/09/2026). Trước đây Khu vực E KHÔNG gửi `voiceCode`
 * nên worker bỏ qua bước lồng tiếng — video chỉ có nhạc nền. Mã khớp
 * `VOICE_MAPPING` của `workers/media_ai/video/audio_engine.py`.
 */
const VIDEO_VOICES: Array<{ code: string; label: string }> = [
  { code: "vi-VN-Standard-A", label: "Nữ truyền cảm" },
  { code: "vi-VN-Standard-C", label: "Nữ trẻ trung" },
  { code: "vi-VN-Standard-B", label: "Nam ấm áp" },
  { code: "none", label: "Không lồng tiếng (chỉ nhạc)" },
]

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
  const [voiceCode, setVoiceCode] = useState<string>(
    VIDEO_VOICES.some((v) => v.code === context?.voiceId) ? (context?.voiceId as string) : "vi-VN-Standard-A"
  )
  const [scenes, setScenes] = useState<VideoSceneItem[]>([])
  const [storyboardKey, setStoryboardKey] = useState(0)
  const [loading, setLoading] = useState(false)

  // Video job đang theo dõi — tạo ở đây hoặc mở lại từ URL `videoJobId`.
  const [activeVideoJobId, setActiveVideoJobId] = useState<string | null>(searchParams?.get("videoJobId") ?? null)
  const [videoJob, setVideoJob] = useState<VideoJobDetail | null>(null)
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
  const [loadedPlan, setLoadedPlan] = useState<LoadedScenePlan | null>(null)
  const [buildingStoryboard, setBuildingStoryboard] = useState(false)
  const [storyboardNote, setStoryboardNote] = useState<string | null>(null)
  const urlPlanId = searchParams?.get("scenePlanId") ?? null

  useEffect(() => {
    if (scenes.length > 0 || !context) return
    let cancelled = false
    ;(async () => {
      setBuildingStoryboard(true)
      try {
        const { loaded } = await findScenePlan(
          {
            mode: context.mode,
            productName: context.productName,
            productId: context.productId,
            assetId: context.assetId,
            selectedTopic: context.selectedTopic,
            commercialPassport: context.commercialPassport,
          },
          urlPlanId
        ).catch(() => ({ loaded: null }))
        // Ảnh THẬT của từng cảnh từ Khu vực D (xem `scene-images-client.ts`).
        const images = await resolveSceneImages(context.assetId, loaded?.ref ?? null)
        const master = images.master
        const byScene = images.byScene
        if (cancelled) return

        if (loaded) {
          const built = buildStoryboardFromPlan(loaded.plan, spec.targetDurationSeconds, byScene, master)
          setScenePlan(loaded.plan)
          setLoadedPlan(loaded)
          setScenes(built.scenes)
          const notes: string[] = []
          if (built.missingImages > 0) {
            notes.push(
              master
                ? `${built.missingImages}/${built.scenes.length} cảnh chưa có ảnh biến thể ở Khu vực D — tạm dùng ${images.masterIsOriginal ? "ảnh gốc" : "Master Image"} của sản phẩm.`
                : `${built.missingImages}/${built.scenes.length} cảnh chưa có ảnh — không đọc được ảnh sản phẩm. Mở Khu vực D để sinh ảnh rồi bấm "Lấy ảnh mới nhất từ Khu vực D".`
            )
          }
          if (images.fromOtherPlan.length > 0) {
            notes.push(`Cảnh ${images.fromOtherPlan.map((i) => `#${i}`).join(", ")} dùng ảnh D của lần viết kịch bản trước (kịch bản đã được viết lại sau khi sinh ảnh).`)
          }
          setStoryboardNote(notes.length ? notes.join(" ") : null)
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

  // Lấy lại ảnh MỚI NHẤT của Khu vực D cho từng cảnh — giữ nguyên chữ, lời
  // thoại, chuyển động người dùng đã sửa (24/09/2026).
  const [refreshingImages, setRefreshingImages] = useState(false)
  const refreshImagesFromD = useCallback(async () => {
    if (!context) return
    setRefreshingImages(true)
    try {
      const { loaded } = await findScenePlan(
        {
          mode: context.mode,
          productName: context.productName,
          productId: context.productId,
          assetId: context.assetId,
          selectedTopic: context.selectedTopic,
          commercialPassport: context.commercialPassport,
        },
        urlPlanId
      ).catch(() => ({ loaded: null }))
      const images = await resolveSceneImages(context.assetId, loaded?.ref ?? null)
      let filled = 0
      setScenes((prev) =>
        prev.map((s, i) => {
          const img = images.byScene[s.sceneIndex ?? i + 1] ?? images.master
          if (!img) return s
          filled++
          return { ...s, imageAssetId: img.assetId, imageUrl: img.url }
        })
      )
      setStoryboardKey((k) => k + 1)
      setStoryboardNote(filled > 0 ? null : "Chưa có ảnh nào ở Khu vực D cho sản phẩm này — sinh ảnh ở Khu vực D trước.")
    } finally {
      setRefreshingImages(false)
    }
  }, [context, urlPlanId])

  const handleCreate = useCallback(async () => {
    if (scenes.length === 0) {
      setError("Storyboard chưa có cảnh nào.")
      return
    }
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/v1/video/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: context?.productId ?? null, title, format, aspectRatio: spec.aspectRatio,
          hasSubtitle, captionStyle, hasWatermark,
          voiceCode: voiceCode === "none" ? null : voiceCode,
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
      if (created.id) {
        setActiveVideoJobId(created.id)
        // Mang định danh video sang Khu vực F (gói chiến dịch đọc lại qua API).
        const params = new URLSearchParams(searchParams?.toString() || "")
        params.set("videoJobId", created.id)
        router.replace(`/creative-studio?${params.toString()}` as never)
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Lỗi") }
    finally { setLoading(false) }
  }, [context, title, format, spec, hasSubtitle, captionStyle, hasWatermark, voiceCode, scenes, router, searchParams])

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
      {loadedPlan && context && (
        <PlanVideoAssembly
          loaded={loadedPlan}
          assetId={context.assetId}
          audioJobId={searchParams?.get("audioJobId") ?? null}
          title={title}
          onGoArea={(area, focusScene) => {
            const params = new URLSearchParams(searchParams?.toString() || "")
            params.set("area", area)
            if (focusScene) params.set("focusScene", String(focusScene))
            router.push(`/creative-studio?${params.toString()}` as never)
          }}
          onCreated={(id) => {
            setActiveVideoJobId(id)
            const params = new URLSearchParams(searchParams?.toString() || "")
            params.set("videoJobId", id)
            router.replace(`/creative-studio?${params.toString()}` as never)
          }}
        />
      )}
      {loadedPlan && (
        <p className="-mt-2 text-[11px] text-text-muted">
          Hoặc chỉnh storyboard tay bên dưới (nâng cao) — video tạo theo cách này tự đọc lại lời thoại, không dùng bản phối Khu vực C.
        </p>
      )}
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
                  <span className="font-semibold text-amber-600 flex items-center gap-0.5" title="Credit trừ khi bấm Render"><Coins size={11} /> {RENDER_CREDIT} cr</span>
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
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Giọng đọc lồng tiếng</label>
            <Select value={voiceCode} onValueChange={(v: string) => setVoiceCode(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VIDEO_VOICES.map((v) => <SelectItem key={v.code} value={v.code}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-text-muted">Đọc đúng lời thoại từng cảnh của storyboard (cùng kịch bản với Khu vực C), khớp thời lượng từng cảnh; nhạc nền tự hạ âm lượng khi có giọng.</p>
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
      {(buildingStoryboard || storyboardNote || scenePlan || scenes.length > 0) && (
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
          {scenes.length > 0 && (
            <span>
              <button type="button" disabled={refreshingImages} onClick={() => void refreshImagesFromD()} className="font-bold text-primary hover:underline cursor-pointer">
                {refreshingImages ? "Đang lấy ảnh..." : "↻ Lấy ảnh mới nhất từ Khu vực D"}
              </button>
            </span>
          )}
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
      {activeVideoJobId && (
        <VideoJobLifecycle
          key={activeVideoJobId}
          jobId={activeVideoJobId}
          renderCredit={RENDER_CREDIT}
          onChange={setVideoJob}
          sceneImages={scenes.flatMap((s, i) => (s.imageAssetId ? [{ scene_index: s.sceneIndex ?? i + 1, asset_id: s.imageAssetId }] : []))}
        />
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
          description={`Storyboard ${scenes.length} phân cảnh theo khuôn ${spec.aspectRatio}, ~${spec.targetDurationSeconds}s. "Tạo video" lập BẢN NHÁP; duyệt kịch bản (P3), render (${RENDER_CREDIT} credit) và duyệt video thành phẩm (P4) ngay trong khung video job ở trên. Chỉ khi video đã duyệt P4 mới được coi là đạt.`}
          isApproved={videoJob?.video_approval === "APPROVED"}
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
