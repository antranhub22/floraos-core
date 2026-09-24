"use client"
/**
 * PackageWorkspace — Khu vực F (Chặng 07 PACKAGE → 08 QA → 09 APPROVE, rồi 10–14).
 *
 * 23/09/2026 — viết lại trên dữ liệu thật. Bản trước: tài sản luôn "READY",
 * QA là bốn hằng "PASSED 99.9%", duyệt chỉ đổi state trình duyệt, bài đăng mẫu
 * gõ cứng. Nay:
 *   07 — gói lưu ở bảng `campaign_packages`, chỉ giữ ĐỊNH DANH tài sản thật
 *        (biến thể của đúng Master, video job, audio job) + bài đăng người dùng soạn.
 *   08 — QA chạy phía máy chủ (`POST /packages/:id/qa`), năm trục, số đo thật.
 *   09 — duyệt qua endpoint riêng (`J5`), ghi `audit_logs` cùng giao dịch.
 *   10–14 — `<PackageDownstreamCard />` đọc số liệu thật (`/performance`).
 */

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, CheckCircle2, Loader2, Package, RefreshCw, Save, ShieldCheck } from "lucide-react"

import { CreativeStudioContext } from "@/app/(app)/creative-studio/page"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PackageQACard } from "./package-qa-card"
import { PackageDownstreamCard } from "./package-downstream-card"
import {
  apiJson,
  findLatestPackage,
  promoteToMaster,
  resolveApprovedMaster,
  sceneTwoPresetFor,
  contentDraftKey,
  getContentDraft,
  type ContentDraftDto,
  type CampaignPackageDto,
  type PackageChannel,
  type PackagePostDto,
} from "./package-client"
import { PackageReviewSection } from "./package-review-section"
import { findScenePlan, type ScenePlan } from "./scene-plan-client"

const CHANNELS: { id: PackageChannel; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "zalo", label: "Zalo OA" },
]

const STATUS_LABEL: Record<CampaignPackageDto["status"], string> = {
  DRAFT: "Nháp — chưa chạy QA",
  QA_PASSED: "QA đạt",
  QA_NEEDS_REVIEW: "QA cần xem lại",
  QA_REJECTED: "QA từ chối",
  APPROVED: "Đã duyệt (Chặng 09)",
}

interface MarketingAsset {
  id: string
  url: string | null
  aspect_ratio: string | null
  identity_score: number | null
  approval_state: string
  metadata?: Record<string, unknown> | null
}

interface VideoJobSummary {
  id: string
  title: string
  stage: string
  video_approval: string
  aspect_ratio: string
}

function parseHashtags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
}

export function PackageWorkspace() {
  const ctx = useContext(CreativeStudioContext)
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlVideoJobId = searchParams?.get("videoJobId") ?? null
  const urlAudioJobId = searchParams?.get("audioJobId") ?? null
  const urlPlanId = searchParams?.get("scenePlanId") ?? null

  const [masterId, setMasterId] = useState<string | null>(null)
  const [resolving, setResolving] = useState(true)
  const [pkg, setPkg] = useState<CampaignPackageDto | null>(null)
  const [marketing, setMarketing] = useState<MarketingAsset[]>([])
  const [videoJobs, setVideoJobs] = useState<VideoJobSummary[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [acknowledge, setAcknowledge] = useState(false)
  const [scenePlan, setScenePlan] = useState<ScenePlan | null>(null)
  const [planRef, setPlanRef] = useState<string | null>(null)
  const [assetsNonce, setAssetsNonce] = useState(0)
  // Bài Khu vực B đã tự lưu (24/09/2026) — đưa sẵn vào gói / đề xuất thay.
  const [bDraft, setBDraft] = useState<ContentDraftDto | null>(null)

  // Bản nháp chỉnh sửa (Chặng 07) — lưu bằng PATCH.
  const [selectedVariants, setSelectedVariants] = useState<string[]>([])
  // Mỗi khung trong phạm vi sản xuất một video (PO 24/09/2026) — phần tử đầu là video chính.
  const [videoJobIds, setVideoJobIds] = useState<string[]>([])
  const videoJobId = videoJobIds[0] ?? null
  const [audioJobId, setAudioJobId] = useState<string | null>(null)
  const [posts, setPosts] = useState<Record<PackageChannel, { on: boolean; text: string; tags: string }>>({
    facebook: { on: false, text: "", tags: "" },
    instagram: { on: false, text: "", tags: "" },
    tiktok: { on: false, text: "", tags: "" },
    zalo: { on: false, text: "", tags: "" },
  })

  const loadDraftFrom = useCallback((p: CampaignPackageDto) => {
    setPkg(p)
    setSelectedVariants(p.variant_asset_ids)
    setVideoJobIds(p.video_job_ids?.length ? p.video_job_ids : p.video_job_id ? [p.video_job_id] : [])
    setAudioJobId(p.audio_job_id)
    setPosts((prev) => {
      const next = { ...prev }
      for (const c of CHANNELS) next[c.id] = { on: false, text: "", tags: "" }
      for (const post of p.posts) next[post.channel] = { on: true, text: post.text, tags: post.hashtags.join(" ") }
      return next
    })
  }, [setPkg, setSelectedVariants, setVideoJobIds, setAudioJobId, setPosts])

  // 1. Master đã duyệt + gói mới nhất của Master.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setResolving(true)
      setError(null)
      try {
        const id = await resolveApprovedMaster(ctx?.assetId)
        if (cancelled) return
        setMasterId(id)
        if (id) {
          const latest = await findLatestPackage(id)
          if (!cancelled && latest) loadDraftFrom(latest)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không tải được gói chiến dịch")
      } finally {
        if (!cancelled) setResolving(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ctx?.assetId, loadDraftFrom])

  // Kịch bản bối cảnh của chủ đề — đặt tên/bối cảnh cho từng cảnh ảnh.
  useEffect(() => {
    if (!ctx) return
    let cancelled = false
    findScenePlan(
      {
        mode: ctx.mode,
        productName: ctx.productName,
        productId: ctx.productId,
        assetId: ctx.assetId,
        selectedTopic: ctx.selectedTopic,
        commercialPassport: ctx.commercialPassport,
      },
      urlPlanId
    )
      .then(({ loaded }) => {
        if (cancelled) return
        setScenePlan(loaded?.plan ?? null)
        setPlanRef(loaded?.ref ?? null)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.assetId, ctx?.selectedTopic?.id, ctx?.mode, urlPlanId])

  useEffect(() => {
    const key = ctx ? contentDraftKey({ assetId: ctx.assetId, selectedTopic: ctx.selectedTopic, mode: ctx.mode }) : null
    if (!key) return
    let cancelled = false
    getContentDraft(key)
      .then((d) => {
        if (!cancelled) setBDraft(d)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.assetId, ctx?.selectedTopic?.id, ctx?.mode])

  const applyBDraft = () => {
    if (!bDraft) return
    setPosts(() => {
      const next = {} as Record<PackageChannel, { on: boolean; text: string; tags: string }>
      for (const c of CHANNELS) next[c.id] = { on: false, text: "", tags: "" }
      for (const post of bDraft.posts) next[post.channel] = { on: true, text: post.text, tags: post.hashtags.join(" ") }
      return next
    })
  }

  // Làm lại ở khu vực gốc (tốn credit) — mang `returnTo=f` để quay về gói.
  const goRework = (area: "b" | "c" | "d" | "e", extra: Record<string, string> = {}) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("area", area)
    params.set("returnTo", "f")
    for (const [k, v] of Object.entries(extra)) params.set(k, v)
    router.push(`/creative-studio?${params.toString()}` as never)
  }

  const refreshPackage = async () => {
    if (!pkg) return
    // Chỉ làm mới dữ liệu hiển thị (video/âm thanh/QA) — giữ nguyên bản nháp đang sửa.
    setPkg(await apiJson<CampaignPackageDto>(`/api/v1/creative-production/packages/${pkg.id}`))
  }

  // 2. Tài sản thật để chọn vào gói.
  useEffect(() => {
    if (!masterId) return
    fetch(`/api/v1/assets?kind=MARKETING&parent_asset_id=${encodeURIComponent(masterId)}&limit=100`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((b: { data?: MarketingAsset[] }) => setMarketing(b.data ?? []))
      .catch(() => setMarketing([]))
  }, [masterId, assetsNonce])

  useEffect(() => {
    const productId = pkg?.product_id ?? ctx?.productId
    const q = productId ? `productId=${encodeURIComponent(productId)}&` : ""
    fetch(`/api/v1/video/jobs?${q}limit=20`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((b: { data?: VideoJobSummary[] }) => setVideoJobs(b.data ?? []))
      .catch(() => setVideoJobs([]))
  }, [pkg?.product_id, ctx?.productId])

  // Định danh mang từ Khu vực C/E qua URL — gợi ý sẵn khi gói chưa có.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ state từ nguồn ngoài (URL/API), chủ đích
    if (urlVideoJobId && !videoJobId && pkg?.status !== "APPROVED") setVideoJobIds([urlVideoJobId])
    if (urlAudioJobId && !audioJobId && pkg?.status !== "APPROVED") setAudioJobId(urlAudioJobId)
  }, [urlVideoJobId, urlAudioJobId, videoJobId, audioJobId, pkg?.status])

  // ── Nhiều khung (PO 24/09/2026): mỗi khung một bộ ảnh + một video ─────────
  const planRatios: string[] = scenePlan?.publishing?.ratios?.length
    ? [...scenePlan.publishing.ratios]
    : scenePlan?.publishing?.aspectRatio
    ? [scenePlan.publishing.aspectRatio]
    : []
  const multiRatio = planRatios.length > 1
  const [videoRatioTab, setVideoRatioTab] = useState<string | null>(null)
  const activeRatio = videoRatioTab && planRatios.includes(videoRatioTab) ? videoRatioTab : (planRatios[0] ?? null)
  const ratioOfVideo = (id: string) =>
    videoJobs.find((v) => v.id === id)?.aspect_ratio ?? pkg?.videos?.find((v) => v.id === id)?.aspect_ratio ?? null
  const activeVideoId = multiRatio
    ? (videoJobIds.find((id) => ratioOfVideo(id) === activeRatio) ?? null)
    : videoJobId
  /** Đặt video cho khung đang xem (một khung) hoặc video duy nhất (gói một khung). */
  const withVideoFor = (ids: string[], id: string | null, ratio: string | null): string[] => {
    if (!multiRatio) return id ? [id] : []
    const r = id ? (ratioOfVideo(id) ?? ratio) : ratio
    const rest = ids.filter((x) => ratioOfVideo(x) !== r && x !== id)
    return id ? [...rest, id] : rest
  }
  const setActiveVideo = (id: string | null) => setVideoJobIds((prev) => withVideoFor(prev, id, activeRatio))

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thao tác thất bại")
    } finally {
      setBusy(null)
    }
  }

  const handlePromote = () =>
    run("promote", async () => {
      if (!ctx?.assetId) throw new Error("Chưa có ảnh từ Khu vực A.")
      setMasterId(await promoteToMaster(ctx.assetId))
    })

  // Tài sản THẬT đã sản xuất ở B–E cho Master này (24/09/2026) — trước đây
  // màn Chặng 07 trống trơn tới khi bấm tạo, rồi người dùng tự tìm lại từng thứ.
  // Ảnh: bản mới nhất mỗi cảnh của ĐÚNG kịch bản đang mở (URL `scenePlanId`).
  const producedScenes = (() => {
    const samePlan = (v: unknown) =>
      !urlPlanId ? true : urlPlanId === "rule" ? typeof v === "string" && v.startsWith("rule:") : v === urlPlanId
    // Mỗi khung trong phạm vi một bộ ảnh (24/09/2026): bản mới nhất mỗi cảnh × mỗi khung.
    const seen = new Set<string>()
    const primary = scenePlan?.publishing?.aspectRatio ?? null
    return marketing
      .filter((a) => {
        const m = a.metadata ?? {}
        if (m.variant_key !== "styled" && m.variant_key !== "branded") return false
        if (!samePlan(m.scene_plan_id)) return false
        const idx = typeof m.scene_index === "number" ? m.scene_index : null
        const ratio = typeof m.ratio === "string" ? m.ratio : primary
        if (planRatios.length > 0 && ratio && !planRatios.includes(ratio)) return false
        const key = `${ratio}:${idx}`
        if (idx === null || seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => Number(a.metadata?.scene_index ?? 0) - Number(b.metadata?.scene_index ?? 0))
  })()

  // Video: job trên URL; không có thì video mới nhất đã duyệt P4, rồi mới đến bản đã render.
  // Nhiều khung: chọn như vậy cho TỪNG khung trong phạm vi.
  const pickVideo = (pool: VideoJobSummary[]): VideoJobSummary | null =>
    pool.find((v) => v.video_approval === "APPROVED") ?? pool.find((v) => v.stage === "RENDER_COMPLETED") ?? null
  const suggestedVideos = ((): VideoJobSummary[] => {
    const fromUrl = urlVideoJobId
      ? (videoJobs.find((v) => v.id === urlVideoJobId) ?? { id: urlVideoJobId, title: "", stage: "?", video_approval: "?", aspect_ratio: "" })
      : null
    if (!multiRatio) {
      const one = fromUrl ?? pickVideo(videoJobs)
      return one ? [one] : []
    }
    return planRatios
      .map((r) => (fromUrl && fromUrl.aspect_ratio === r ? fromUrl : pickVideo(videoJobs.filter((v) => v.aspect_ratio === r))))
      .filter((v): v is VideoJobSummary => v !== null)
  })()

  const handleCreate = () =>
    run("create", async () => {
      if (!masterId) return
      const topic = ctx?.selectedTopic
      const created = await apiJson<CampaignPackageDto>("/api/v1/creative-production/packages", {
        method: "POST",
        body: JSON.stringify({
          name: `${ctx?.productName || "Sản phẩm"}${topic ? ` — ${topic.title}` : ""}`.slice(0, 200),
          mode: ctx?.mode ?? "CREATIVE",
          master_asset_id: masterId,
          ...(topic
            ? {
                topic: {
                  id: topic.id,
                  title: topic.title,
                  angleCategory: topic.angleCategory,
                  hook: topic.hook,
                  cta: topic.cta,
                  scene2Preset: sceneTwoPresetFor(topic.angleCategory),
                  // Đợt 5: gói gắn kịch bản sản xuất tổng → QA trục "đồng nhất kịch bản".
                  ...(planRef ? { scenePlanId: planRef, scenePlanRevision: scenePlan?.revision ?? 1 } : {}),
                },
              }
            : {}),
          ...(producedScenes.length > 0 ? { variant_asset_ids: producedScenes.map((a) => a.id) } : {}),
          ...(bDraft && bDraft.posts.length > 0 ? { posts: bDraft.posts } : {}),
          ...(suggestedVideos.length > 0 ? { video_job_ids: suggestedVideos.map((v) => v.id) } : {}),
          ...(urlAudioJobId ? { audio_job_id: urlAudioJobId } : {}),
        }),
      })
      loadDraftFrom(created)
    })

  const draftPosts: PackagePostDto[] = useMemo(
    () =>
      CHANNELS.filter((c) => posts[c.id].on).map((c) => ({
        channel: c.id,
        text: posts[c.id].text,
        hashtags: parseHashtags(posts[c.id].tags),
      })),
    [posts]
  )

  const handleSave = () =>
    run("save", async () => {
      if (!pkg) return
      loadDraftFrom(
        await apiJson<CampaignPackageDto>(`/api/v1/creative-production/packages/${pkg.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            posts: draftPosts,
            variant_asset_ids: selectedVariants,
            video_job_ids: videoJobIds,
            audio_job_id: audioJobId,
          }),
        })
      )
    })

  // ── Sửa tại chỗ (24/09/2026): kết quả mới tự thay vào gói và LƯU ngay ────
  // Đọc giá trị MỚI NHẤT qua ref — việc chạy ngầm kết thúc sau nhiều lần render.
  const latestDraft = useRef({ selectedVariants, videoJobIds, audioJobId, draftPosts, pkgId: pkg?.id ?? null })
  useEffect(() => {
    latestDraft.current = { selectedVariants, videoJobIds, audioJobId, draftPosts, pkgId: pkg?.id ?? null }
  }, [selectedVariants, videoJobIds, audioJobId, draftPosts, pkg?.id])

  const saveNow = async (o: {
    variantIds?: string[]
    videoJobIds?: string[]
    audioJobId?: string | null
    posts?: PackagePostDto[]
  }) => {
    const cur = latestDraft.current
    if (!cur.pkgId) return
    loadDraftFrom(
      await apiJson<CampaignPackageDto>(`/api/v1/creative-production/packages/${cur.pkgId}`, {
        method: "PATCH",
        body: JSON.stringify({
          posts: o.posts ?? cur.draftPosts,
          variant_asset_ids: o.variantIds ?? cur.selectedVariants,
          video_job_ids: o.videoJobIds ?? cur.videoJobIds,
          audio_job_id: o.audioJobId !== undefined ? o.audioJobId : cur.audioJobId,
        }),
      })
    )
  }

  const applyRevision = async (change: {
    replaceScene?: { index: number; assetId: string }
    videoJobId?: string
    audioJobId?: string
  }) => {
    if (change.replaceScene) {
      const { index, assetId } = change.replaceScene
      // Bỏ ảnh CÙNG cảnh đang trong gói (theo metadata), thêm ảnh mới.
      const sameScene = new Set(
        marketing.filter((a) => a.metadata?.scene_index === index).map((a) => a.id)
      )
      const next = [...latestDraft.current.selectedVariants.filter((id) => !sameScene.has(id)), assetId]
      await saveNow({ variantIds: next })
    }
    // Video mới thay đúng video CÙNG khung trong gói.
    if (change.videoJobId) await saveNow({ videoJobIds: withVideoFor(latestDraft.current.videoJobIds, change.videoJobId, activeRatio) })
    if (change.audioJobId) await saveNow({ audioJobId: change.audioJobId })
  }

  const onSceneRevised = (scene: ScenePlan["scenes"][number], revision?: number | null) =>
    setScenePlan((prev) =>
      prev
        ? {
            ...prev,
            ...(revision ? { revision } : {}),
            scenes: prev.scenes.map((s) => (s.sceneIndex === scene.sceneIndex ? scene : s)),
          }
        : prev
    )

  // AI viết lại MỘT bài theo yêu cầu (1 credit) — kết quả vào ô soạn và lưu gói.
  const [rewriteText, setRewriteText] = useState<Record<string, string>>({})
  const [rewriteBusy, setRewriteBusy] = useState<string | null>(null)
  const [rewriteMsg, setRewriteMsg] = useState<Record<string, string | null>>({})
  const rewritePost = async (channel: PackageChannel) => {
    const instruction = (rewriteText[channel] ?? "").trim()
    if (instruction.length < 3) {
      setRewriteMsg((p) => ({ ...p, [channel]: "Gõ yêu cầu viết lại (ít nhất vài chữ)" }))
      return
    }
    setRewriteBusy(channel)
    setRewriteMsg((p) => ({ ...p, [channel]: null }))
    try {
      const cur = posts[channel]
      const res = await fetch("/api/v1/creative-production/content-rewrites", {
        method: "POST",
        headers: { "Content-Type": "application/json", "idempotency-key": `rewrite-${crypto.randomUUID()}` },
        body: JSON.stringify({
          channel,
          text: cur.text,
          hashtags: parseHashtags(cur.tags),
          instruction,
          product_name: ctx?.productName ?? "",
          topic_title: ctx?.selectedTopic?.title ?? pkg?.topic?.title ?? "",
          ...(ctx?.commercialPassport?.priceRange ? { price_range: ctx.commercialPassport.priceRange } : {}),
        }),
      })
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(b.error?.message || `HTTP ${res.status}`)
      }
      const r = (await res.json()) as { text: string; hashtags: string[]; warnings: string[] }
      const nextPosts = { ...posts, [channel]: { on: true, text: r.text, tags: r.hashtags.join(" ") } }
      setPosts(nextPosts)
      await saveNow({
        posts: CHANNELS.filter((c) => nextPosts[c.id].on).map((c) => ({
          channel: c.id,
          text: nextPosts[c.id].text,
          hashtags: parseHashtags(nextPosts[c.id].tags),
        })),
      })
      setRewriteText((p) => ({ ...p, [channel]: "" }))
      setRewriteMsg((p) => ({
        ...p,
        [channel]: r.warnings.length ? `Đã viết lại. Lưu ý từ cần cân nhắc: ${r.warnings.join(", ")}` : "Đã viết lại và lưu vào gói.",
      }))
    } catch (e) {
      setRewriteMsg((p) => ({ ...p, [channel]: e instanceof Error ? e.message : "Không viết lại được" }))
    } finally {
      setRewriteBusy(null)
    }
  }

  const handleQa = () =>
    run("qa", async () => {
      if (!pkg) return
      loadDraftFrom(await apiJson<CampaignPackageDto>(`/api/v1/creative-production/packages/${pkg.id}/qa`, { method: "POST" }))
    })

  const handleApprove = () =>
    run("approve", async () => {
      if (!pkg) return
      loadDraftFrom(
        await apiJson<CampaignPackageDto>(`/api/v1/creative-production/packages/${pkg.id}/approve`, {
          method: "POST",
          body: JSON.stringify({ acknowledge_warnings: acknowledge }),
        })
      )
    })

  const approved = pkg?.status === "APPROVED"
  const dirty =
    !!pkg &&
    !approved &&
    (JSON.stringify(draftPosts) !== JSON.stringify(pkg.posts) ||
      JSON.stringify([...selectedVariants].sort()) !== JSON.stringify([...pkg.variant_asset_ids].sort()) ||
      JSON.stringify(videoJobIds) !== JSON.stringify(pkg.video_job_ids?.length ? pkg.video_job_ids : pkg.video_job_id ? [pkg.video_job_id] : []) ||
      audioJobId !== pkg.audio_job_id)

  // ── Trạng thái tải / thiếu Master ─────────────────────────────────────────
  if (resolving) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-text-muted">
        <Loader2 size={16} className="animate-spin" /> Đang tải gói chiến dịch...
      </div>
    )
  }

  if (!masterId) {
    return (
      <Card className="w-full max-w-3xl mx-auto p-6 space-y-3">
        <h3 className="text-[15px] font-bold text-text">Cần Master Image đã duyệt trước khi đóng gói</h3>
        <p className="text-[13px] text-text-muted">
          Gói chiến dịch neo vào Master Image đã duyệt (cổng 2). Bạn có thể dùng ngay ảnh gốc từ Khu vực A làm
          Master (không chỉnh sửa ảnh), hoặc tối ưu ảnh trước ở Tải ảnh.
        </p>
        {ctx?.assetId ? (
          <Button onClick={handlePromote} disabled={busy !== null} className="gap-2">
            {busy === "promote" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Skip — Dùng ảnh gốc làm Master (I2)
          </Button>
        ) : (
          <p className="text-[13px] text-danger">Chưa có ảnh sản phẩm — bắt đầu ở Khu vực A.</p>
        )}
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
      </Card>
    )
  }

  if (!pkg) {
    return (
      <Card className="w-full max-w-3xl mx-auto p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <Package size={18} className="text-primary" />
          <h3 className="text-[15px] font-bold text-text">Chặng 07 — Tạo gói chiến dịch</h3>
        </div>
        <p className="text-[13px] text-text-muted">
          Chưa có gói nào cho Master Image này. Dưới đây là những gì đã sản xuất ở Khu vực B–E — bấm tạo gói để đưa
          sẵn vào, sau đó chỉnh, chạy QA và duyệt.
        </p>

        <div className="rounded-xl border border-border bg-surface-alt p-3.5 space-y-3">
          <div className="text-[12px] font-bold text-text">
            Ảnh biến thể theo kịch bản (Khu vực D): {producedScenes.length} ảnh
            {multiRatio ? ` · ${planRatios.length} khung (${planRatios.join(", ")})` : ""}
          </div>
          {producedScenes.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {producedScenes.map((a) => (
                <div key={a.id} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-white">
                  {a.url && <img src={a.url} alt="" className="h-full w-full object-cover" />}
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-bold text-white">
                    Cảnh {String(a.metadata?.scene_index ?? "")}
                    {multiRatio && typeof a.metadata?.ratio === "string" ? ` · ${a.metadata.ratio}` : ""}
                  </span>
                  {a.approval_state !== "APPROVED" && (
                    <span className="absolute bottom-1 left-1 rounded bg-warning-bg px-1 text-[9.5px] text-warning">chưa duyệt</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-text-muted">Chưa có ảnh — sinh ảnh ở Khu vực D.</p>
          )}
          <div className="text-[12px] text-text">
            <span className="font-bold">Video (Khu vực E):</span>{" "}
            {suggestedVideos.length > 0
              ? suggestedVideos
                  .map((v) => `${multiRatio ? `${v.aspect_ratio} · ` : ""}job ${v.id.slice(0, 8)} · ${v.video_approval === "APPROVED" ? "đã duyệt P4" : v.stage === "RENDER_COMPLETED" ? "đã render, chưa duyệt P4" : v.stage}`)
                  .join(" | ")
              : "chưa có video đã render"}
            {multiRatio && suggestedVideos.length < planRatios.length && (
              <span className="ml-1 text-warning">
                — thiếu video khung {planRatios.filter((r) => !suggestedVideos.some((v) => v.aspect_ratio === r)).join(", ")}
              </span>
            )}
          </div>
          <div className="text-[12px] text-text">
            <span className="font-bold">Âm thanh (Khu vực C):</span>{" "}
            {urlAudioJobId ? `job ${urlAudioJobId.slice(0, 8)}` : "chưa có"}
          </div>
          <div className="text-[12px] text-text">
            <span className="font-bold">Bài đăng (Khu vực B):</span>{" "}
            {bDraft && bDraft.posts.length > 0
              ? `${bDraft.posts.length} kênh (${bDraft.posts.map((p) => p.channel).join(", ")}) · tự lưu lúc ${new Date(bDraft.updated_at).toLocaleString("vi-VN")}`
              : "chưa có — viết ở Khu vực B (tự lưu) hoặc soạn trực tiếp sau khi tạo gói"}
            {!(bDraft && bDraft.posts.length > 0) && (
              <button type="button" className="ml-2 font-bold text-primary hover:underline" onClick={() => goRework("b")}>
                Mở Khu vực B →
              </button>
            )}
          </div>
        </div>

        <Button onClick={handleCreate} disabled={busy !== null} className="gap-2">
          {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
          Tạo gói chiến dịch với các tài sản trên
        </Button>
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
      </Card>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Tiêu đề + trạng thái */}
      <Card className="p-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-primary">Khu vực F — Gói chiến dịch</div>
          <h3 className="text-[16px] font-bold text-text">{pkg.name}</h3>
          <p className="text-[12px] text-text-muted">
            Mode {pkg.mode} · Master #{pkg.master_asset_id.slice(0, 8)}
            {pkg.topic ? ` · Chủ đề: ${pkg.topic.title}` : ""}
          </p>
        </div>
        <Badge
          tone={approved ? "success" : pkg.status === "QA_REJECTED" ? "danger" : pkg.status === "QA_NEEDS_REVIEW" ? "warning" : "neutral"}
          className="text-xs px-3 py-1 font-bold"
        >
          {STATUS_LABEL[pkg.status]}
        </Badge>
      </Card>

      {error && (
        <div className="rounded-xl border border-danger bg-danger-bg px-4 py-3 text-[13px] text-danger flex items-start gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* ── Chặng 07 — PACKAGE ── */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="text-[14px] font-bold text-text">Chặng 07 — Chọn tài sản & bài đăng</h4>
          {!approved && (
            <Button size="sm" onClick={handleSave} disabled={!dirty || busy !== null} className="gap-1.5">
              {busy === "save" ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Lưu gói
            </Button>
          )}
        </div>

        {multiRatio && (
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Video theo khung">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">Video theo khung:</span>
            {planRatios.map((r) => {
              const has = videoJobIds.some((id) => ratioOfVideo(id) === r)
              return (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={r === activeRatio}
                  onClick={() => setVideoRatioTab(r)}
                  className={`rounded-lg border px-3 py-1.5 text-[11.5px] font-bold cursor-pointer ${
                    r === activeRatio ? "border-primary bg-primary text-white" : "border-border bg-surface text-text-muted"
                  }`}
                >
                  {r} · {has ? "có video" : "chưa có"}
                </button>
              )
            })}
          </div>
        )}

        <PackageReviewSection
          pkg={pkg}
          approved={approved}
          scenePlan={scenePlan}
          planRef={planRef}
          marketing={marketing}
          selectedVariants={selectedVariants}
          setSelectedVariants={setSelectedVariants}
          videoJobs={multiRatio ? videoJobs.filter((v) => v.aspect_ratio === activeRatio) : videoJobs}
          videoJobId={activeVideoId}
          setVideoJobId={setActiveVideo}
          audioJobId={audioJobId}
          setAudioJobId={setAudioJobId}
          urlVideoJobId={urlVideoJobId}
          urlAudioJobId={urlAudioJobId}
          onAssetsChanged={() => setAssetsNonce((n) => n + 1)}
          onPackageRefresh={refreshPackage}
          onRework={goRework}
          masterAssetId={masterId}
          productName={ctx?.productName ?? ""}
          colors={ctx?.commercialPassport?.colors ?? []}
          topicTitle={ctx?.selectedTopic?.title ?? pkg.topic?.title ?? ""}
          angleCategory={ctx?.selectedTopic?.angleCategory}
          mode={(ctx?.mode ?? "CREATIVE") as "CREATIVE" | "AUTHENTIC"}
          onSceneRevised={onSceneRevised}
          onApply={applyRevision}
        />

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold text-text">Bài đăng theo kênh (lưu từ Khu vực B hoặc soạn tại đây)</div>
            {!approved && (
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => goRework("b")}>
                <RefreshCw size={11} /> Viết lại ở Khu vực B
              </Button>
            )}
          </div>
          {!approved &&
            bDraft &&
            bDraft.posts.length > 0 &&
            JSON.stringify(bDraft.posts) !== JSON.stringify(draftPosts) && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[12px]">
                <span>
                  Có bài từ Khu vực B tự lưu lúc {new Date(bDraft.updated_at).toLocaleString("vi-VN")} khác với bài trong gói.
                </span>
                <button type="button" className="font-bold text-primary hover:underline" onClick={applyBDraft}>
                  ↻ Dùng bài của Khu vực B
                </button>
              </div>
            )}
          {CHANNELS.map((c) => {
            const p = posts[c.id]
            return (
              <div key={c.id} className="rounded-lg border border-border p-3 space-y-2">
                <label className="flex items-center gap-2 text-[12px] font-bold">
                  <input
                    type="checkbox"
                    checked={p.on}
                    disabled={approved}
                    onChange={(e) => setPosts((prev) => ({ ...prev, [c.id]: { ...prev[c.id], on: e.target.checked } }))}
                  />
                  {c.label}
                </label>
                {p.on && (
                  <>
                    <textarea
                      value={p.text}
                      disabled={approved}
                      onChange={(e) => setPosts((prev) => ({ ...prev, [c.id]: { ...prev[c.id], text: e.target.value } }))}
                      rows={5}
                      className="w-full rounded border border-border px-2 py-1.5 text-xs"
                      placeholder={`Nội dung bài ${c.label}`}
                    />
                    <input
                      value={p.tags}
                      disabled={approved}
                      onChange={(e) => setPosts((prev) => ({ ...prev, [c.id]: { ...prev[c.id], tags: e.target.value } }))}
                      className="w-full rounded border border-border px-2 py-1.5 text-xs"
                      placeholder="#hashtag cách nhau bằng dấu cách"
                    />
                    <div className="text-[10.5px] text-text-muted">{p.text.length} ký tự</div>
                    {!approved && (
                      <div className="flex flex-col gap-1.5 rounded border border-dashed border-border p-2">
                        <div className="flex gap-2">
                          <input
                            value={rewriteText[c.id] ?? ""}
                            disabled={rewriteBusy !== null}
                            onChange={(e) => setRewriteText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                            placeholder="Yêu cầu AI viết lại, vd: vui hơn, ngắn gọn, nhấn mạnh giao nhanh trong ngày"
                            className="flex-1 rounded border border-border px-2 py-1 text-xs"
                          />
                          <Button
                            size="sm"
                            className="h-7 text-[11px] gap-1 shrink-0"
                            disabled={rewriteBusy !== null}
                            onClick={() => void rewritePost(c.id)}
                          >
                            {rewriteBusy === c.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                            AI viết lại (1 credit)
                          </Button>
                        </div>
                        {rewriteMsg[c.id] && <div className="text-[11px] text-text-muted">{rewriteMsg[c.id]}</div>}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </section>
      </Card>

      {/* ── Chặng 08 — QA ── */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[14px] font-bold text-text flex items-center gap-2">
            <ShieldCheck size={16} /> Chặng 08 — Kiểm định QA (chạy phía máy chủ)
          </h4>
          {!approved && (
            <Button size="sm" variant="outline" onClick={handleQa} disabled={dirty || busy !== null} className="gap-1.5">
              {busy === "qa" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              {pkg.qa_report ? "Chạy lại QA" : "Chạy QA"}
            </Button>
          )}
        </div>
        {dirty && <p className="text-[12px] text-warning">Có thay đổi chưa lưu — lưu gói trước khi chạy QA.</p>}
        {pkg.qa_report ? (
          <PackageQACard report={pkg.qa_report} />
        ) : (
          <p className="text-[12px] text-text-muted">Chưa chạy QA cho phiên bản gói hiện tại.</p>
        )}
      </Card>

      {/* ── Chặng 09 — APPROVE ── */}
      <Card className="p-5 space-y-3">
        <h4 className="text-[14px] font-bold text-text">Chặng 09 — Chủ shop duyệt chốt</h4>
        {approved ? (
          <p className="text-[13px] text-success flex items-center gap-2">
            <CheckCircle2 size={15} /> Đã duyệt lúc {pkg.approved_at ? new Date(pkg.approved_at).toLocaleString("vi-VN") : ""} — đã ghi nhật ký kiểm toán.
          </p>
        ) : (
          <>
            {pkg.status === "QA_NEEDS_REVIEW" && (
              <label className="flex items-start gap-2 text-[12.5px]">
                <input type="checkbox" checked={acknowledge} onChange={(e) => setAcknowledge(e.target.checked)} />
                Tôi đã xem các cảnh báo QA ở trên và chấp nhận đăng gói này.
              </label>
            )}
            <Button
              onClick={handleApprove}
              disabled={
                busy !== null ||
                dirty ||
                !(pkg.status === "QA_PASSED" || (pkg.status === "QA_NEEDS_REVIEW" && acknowledge))
              }
              className="gap-2"
            >
              {busy === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Duyệt chốt gói chiến dịch (J5)
            </Button>
            <p className="text-[11.5px] text-text-muted">
              Chỉ duyệt được sau khi QA đạt, hoặc QA cần xem lại và bạn đã xác nhận. QA từ chối thì phải sửa rồi chạy lại.
            </p>
          </>
        )}
      </Card>

      {approved && <PackageDownstreamCard pkg={pkg} onUpdated={loadDraftFrom} />}
    </div>
  )
}
