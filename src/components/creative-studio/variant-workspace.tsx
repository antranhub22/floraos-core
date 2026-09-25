"use client"
/**
 * VariantWorkspace — Khu vực D (Chặng 06c): M04b Biến thể Marketing
 *
 * Cho phép tạo biến thể bối cảnh studio hoặc AI visual storytelling.
 * Tích hợp SourcePicker với lựa chọn:
 *   1. Dùng Master Image đã duyệt từ Tab 1
 *   2. Skip — Dùng nguyên ảnh gốc (duyệt nhanh 1-chạm tạo Master)
 */

import { useState, useEffect, useContext, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Download,
  RotateCcw,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  CheckCircle2,
  Camera,
} from "lucide-react"
import { CreativeStudioContext } from "@/app/(app)/creative-studio/page"
import type { PublishRatio } from "@/modules/creative-production/domain/publishing-rules"
import {
  alternateDirection,
  directionFromRecord,
  directionRequestFields,
  renderOptionsPayload,
  SIMILAR_CANDIDATE_COUNT,
  similarDirection,
  variantTotalCostCredit,
  variantUnitCostCredit,
  type VariantRenderOptions,
} from "@/modules/media/domain/variant-candidates"
import {
  VARIANT_STYLE_LABELS,
  type VariantDirection,
} from "@/modules/media/domain/variant-direction-rules"
import { FlowSteps } from "@/components/flow/flow-steps"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StageGateApprovalBar } from "@/components/ui/stage-gate-approval-bar"
import { SourcePicker } from "./source-picker"
import { promoteToMaster, resolveApprovedMaster } from "./package-client"
import {
  findScenePlan,
  loadRulePlan,
  RULE_PLAN_REF,
  writeScenePlan,
  type LoadedScenePlan,
  type ScenePlanContext,
  type ScenePlanScene,
} from "./scene-plan-client"
import { FLOW_M04B } from "./types"
import type { UseCreativeStudioReturn } from "./use-creative-studio-data"

// ============================================================
// Phân cảnh Narrative Arc — helpers (23/09/2026)
// ============================================================

type SceneMeta = {
  assetId: string
  jobId: string
  /** Subject Integrity ĐO bởi worker (0..1), `null` = chưa đo. */
  integrity: number | null
  engine: "local_studio" | "cloud_provider"
  cloudFallback: boolean
  /** Vì sao hậu cảnh Stability không dùng được (thiếu khoá, hết credit, …). */
  cloudFallbackReason?: string | null
  approved?: boolean
  /** Bản PNG tách nền mà cùng job luôn ghi kèm. */
  transparentUrl?: string | null
  /** Phiên bản kịch bản lúc sinh ảnh (Đợt 3) — nhỏ hơn bản hiện tại = ảnh lỗi thời. */
  planRevision?: number | null
  /** Tỉ lệ khung ảnh đã sinh. */
  ratio?: string | null
  /** Chỉ đạo worker ĐÃ dùng (Đợt 2) — cho "Sinh lại giống thế này". */
  direction?: VariantDirection | null
  /** Chấm kỹ thuật tự động 0..100 (Đợt 3) — heuristic, không thay mắt người. */
  aestheticScore?: number | null
}

/** Một phương án của cảnh (Đợt 2, 25/09/2026) — mỗi phương án là một job. */
type SceneCandidate = SceneMeta & { url: string }

function metaOf(c: SceneCandidate): SceneMeta {
  const { url, ...meta } = c
  void url
  return meta
}

/** Tối đa bao nhiêu phương án gần nhất hiện trên thẻ cảnh. */
const MAX_CANDIDATES_SHOWN = 8

const SHOT_LABEL: Record<string, string> = { close: "Cận", medium: "Trung", wide: "Toàn" }
const LIGHT_LABEL: Record<string, string> = { left: "sáng trái", right: "sáng phải", above: "sáng trên", front: "sáng trước" }

function describeDirection(d: VariantDirection | null | undefined): string {
  if (!d) return ""
  const parts = [SHOT_LABEL[d.composition.shot] ?? d.composition.shot, LIGHT_LABEL[d.lighting.direction] ?? d.lighting.direction]
  if (d.style) parts.push(VARIANT_STYLE_LABELS[d.style])
  return parts.join(" · ")
}

type VariantJobPoll = {
  status: string
  result: string | null
  error: string | null
  source: {
    engine: "local_studio" | "cloud_provider"
    cloud_fallback: boolean
    cloud_fallback_reason?: string | null
    direction?: Record<string, unknown> | null
  }
  subject_integrity: { subject_pixel_identity: number } | null
  quality_report?: { aesthetic: { score: number } | null } | null
  variants: Array<{ asset_id: string; variant_key: string; url: string }>
}

function formatIntegrity(value: number | null, hasGenerated: boolean): string {
  if (!hasGenerated) return "Chưa sinh — chưa đo"
  if (value === null) return "Chưa có số đo"
  const pct = (value * 100).toFixed(2)
  if (value >= 0.999) return `Lõi trùng khít ${pct}% (SAFE)`
  if (value >= 0.99) return `Lõi trùng khít ${pct}% (WARNING)`
  return `Lõi trùng khít ${pct}% (REJECTED)`
}

const BEAT_COLORS: Record<string, string> = {
  SETUP: "bg-blue-100 text-blue-800 border-blue-200",
  RISING: "bg-purple-100 text-purple-800 border-purple-200",
  CLIMAX: "bg-rose-100 text-rose-800 border-rose-200",
  RESOLUTION: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CTA: "bg-amber-100 text-amber-800 border-amber-200",
}

/** Cảnh dùng hậu cảnh Stability khi người dùng bật: CREATIVE và không phải phông trắng. */
function sceneUsesCloud(scene: ScenePlanScene, mode: string, engine: string): boolean {
  return engine === "cloud_provider" && mode === "CREATIVE" && scene.localBackdrop !== "studio_white"
}

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 6 * 60 * 1000

async function waitForVariantJob(jobId: string): Promise<VariantJobPoll> {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    const res = await fetch(`/api/v1/media/variants/${encodeURIComponent(jobId)}`)
    if (res.ok) {
      const detail = (await res.json()) as VariantJobPoll
      if (detail.status === "COMPLETED" || detail.status === "FAILED" || detail.status === "CANCELLED") {
        return detail
      }
    } else if (res.status !== 404 && res.status < 500) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      throw new Error(err.error?.message || `Không đọc được trạng thái job (HTTP ${res.status})`)
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
  }
  throw new Error("Quá thời gian chờ worker — kiểm tra worker media (npm run worker:media) đang chạy.")
}

interface VariantWorkspaceProps {
  data: UseCreativeStudioReturn
}

export function VariantWorkspace({ data }: VariantWorkspaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const context = useContext(CreativeStudioContext)
  const [showManualSourcePicker, setShowManualSourcePicker] = useState(false)
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(2)
  // Ảnh + số đo THẬT của từng phân cảnh (23/09/2026). Mỗi cảnh là một job
  // `POST /media/variants` riêng (qua `enqueueJob`), đọc kết quả bằng
  // `GET /media/variants/:job_id` — không còn ảnh Data URL phía trình duyệt,
  // không còn số "99.9%" gõ tay.
  const [sceneImageMap, setSceneImageMap] = useState<Record<number, string>>({})
  const [sceneMeta, setSceneMeta] = useState<Record<number, SceneMeta>>({})
  // Các phương án của từng cảnh (Đợt 2) — mới nhất trước; phương án đang chọn = sceneMeta.
  const [sceneCandidates, setSceneCandidates] = useState<Record<number, SceneCandidate[]>>({})
  const [sceneErrors, setSceneErrors] = useState<Record<number, string>>({})
  const [generatingSceneIndex, setGeneratingSceneIndex] = useState<number | null>(null)
  const [generatingAllScenes, setGeneratingAllScenes] = useState<boolean>(false)
  // Cảnh 2–3 (hậu cảnh lifestyle/cận cảnh): mặc định Stability qua hàng đợi job
  // (chốt 23/09/2026); nhà cung cấp lỗi thì worker tự lùi về phông cục bộ.
  // Cảnh 1 (studio trắng) và Cảnh 4 (tách nền) luôn chạy cục bộ — không cần hậu cảnh AI.
  const [sceneEngine, setSceneEngine] = useState<"cloud_provider" | "local_studio">("cloud_provider")
  // Tuỳ chọn dựng ảnh (Đợt 3, 25/09/2026) — áp cho các lượt sinh tiếp theo; giá hiện trên nút.
  const [renderOpts, setRenderOpts] = useState<VariantRenderOptions>({
    quality: "standard",
    upscale: "none",
    composeMode: "paste",
  })

  // Kịch bản bối cảnh của CHỦ ĐỀ (quyết định PO 24/09/2026): số cảnh và bối
  // cảnh từng cảnh lấy từ kịch bản AI viết qua job `creative.scene_plan`
  // (CREATIVE 5 cảnh, AUTHENTIC 3). Thay khuôn 4 cảnh viết cứng trước đây.
  const [loadedPlan, setLoadedPlan] = useState<LoadedScenePlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planWriting, setPlanWriting] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [planFailedBefore, setPlanFailedBefore] = useState(false)

  const navigateToArea = (area: "a" | "b" | "c" | "d" | "e" | "f") => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("area", area)
    router.push(`/creative-studio?${params.toString()}` as never)
  }

  const {
    phase,
    setPhase,
    approvedMasters,
    selectedMasterId,
    setSelectedMasterId,
    assets,
    promoteOriginalToMaster,
    loadingMasters,
    loadingAssets,
    canApprove,
    variantRatio,
    setVariantRatio,
    watermarkEnabled,
    setWatermarkEnabled,
    jobPhase,
    jobStatus,
    setJobStatus,
    judgmentB,
    variantIntegrity,
    canApproveVariantCap,
    errorMsg,
    setErrorMsg,
  } = data

  // Master của ĐÚNG ảnh Khu vực A: chính nó nếu đã là MASTER đã duyệt, hoặc
  // bản MASTER con tạo qua "Dùng ảnh gốc" (24/09/2026). Không lấy Master đầu
  // tiên của cả tổ chức — đó có thể là ảnh của sản phẩm khác.
  const [promotingMaster, setPromotingMaster] = useState(false)
  const [masterError, setMasterError] = useState<string | null>(null)
  useEffect(() => {
    if (!context?.assetId || selectedMasterId) return
    let cancelled = false
    resolveApprovedMaster(context.assetId)
      .then((id) => {
        if (!cancelled && id) setSelectedMasterId(id)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [context?.assetId, selectedMasterId, setSelectedMasterId])

  const activeMasterId = selectedMasterId || (context?.assetId ? "" : approvedMasters[0]?.id || "")

  /**
   * Bảo đảm có Master đã duyệt trước khi dựng biến thể. Ảnh từ Khu vực A còn
   * là ORIGINAL thì nâng thành Master ("Dùng ảnh gốc", I2 — máy chủ kiểm quyền)
   * thay vì báo lỗi bắt người dùng tự tìm nút.
   */
  const ensureMaster = async (): Promise<string | null> => {
    if (activeMasterId) return activeMasterId
    if (!context?.assetId) return null
    setPromotingMaster(true)
    setMasterError(null)
    try {
      const existing = await resolveApprovedMaster(context.assetId)
      const id = existing ?? (await promoteToMaster(context.assetId))
      setSelectedMasterId(id)
      return id
    } catch (e) {
      setMasterError(
        e instanceof Error
          ? `Không nâng được ảnh gốc thành Master: ${e.message}`
          : "Không nâng được ảnh gốc thành Master"
      )
      return null
    } finally {
      setPromotingMaster(false)
    }
  }

  const planCtx: ScenePlanContext | null = useMemo(
    () =>
      context
        ? {
            mode: context.mode,
            productName: context.productName,
            productId: context.productId,
            assetId: context.assetId,
            selectedTopic: context.selectedTopic,
            commercialPassport: context.commercialPassport,
            platforms: context.platforms,
            outputs: context.outputs,
          }
        : null,
    [context]
  )
  const urlPlanId = searchParams?.get("scenePlanId") ?? null

  const rememberPlan = (loaded: LoadedScenePlan) => {
    setLoadedPlan(loaded)
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("scenePlanId", loaded.jobId ?? RULE_PLAN_REF)
    router.replace(`/creative-studio?${params.toString()}` as never)
  }

  // Tra kịch bản đã có (không tạo job, không trừ credit).
  useEffect(() => {
    if (!planCtx) return
    let cancelled = false
    setPlanLoading(true)
    setPlanError(null)
    findScenePlan(planCtx, urlPlanId)
      .then(({ loaded, failedJob }) => {
        if (cancelled) return
        setLoadedPlan(loaded)
        setPlanFailedBefore(failedJob)
      })
      .catch((e) => {
        if (!cancelled) setPlanError(e instanceof Error ? e.message : "Không tra được kịch bản bối cảnh")
      })
      .finally(() => {
        if (!cancelled) setPlanLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planCtx?.assetId, planCtx?.selectedTopic?.id, planCtx?.mode, urlPlanId])

  const handleWritePlan = async (fresh: boolean) => {
    if (!planCtx) return
    setPlanWriting(true)
    setPlanError(null)
    try {
      const loaded = await writeScenePlan(planCtx, fresh || planFailedBefore)
      setPlanFailedBefore(false)
      setSceneImageMap({})
      setSceneMeta({})
      rememberPlan(loaded)
    } catch (e) {
      setPlanFailedBefore(true)
      setPlanError(e instanceof Error ? e.message : "AI chưa viết được kịch bản bối cảnh")
    } finally {
      setPlanWriting(false)
    }
  }

  const handleUseRulePlan = () => {
    if (!planCtx) return
    setPlanError(null)
    setSceneImageMap({})
    setSceneMeta({})
    rememberPlan(loadRulePlan(planCtx))
  }

  const scenePlan = loadedPlan?.plan ?? null

  // Mở từ Chặng 07 "Sinh lại cảnh N" (`focusScene`, 24/09/2026): vào thẳng bảng
  // phân cảnh, chọn đúng cảnh cần làm lại.
  const focusScene = Number(searchParams?.get("focusScene") ?? "") || null
  useEffect(() => {
    if (!focusScene || !scenePlan) return
    if (!scenePlan.scenes.some((sc) => sc.sceneIndex === focusScene)) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mở đúng cảnh theo URL
    setSelectedSceneIndex(focusScene)
    setPhase("result-b")
  }, [focusScene, scenePlan, setPhase])
  const planRef = loadedPlan?.ref ?? null

  // Đợt 3 (24/09/2026): khung ảnh theo NỀN TẢNG ĐĂNG của kịch bản sản xuất tổng
  // (mặc định 9:16) — trước đây mặc định 1:1 nên video dọc bị cắt / có viền.
  // PO 24/09/2026 tối: mỗi khung trong phạm vi sản xuất một bộ ảnh riêng —
  // bảng phân cảnh có tab theo khung; `variantRatio` là khung đang xem/sinh.
  const planRatio = scenePlan?.publishing?.aspectRatio ?? null
  const planRatiosKey = (scenePlan?.publishing?.ratios?.length ? scenePlan.publishing.ratios : planRatio ? [planRatio] : []).join(",")
  const planRatios: PublishRatio[] = useMemo(
    () => (planRatiosKey ? (planRatiosKey.split(",") as PublishRatio[]) : []),
    [planRatiosKey]
  )
  const focusRatio = searchParams?.get("focusRatio") ?? null
  useEffect(() => {
    if (planRatios.length === 0) return
    const want = planRatios.find((r) => r === focusRatio) ?? planRatios[0]!
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đặt khung theo kịch bản đã tra được
    setVariantRatio(want)
    // Chỉ đặt lại khi kịch bản / URL đổi, không ghi đè khi người dùng tự chuyển tab khung.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planRatiosKey, focusRatio])
  const activeRatioRef = useRef(variantRatio)
  useEffect(() => {
    activeRatioRef.current = variantRatio
  }, [variantRatio])
  // Số cảnh đã sinh theo từng khung (tab khung hiện "3/5").
  const [ratioCounts, setRatioCounts] = useState<Record<string, number>>({})
  const [scenesReload, setScenesReload] = useState(0)
  const viewRatio = variantRatio || planRatio || ""
  const planScenes: readonly ScenePlanScene[] = useMemo(() => scenePlan?.scenes ?? [], [scenePlan])

  // Nạp các phân cảnh ĐÃ sinh của đúng Master + ĐÚNG kịch bản đang mở.
  useEffect(() => {
    if (!activeMasterId || !planRef || !viewRatio) return
    let cancelled = false
    async function loadExistingScenes() {
      try {
        const res = await fetch(
          `/api/v1/assets?kind=MARKETING&parent_asset_id=${encodeURIComponent(activeMasterId)}&limit=100`
        )
        if (!res.ok) return
        const body = (await res.json()) as {
          data?: Array<{
            id: string
            url?: string | null
            identity_score?: number | null
            approval_state?: string
            metadata?: Record<string, unknown> | null
          }>
        }
        const urls: Record<number, string> = {}
        const metas: Record<number, SceneMeta> = {}
        const candidates: Record<number, SceneCandidate[]> = {}
        const jobsSeen = new Set<string>()
        const pngByJob: Record<string, string> = {}
        const seenByRatio: Record<string, Set<number>> = {}
        const primary = planRatio ?? "9:16"
        // `data` sắp theo created_at giảm dần — bản mới nhất của mỗi cảnh thắng.
        for (const item of body.data ?? []) {
          const meta = item.metadata ?? {}
          const idx = typeof meta.scene_index === "number" ? meta.scene_index : null
          if (!idx || !item.url || meta.scene_plan_id !== planRef) continue
          const jobId = typeof meta.job_id === "string" ? meta.job_id : ""
          if (meta.variant_key === "transparent") {
            if (jobId) pngByJob[jobId] = item.url
            continue
          }
          if (meta.variant_key !== "styled" && meta.variant_key !== "branded") continue
          // Ảnh cũ chưa ghi khung tính là khung chính của kịch bản.
          const itemRatio = typeof meta.ratio === "string" ? meta.ratio : primary
          ;(seenByRatio[itemRatio] ??= new Set()).add(idx)
          if (itemRatio !== viewRatio) continue
          // Mỗi job (phương án) một ảnh — bản đóng dấu và bản bối cảnh cùng job chỉ tính một.
          if (jobId && jobsSeen.has(jobId)) continue
          if (jobId) jobsSeen.add(jobId)
          const candidate: SceneCandidate = {
            url: item.url,
            assetId: item.id,
            jobId,
            integrity: typeof item.identity_score === "number" ? item.identity_score : null,
            engine: meta.engine === "cloud_provider" ? "cloud_provider" : "local_studio",
            cloudFallback: meta.cloud_fallback === true,
            cloudFallbackReason: typeof meta.cloud_fallback_reason === "string" ? meta.cloud_fallback_reason : null,
            approved: item.approval_state === "APPROVED",
            planRevision: typeof meta.scene_plan_revision === "number" ? meta.scene_plan_revision : null,
            ratio: typeof meta.ratio === "string" ? meta.ratio : null,
            direction: directionFromRecord(meta),
            aestheticScore:
              meta.aesthetic && typeof meta.aesthetic === "object" && typeof (meta.aesthetic as { score?: unknown }).score === "number"
                ? ((meta.aesthetic as { score: number }).score)
                : null,
          }
          const list = (candidates[idx] ??= [])
          if (list.length < MAX_CANDIDATES_SHOWN) list.push(candidate)
          if (urls[idx]) continue
          urls[idx] = item.url
          metas[idx] = metaOf(candidate)
        }
        if (cancelled) return
        for (const m of Object.values(metas)) m.transparentUrl = pngByJob[m.jobId] ?? null
        for (const list of Object.values(candidates)) for (const c of list) c.transparentUrl = pngByJob[c.jobId] ?? null
        setSceneImageMap(urls)
        setSceneMeta(metas)
        setSceneCandidates(candidates)
        setRatioCounts(Object.fromEntries(Object.entries(seenByRatio).map(([r, set]) => [r, set.size])))
      } catch (e) {
        console.error("Lỗi nạp phân cảnh đã sinh:", e)
      }
    }
    loadExistingScenes()
    return () => {
      cancelled = true
    }
  }, [activeMasterId, planRef, viewRatio, planRatio, scenesReload])

  // Sinh MỘT phân cảnh qua hàng đợi job rồi chờ kết quả thật.
  const handleGenerateSingleScene = async (
    targetIndex: number,
    ratioArg?: string,
    opts?: { direction?: VariantDirection; count?: number }
  ): Promise<void> => {
    const ratio = ratioArg || variantRatio || "1:1"
    // Sinh cho khung đang xem thì cập nhật bảng ngay; khung khác chỉ tăng bộ đếm.
    const isActive = () => ratio === activeRatioRef.current
    const scene = planScenes.find((s) => s.sceneIndex === targetIndex)
    if (!scene || !scenePlan || !planRef) return
    const masterForScene = await ensureMaster()
    if (!masterForScene) {
      setSceneErrors((prev) => ({
        ...prev,
        [targetIndex]:
          masterError ?? "Chưa có Master Image đã duyệt và không có ảnh gốc từ Khu vực A để dùng.",
      }))
      return
    }

    const useCloud = sceneUsesCloud(scene, scenePlan.mode, sceneEngine)
    setGeneratingSceneIndex(targetIndex)
    setSceneErrors((prev) => {
      const next = { ...prev }
      delete next[targetIndex]
      return next
    })
    try {
      const res = await fetch("/api/v1/media/variants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": `scene-${masterForScene}-${targetIndex}-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          master_asset_id: masterForScene,
          engine: useCloud ? "cloud_provider" : "local_studio",
          preset: scene.localBackdrop,
          ratio,
          watermark: watermarkEnabled,
          scene_index: targetIndex,
          scene_plan_id: planRef,
          scene_plan_revision: scenePlan?.revision ?? 1,
          ...(useCloud ? { provider_key: "stability", scene_prompt: scene.backgroundPrompt } : {}),
          // Đợt 2 (25/09/2026): chỉ đạo tường minh (Sinh lại giống / Thử hướng khác)
          // và số phương án. Không có thì máy chủ lấy từ kịch bản như Đợt 1.
          ...(opts?.direction ? directionRequestFields(opts.direction) : {}),
          ...(opts?.count && opts.count > 1 ? { variant_count: opts.count } : {}),
          ...renderOptionsPayload(useCloud ? renderOpts : { ...renderOpts, quality: "standard" }),
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(err.error?.message || `Lỗi API HTTP ${res.status}`)
      }
      const created = (await res.json()) as { job_id: string; candidates?: Array<{ job_id: string }> }
      const jobIds = created.candidates?.map((c) => c.job_id) ?? [created.job_id]

      // Mỗi phương án là một job riêng — chờ song song, phương án hỏng không kéo đổ phương án khác.
      const settled = await Promise.allSettled(jobIds.map((id) => waitForVariantJob(id)))
      const made: SceneCandidate[] = []
      const failures: string[] = []
      settled.forEach((r, i) => {
        const jobId = jobIds[i]!
        if (r.status === "rejected") {
          failures.push(r.reason instanceof Error ? r.reason.message : "Không đọc được job")
          return
        }
        const detail = r.value
        if (detail.status !== "COMPLETED") {
          failures.push(detail.error || "Worker không dựng được phân cảnh này")
          return
        }
        if (detail.result === "REJECTED") {
          const measured = detail.subject_integrity?.subject_pixel_identity
          failures.push(
            `Cổng Subject Integrity từ chối${
              typeof measured === "number" ? ` (lõi trùng khít ${(measured * 100).toFixed(2)}%, cần ≥ 99%)` : ""
            }: lõi bó hoa bị thay đổi — không biến thể nào được ghi vào kho.`
          )
          return
        }
        const wantKeys = watermarkEnabled ? ["branded", "styled"] : ["styled"]
        const variant =
          wantKeys.map((k) => detail.variants.find((v) => v.variant_key === k)).find(Boolean) ??
          detail.variants[0]
        if (!variant) {
          failures.push("Job hoàn tất nhưng không có ảnh nào được ghi.")
          return
        }
        made.push({
          url: variant.url,
          assetId: variant.asset_id,
          jobId,
          integrity: detail.subject_integrity?.subject_pixel_identity ?? null,
          engine: detail.source.engine,
          cloudFallback: detail.source.cloud_fallback,
          cloudFallbackReason: detail.source.cloud_fallback_reason ?? null,
          transparentUrl: detail.variants.find((v) => v.variant_key === "transparent")?.url ?? null,
          planRevision: scenePlan?.revision ?? null,
          ratio,
          direction: detail.source.direction ? directionFromRecord(detail.source.direction) : null,
          aestheticScore: detail.quality_report?.aesthetic?.score ?? null,
        })
      })
      if (made.length === 0) throw new Error(failures[0] ?? "Không sinh được phân cảnh")

      if (!isActive()) {
        setScenesReload((n) => n + 1)
        return
      }
      const [chosen] = made
      const { url: chosenUrl, ...chosenMeta } = chosen!
      setSceneImageMap((prev) => ({ ...prev, [targetIndex]: chosenUrl }))
      setSceneMeta((prev) => ({ ...prev, [targetIndex]: chosenMeta }))
      setSceneCandidates((prev) => ({
        ...prev,
        [targetIndex]: [...made, ...(prev[targetIndex] ?? [])].slice(0, MAX_CANDIDATES_SHOWN),
      }))
      if (failures.length > 0) {
        setSceneErrors((prev) => ({
          ...prev,
          [targetIndex]: `${failures.length}/${jobIds.length} phương án không dựng được: ${failures[0]}`,
        }))
      }
      setSelectedSceneIndex(targetIndex)
    } catch (err) {
      setSceneErrors((prev) => ({
        ...prev,
        [targetIndex]: err instanceof Error ? err.message : "Không sinh được phân cảnh",
      }))
    } finally {
      setGeneratingSceneIndex(null)
    }
  }

  // Duyệt MỘT phân cảnh (I5, trần cứng) — cùng endpoint duyệt biến thể M04b.
  const [approvingSceneIndex, setApprovingSceneIndex] = useState<number | null>(null)
  const handleApproveScene = async (targetIndex: number) => {
    const meta = sceneMeta[targetIndex]
    if (!meta?.jobId || !meta.assetId) return
    setApprovingSceneIndex(targetIndex)
    try {
      const res = await fetch(`/api/v1/media/variants/${encodeURIComponent(meta.jobId)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: meta.assetId }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(err.error?.message || `Không duyệt được (HTTP ${res.status})`)
      }
      setSceneMeta((prev) => ({ ...prev, [targetIndex]: { ...meta, approved: true } }))
      setSceneCandidates((prev) => ({
        ...prev,
        [targetIndex]: (prev[targetIndex] ?? []).map((c) => (c.jobId === meta.jobId ? { ...c, approved: true } : c)),
      }))
    } catch (err) {
      setSceneErrors((prev) => ({
        ...prev,
        [targetIndex]: err instanceof Error ? err.message : "Không duyệt được phân cảnh",
      }))
    } finally {
      setApprovingSceneIndex(null)
    }
  }

  // Chọn một phương án làm ảnh của cảnh (Đợt 2) — duyệt I5 áp lên phương án đang chọn.
  const handleSelectCandidate = (targetIndex: number, candidate: SceneCandidate) => {
    const { url, ...meta } = candidate
    setSceneImageMap((prev) => ({ ...prev, [targetIndex]: url }))
    setSceneMeta((prev) => ({ ...prev, [targetIndex]: meta }))
  }

  // Sinh trọn bộ phân cảnh của kịch bản — tuần tự, mỗi cảnh một job (một lượt trừ credit).
  const handleGenerateAllScenes = async () => {
    setGeneratingAllScenes(true)
    try {
      for (const idx of planScenes.map((sc) => sc.sceneIndex)) {
        await handleGenerateSingleScene(idx)
      }
    } finally {
      setGeneratingAllScenes(false)
    }
  }

  // Sinh đủ mọi khung trong phạm vi (mỗi khung × mỗi cảnh một job) — PO 24/09/2026.
  const handleGenerateAllRatios = async () => {
    setGeneratingAllScenes(true)
    try {
      for (const r of planRatios) {
        for (const idx of planScenes.map((sc) => sc.sceneIndex)) {
          await handleGenerateSingleScene(idx, r)
        }
      }
    } finally {
      setGeneratingAllScenes(false)
      setScenesReload((n) => n + 1)
    }
  }

  // Khung phân cảnh cho màn kết quả — CHỈ ảnh thật đã sinh cho đúng cảnh của
  // đúng kịch bản; cảnh chưa sinh để trống và ghi "Chưa sinh".
  const narrativeResultScenes = useMemo(() => {
    return planScenes.map((scene) => {
      const meta = sceneMeta[scene.sceneIndex]
      const url = sceneImageMap[scene.sceneIndex] || ""
      const hasGenerated = Boolean(url)
      return {
        sceneIndex: scene.sceneIndex,
        beat: scene.beat,
        beatColor: BEAT_COLORS[scene.beat] ?? "",
        title: scene.title,
        setting: scene.setting,
        lighting: scene.lighting,
        palette: scene.palette,
        purpose: scene.purpose,
        imageUrl: url,
        transparentUrl: meta?.transparentUrl ?? null,
        isOriginal: false,
        tag: !hasGenerated
          ? "Chưa sinh"
          : scenePlan && meta?.planRevision != null && meta.planRevision < scenePlan.revision
          ? "Kịch bản đã sửa — nên sinh lại"
          : viewRatio && meta?.ratio && meta.ratio !== viewRatio
          ? `Khung ${meta.ratio} ≠ ${viewRatio} — nên sinh lại`
          : meta?.engine === "cloud_provider" && !meta.cloudFallback
          ? "Hậu cảnh Stability"
          : meta?.cloudFallback
          ? "Studio cục bộ (Stability lỗi)"
          : "Studio cục bộ",
        ratio: variantRatio || "1:1",
        integrityText: formatIntegrity(meta?.integrity ?? null, hasGenerated),
        hasGenerated,
        usesCloud: scenePlan ? sceneUsesCloud(scene, scenePlan.mode, sceneEngine) : false,
        approved: meta?.approved === true,
        error: sceneErrors[scene.sceneIndex] ?? null,
        fallbackReason: meta?.cloudFallback ? (meta.cloudFallbackReason ?? "không rõ lý do") : null,
      }
    })
  }, [planScenes, scenePlan, sceneEngine, sceneImageMap, sceneMeta, sceneErrors, variantRatio, viewRatio])

  const sceneCount = planScenes.length
  const sceneCreditTotal = narrativeResultScenes.reduce(
    (sum, sc) => sum + variantUnitCostCredit(sc.usesCloud ? "cloud_provider" : "local_studio", renderOpts),
    0
  )
  const cloudAvailable = scenePlan?.mode === "CREATIVE"
  const generatedSceneCount = narrativeResultScenes.filter((s) => s.hasGenerated).length
  const measuredIntegrities = narrativeResultScenes
    .map((s) => sceneMeta[s.sceneIndex]?.integrity)
    .filter((v): v is number => typeof v === "number")
  const minSceneIntegrity = measuredIntegrities.length > 0 ? Math.min(...measuredIntegrities) : null

  // ============================================================
  // PHASE: RUNNING B
  // ============================================================
  if (phase === "running-b") {
    return (
      <div className="flex flex-1 flex-col items-center gap-5 w-full max-w-xl mx-auto py-8">
        <div className="text-center">
          <div className="text-[17px] font-extrabold text-text">Đang sinh biến thể M04b</div>
          <div className="mt-1 text-[13px] text-text-muted">
            {jobPhase ?? "Đang xếp hàng chờ worker nhận việc..."}
          </div>
        </div>
        <div className="w-full">
          <FlowSteps
            steps={FLOW_M04B}
            currentStep={jobPhase ?? "SEGMENTING"}
            cancellable={jobStatus === "PENDING"}
            onCancel={() => {
              setJobStatus("CANCELLED")
              setPhase("config-b")
            }}
          />
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: RESULT B
  // ============================================================
  if (phase === "result-b" && scenePlan) {
    const activeScene = narrativeResultScenes.find((s) => s.sceneIndex === selectedSceneIndex) || narrativeResultScenes[0]

    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-5xl mx-auto">
        {planRatios.length > 1 && (
          <div className="flex w-full flex-wrap items-center gap-1.5" role="tablist" aria-label="Khung ảnh">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">Khung theo nền tảng:</span>
            {planRatios.map((r) => {
              const done = r === viewRatio ? generatedSceneCount : (ratioCounts[r] ?? 0)
              return (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={r === viewRatio}
                  onClick={() => setVariantRatio(r)}
                  className={`rounded-lg border px-3 py-1.5 text-[11.5px] font-bold cursor-pointer ${
                    r === viewRatio ? "border-primary bg-primary text-white" : "border-border bg-surface text-text-muted"
                  }`}
                >
                  {r} · {done}/{sceneCount}
                </button>
              )
            })}
          </div>
        )}
        {/* Header kết quả */}
        <div className="flex items-center justify-between w-full flex-wrap gap-2 border-b border-border pb-4">
          <div>
            <div className="text-xs text-text-muted">④ Thẻ kết quả — M04b · Kịch bản bối cảnh {scenePlan?.source === "rule" ? "cơ bản" : "AI"} · {scenePlan?.mode}</div>
            <div className="text-[19px] font-extrabold text-text">Bộ {sceneCount} phân cảnh theo chủ đề: {scenePlan?.topicTitle}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {cloudAvailable && (
            <div className="inline-flex rounded-lg border border-border overflow-hidden text-[11px] font-bold">
              {(["cloud_provider", "local_studio"] as const).map((eng) => (
                <button
                  key={eng}
                  type="button"
                  onClick={() => setSceneEngine(eng)}
                  className={`px-2.5 py-1.5 cursor-pointer ${sceneEngine === eng ? "bg-primary text-white" : "bg-surface text-text-muted"}`}
                  title={
                    eng === "cloud_provider"
                      ? "Cảnh có không gian riêng: Stability vẽ hậu cảnh theo kịch bản, bó hoa thật dán nguyên khối (2 credit/cảnh)"
                      : "Mọi cảnh dùng phông Studio cục bộ gần nhất (1 credit/cảnh)"
                  }
                >
                  {eng === "cloud_provider" ? "Hậu cảnh Stability" : "Studio cục bộ"}
                </button>
              ))}
            </div>
            )}
            <Button
              size="sm"
              onClick={handleGenerateAllScenes}
              disabled={generatingAllScenes || generatingSceneIndex !== null}
              className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-md hover:from-red-700 hover:to-rose-700 h-9 cursor-pointer"
            >
              <Sparkles size={14} className={generatingAllScenes ? "animate-spin" : ""} />
              {generatingAllScenes
                ? `Đang sinh phân cảnh...`
                : `⚡ Sinh trọn bộ ${sceneCount} phân cảnh${planRatios.length > 1 ? ` khung ${viewRatio}` : ""} (${sceneCreditTotal} credit)`}
            </Button>
            {planRatios.length > 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateAllRatios}
                disabled={generatingAllScenes || generatingSceneIndex !== null}
                className="h-9 gap-1.5 font-bold cursor-pointer"
                title="Mỗi khung trong phạm vi sản xuất một bộ ảnh riêng (một video riêng ở Khu vực E)"
              >
                Sinh đủ {planRatios.length} khung ({sceneCreditTotal * planRatios.length} credit)
              </Button>
            )}
            <Badge tone={judgmentB === "blocked" ? "danger" : "success"} className="text-xs px-3 py-1 font-bold">
              {judgmentB === "blocked"
                ? "Bị cổng toàn vẹn từ chối"
                : `${generatedSceneCount}/${sceneCount} phân cảnh đã sinh`}
            </Badge>
          </div>
        </div>

        {/* Cổng toàn vẹn từ chối */}
        {judgmentB === "blocked" && (
          <div className="w-full rounded-xl border-2 border-danger bg-danger-bg px-4 py-3 text-[13px] text-danger">
            <div className="font-bold">Không có biến thể nào được ghi</div>
            <div className="mt-1">
              Cổng toàn vẹn đo thấy lõi bó hoa bị thay đổi trong lúc ghép bối cảnh, nên không
              biến thể nào được lưu vào kho. Master Image của tiệm vẫn nguyên vẹn.
            </div>
            {variantIntegrity && variantIntegrity.ly_do.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {variantIntegrity.ly_do.map((ly, i) => (
                  <li key={i}>{ly}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Cảnh báo trước khi duyệt */}
        {judgmentB === "warning" && variantIntegrity && (
          <div className="w-full rounded-xl border-2 border-warning bg-warning-bg px-4 py-3 text-[13px] text-warning">
            Lõi chủ thể lệch nhẹ so với Master Image (
            {(variantIntegrity.subject_pixel_identity * 100).toFixed(2)}%). Xem kỹ ảnh trước
            khi duyệt.
          </div>
        )}

        {/* Khung Tiêu Điểm Phân Cảnh Đang Chọn (Active Scene Spotlight) */}
        {activeScene && (
          <Card className="w-full p-4 sm:p-5 border-2 border-primary/30 bg-surface shadow-xs rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Ảnh lớn tiêu điểm */}
              <div
                className="md:col-span-5 relative aspect-square w-full rounded-xl border border-border overflow-hidden flex items-center justify-center"
                style={
                  { backgroundColor: "#f8fafc" }
                }
              >
                {activeScene.imageUrl ? (
                  <img
                    src={activeScene.imageUrl}
                    alt={activeScene.title}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon size={40} className="text-text-muted" />
                )}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border shadow-2xs ${activeScene.beatColor}`}>
                    Cảnh {activeScene.sceneIndex} · {activeScene.beat}
                  </span>
                  <Badge tone={activeScene.isOriginal ? "neutral" : "success"} className="text-[10px]">
                    {activeScene.tag}
                  </Badge>
                </div>
              </div>

              {/* Thông tin kịch bản phân cảnh */}
              <div className="md:col-span-7 flex flex-col justify-between h-full space-y-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      Phân cảnh đang xem ({activeScene.sceneIndex}/{sceneCount})
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-xs text-text-muted">{activeScene.lighting}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-text mt-1">
                    {activeScene.title}
                  </h4>
                  <p className="text-xs sm:text-[13px] text-text-muted mt-2 leading-relaxed">
                    {activeScene.setting}
                  </p>
                  {activeScene.palette.length > 0 && (
                    <p className="text-[11px] text-text-muted mt-1">Bảng màu: {activeScene.palette.join(" · ")}</p>
                  )}
                </div>

                {activeScene.fallbackReason && (
                  <div className="rounded-xl border border-warning bg-warning-bg px-3.5 py-2.5 text-[12px] text-warning">
                    <strong>Chưa có bối cảnh của kịch bản:</strong> Stability không vẽ được hậu cảnh nên worker lùi về phông
                    Studio cục bộ (chỉ là nền trơn). Lý do: {activeScene.fallbackReason}
                  </div>
                )}
                <div className="rounded-xl bg-surface-alt p-3.5 border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Kiểm định Subject Integrity:</span>
                    <span className="font-bold text-secondary flex items-center gap-1">
                      <ShieldCheck size={14} className="text-success" />
                      {activeScene.integrityText}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Tỉ lệ khung hình:</span>
                    <span className="font-mono font-bold text-text">{activeScene.ratio}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Mục đích sử dụng:</span>
                    <span className="font-medium text-text">
                      {activeScene.purpose || "—"}
                    </span>
                  </div>
                </div>

                {activeScene.hasGenerated && (() => {
                  // ── Phương án (Đợt 2, 25/09/2026) ──
                  const idx = activeScene.sceneIndex
                  const list = sceneCandidates[idx] ?? []
                  const current = sceneMeta[idx]?.direction ?? null
                  const engine = activeScene.usesCloud ? "cloud_provider" : "local_studio"
                  const busy = generatingSceneIndex !== null || generatingAllScenes
                  const similarCost = variantTotalCostCredit(engine, SIMILAR_CANDIDATE_COUNT, renderOpts)
                  const altCost = variantTotalCostCredit(engine, 1, renderOpts)
                  const score = sceneMeta[idx]?.aestheticScore
                  return (
                    <div className="rounded-xl border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-text">
                          Phương án của cảnh {idx} ({list.length})
                        </span>
                        {current && (
                          <span className="text-text-muted">
                            Đang xem: {describeDirection(current)}
                            {typeof score === "number" && (
                              <span title="Chấm kỹ thuật tự động (độ nét, phơi sáng, tách nền, bố cục) — không thay mắt người">
                                {" "}· Kỹ thuật {Math.round(score)}/100
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      {list.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {list.map((c, i) => {
                            const chosen = c.jobId === sceneMeta[idx]?.jobId
                            return (
                              <button
                                key={c.jobId || c.assetId}
                                type="button"
                                title={describeDirection(c.direction)}
                                onClick={() => handleSelectCandidate(idx, c)}
                                className={`relative h-16 w-16 shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer ${
                                  chosen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-text-muted"
                                }`}
                              >
                                <img src={c.url} alt={`Phương án ${list.length - i}`} className="h-full w-full object-cover" />
                                {c.approved && (
                                  <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-success text-white flex items-center justify-center">
                                    <Check size={10} strokeWidth={3} />
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || !current}
                          onClick={() =>
                            current &&
                            handleGenerateSingleScene(idx, activeScene.ratio, {
                              direction: similarDirection(current, engine),
                              count: SIMILAR_CANDIDATE_COUNT,
                            })
                          }
                          className="gap-1.5 text-xs h-8 cursor-pointer"
                          title={
                            engine === "cloud_provider"
                              ? "Giữ cỡ cảnh, ánh sáng, phong cách — hậu cảnh mới (seed mới)"
                              : "Giữ cỡ cảnh và phong cách — dời vị trí bó hoa / hướng sáng"
                          }
                        >
                          <RotateCcw size={12} /> Sinh lại giống thế này · {SIMILAR_CANDIDATE_COUNT} phương án ({similarCost} credit)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || !current}
                          onClick={() =>
                            current && handleGenerateSingleScene(idx, activeScene.ratio, { direction: alternateDirection(current) })
                          }
                          className="gap-1.5 text-xs h-8 cursor-pointer"
                          title={current ? `Hướng mới: ${describeDirection(alternateDirection(current))}` : undefined}
                        >
                          <Sparkles size={12} /> Thử hướng khác ({altCost} credit)
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
                        <span className="font-bold text-text">Chất lượng lượt sau:</span>
                        {engine === "cloud_provider" && (
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={renderOpts.quality === "high"}
                              onChange={(e) => setRenderOpts((o) => ({ ...o, quality: e.target.checked ? "high" : "standard" }))}
                            />
                            Cao (Stability Ultra, +{variantUnitCostCredit("cloud_provider", { quality: "high" }) - variantUnitCostCredit("cloud_provider")} credit)
                          </label>
                        )}
                        <label className="flex items-center gap-1 cursor-pointer" title="Khung xuất gấp đôi; chỉ tăng nét hậu cảnh, bó hoa giữ nguyên điểm ảnh">
                          <input
                            type="checkbox"
                            checked={renderOpts.upscale === "2x"}
                            onChange={(e) => setRenderOpts((o) => ({ ...o, upscale: e.target.checked ? "2x" : "none" }))}
                          />
                          Xuất 2× độ phân giải
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer" title="Màu bóng theo hậu cảnh, khớp độ nét hậu cảnh — không đụng bó hoa">
                          <input
                            type="checkbox"
                            checked={renderOpts.composeMode === "harmonize"}
                            onChange={(e) => setRenderOpts((o) => ({ ...o, composeMode: e.target.checked ? "harmonize" : "paste" }))}
                          />
                          Hoà hợp bóng &amp; nền
                        </label>
                      </div>
                      {engine === "local_studio" && (
                        <p className="text-[11px] text-text-muted">
                          Phông Studio cục bộ chỉ đổi vùng sáng, bố cục bokeh và vị trí bó hoa — muốn hậu cảnh khác hẳn
                          nhau, bật hậu cảnh Stability cho cảnh này.
                        </p>
                      )}
                    </div>
                  )
                })()}

                <div className="flex items-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeScene.imageUrl) window.open(activeScene.imageUrl, "_blank")
                    }}
                    className="gap-1.5 text-xs h-9 cursor-pointer"
                  >
                    <Download size={13} /> Tải ảnh phân cảnh này
                  </Button>
                  {activeScene.transparentUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(activeScene.transparentUrl as string, "_blank")}
                      className="gap-1.5 text-xs h-9 cursor-pointer"
                    >
                      <Download size={13} /> PNG tách nền
                    </Button>
                  )}
                  {activeScene.hasGenerated && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={activeScene.approved || !canApproveVariantCap || approvingSceneIndex !== null}
                      onClick={() => handleApproveScene(activeScene.sceneIndex)}
                      className="gap-1.5 text-xs h-9 cursor-pointer"
                    >
                      <Check size={13} />
                      {activeScene.approved
                        ? "Đã duyệt (I5)"
                        : approvingSceneIndex === activeScene.sceneIndex
                        ? "Đang duyệt..."
                        : "Duyệt ảnh này"}
                    </Button>
                  )}
                  <span className="text-[11px] text-text-muted">
                    Bấm vào các khung bên dưới để chuyển xem từng cảnh
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Lưới phân cảnh theo kịch bản bối cảnh của chủ đề */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text uppercase tracking-wider">
              Danh sách {sceneCount} phân cảnh (chọn cảnh để xem tiêu điểm):
            </span>
            <span className="text-[11px] text-text-muted">
              Chuẩn kịch bản Narrative Arc Chặng 04–05
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {narrativeResultScenes.map((scene) => {
              const isSelected = scene.sceneIndex === selectedSceneIndex
              return (
                <div
                  key={scene.sceneIndex}
                  onClick={() => setSelectedSceneIndex(scene.sceneIndex)}
                  className={`relative overflow-hidden rounded-xl border-2 transition-all flex flex-col cursor-pointer ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 bg-surface shadow-md"
                      : "border-border bg-surface shadow-2xs hover:border-text-muted hover:shadow-xs"
                  }`}
                >
                  {/* Image Frame */}
                  <div
                    className="relative aspect-square w-full flex items-center justify-center overflow-hidden"
                    style={
                      { backgroundColor: "#f8fafc" }
                    }
                  >
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={scene.title}
                        className="h-full w-full object-contain p-2 hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-text-muted" />
                    )}

                    {/* Top badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${scene.beatColor}`}>
                        Cảnh {scene.sceneIndex} · {scene.beat}
                      </span>
                    </div>

                    {/* Selection Check Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2 border-t border-border">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase">
                          Cảnh {scene.sceneIndex}
                        </span>
                        <Badge tone={scene.isOriginal ? "neutral" : "success"} className="text-[9px] px-1.5 py-0">
                          {scene.tag}
                        </Badge>
                      </div>
                      <h5 className="text-xs font-bold text-text line-clamp-1">{scene.title}</h5>
                      <p className="text-[11px] text-text-muted mt-1 line-clamp-2 leading-relaxed">
                        {scene.setting}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-dashed border-border flex items-center justify-between text-[10px]">
                      <span className="text-secondary font-bold truncate max-w-[120px]">
                        {scene.integrityText}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (scene.imageUrl) window.open(scene.imageUrl, "_blank")
                        }}
                        className="text-primary font-bold hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Download size={11} /> Tải về
                      </button>
                    </div>

                    {/* Nút sinh độc lập từng cảnh — mỗi lượt là một job thật */}
                    <button
                      type="button"
                      disabled={generatingSceneIndex !== null || generatingAllScenes}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGenerateSingleScene(scene.sceneIndex)
                      }}
                      className="w-full mt-2 py-1.5 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                    >
                      <Sparkles size={12} className={generatingSceneIndex === scene.sceneIndex ? "animate-spin" : ""} />
                      {generatingSceneIndex === scene.sceneIndex
                        ? "Đang chờ worker dựng cảnh..."
                        : scene.hasGenerated
                        ? `🔄 Sinh lại Cảnh ${scene.sceneIndex}`
                        : scene.usesCloud
                        ? `⚡ Sinh Cảnh ${scene.sceneIndex} (hậu cảnh Stability)`
                        : `⚡ Sinh Cảnh ${scene.sceneIndex} (Studio cục bộ)`}
                    </button>
                    {scene.fallbackReason && (
                      <p className="mt-1.5 text-[10.5px] leading-snug text-warning">
                        Stability không vẽ được hậu cảnh — đã dùng phông cục bộ: {scene.fallbackReason}
                      </p>
                    )}
                    {scene.error && (
                      <p className="mt-1.5 text-[10.5px] leading-snug text-danger">{scene.error}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── CỔNG PHÊ DUYỆT CHẶNG 06c (STAGE-GATE APPROVAL) ── */}
        <div className="w-full space-y-2 pt-2">
          <StageGateApprovalBar
            stageCode="Chặng 06c — BIẾN THỂ ẢNH M04b"
            title={`Phê duyệt bộ ${sceneCount} ảnh tiếp thị theo kịch bản chủ đề`}
            description={`Đã sinh ${generatedSceneCount}/${sceneCount} phân cảnh theo kịch bản ${planScenes.map((sc) => sc.beat).join(" → ")}. Số toàn vẹn lõi hoa bên dưới là số ĐO bởi worker trên từng ảnh. Chủ shop xác nhận để tiến sang Tạo Video Marketing (Khu vực E).`}
            isApproved={judgmentB !== "blocked" && generatedSceneCount > 0}
            approveLabel={`Phê duyệt bộ ${sceneCount} ảnh & chuyển sang Tạo Video (Khu vực E) →`}
            onApprove={() => navigateToArea("e")}
            metrics={[
              { label: "Phân cảnh", value: `${generatedSceneCount}/${sceneCount} đã sinh` },
              {
                label: "Toàn vẹn lõi hoa (thấp nhất)",
                value: minSceneIntegrity === null ? "Chưa đo" : `${(minSceneIntegrity * 100).toFixed(2)}%`,
              },
              { label: "Tỉ lệ", value: variantRatio || "1:1" },
            ]}
          />
        </div>

        {/* Bottom Navigation */}
        <div className="w-full border-t border-border pt-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setPhase("config-b")}>
            <RotateCcw size={15} className="mr-1.5" /> Đổi nguồn hậu cảnh / tỉ lệ
          </Button>
          <Button onClick={() => setPhase("saved")} className="gap-1.5">
            Xong → Lưu vào kho ảnh
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: SAVED
  // ============================================================
  if (phase === "saved") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center my-auto py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success-bg">
          <Check size={40} strokeWidth={2} className="text-secondary" />
        </div>
        <div>
          <div className="text-[18px] font-extrabold text-text">Đã lưu vào Kho ảnh sản phẩm</div>
          <div className="mt-1 text-[13px] text-text-muted">
            Biến thể marketing và Master Image đều được bảo toàn trong kho ảnh của tiệm
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => setPhase("config-b")}>
            Tạo thêm biến thể khác
          </Button>
          <Button onClick={() => navigateToArea("e")} className="gap-1.5">
            Tiếp tục → Chuyển sang Tạo Video (Khu vực E)
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: ERROR
  // ============================================================
  if (phase === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center my-auto py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-danger-bg">
          <AlertTriangle size={40} strokeWidth={2} className="text-danger" />
        </div>
        <div>
          <div className="text-[18px] font-extrabold text-text">Đã xảy ra lỗi</div>
          <div className="mt-1 text-[13px] text-text-muted">{errorMsg ?? "Không thể hoàn thành tác vụ"}</div>
        </div>
        <div className="flex gap-3 mt-2">
          <Button onClick={() => { setErrorMsg(null); setPhase("config-b") }}>Thử lại</Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: CONFIG-B (Default Configuration)
  // ============================================================
  const hasImageSource = Boolean(selectedMasterId || context?.assetId || context?.sourceImageUrl)

  // Không gán asset ORIGINAL của Khu vực A làm Master (máy chủ trả 409):
  // chưa có Master đã duyệt thì SourcePicker hiện nút "Skip — Dùng ảnh gốc".
  // Khu vực D chạy theo kịch bản bối cảnh CỦA CHỦ ĐỀ (24/09/2026): số cảnh và
  // bối cảnh từng cảnh lấy từ kịch bản (AI hoặc cơ bản), không còn bộ chọn tay
  // "6 bối cảnh" hay khuôn 4 cảnh cố định. Cấu hình: nguồn hậu cảnh, tỉ lệ, watermark.
  const openSceneBoard = async (generateAll: boolean) => {
    if (!scenePlan) return
    const id = await ensureMaster()
    if (!id) return // lỗi hiển thị ở masterError, giữ màn cấu hình
    setPhase("result-b")
    if (generateAll) await handleGenerateAllScenes()
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
      {/* Title */}
      <div className="text-center w-full">
        <div className="text-[17px] font-extrabold text-primary">Khu vực D — Tạo biến thể ảnh Marketing Tiếp thị (M04b)</div>
        <div className="mt-1 text-[13px] text-text-muted">
          Tự động liên kết ảnh sản phẩm thật và áp dụng kịch bản bối cảnh cung truyện (Narrative Arc) từ Chặng 04–05.
        </div>
      </div>

      {/* Nguồn ảnh hoa thật từ Chặng 01–02 */}
      {context?.sourceImageUrl || context?.assetId ? (
        <div className="w-full space-y-2">
          <Card className="w-full p-4 border border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
              <div className="h-16 w-16 rounded-xl border border-emerald-200 bg-white p-1 overflow-hidden shrink-0 shadow-2xs">
                {context.sourceImageUrl ? (
                  <img
                    src={context.sourceImageUrl}
                    alt={context.productName || "Ảnh hoa thật"}
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                    <Camera size={22} />
                  </div>
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="success" className="text-[10px] px-2 py-0.5">
                    <CheckCircle2 size={11} className="mr-1" />
                    Ảnh hoa thật từ Chặng 01–02 (Đang sử dụng)
                  </Badge>
                  {context.assetId && (
                    <span className="text-[10.5px] font-mono text-stone-500">
                      Asset #{context.assetId.slice(0, 8)}
                    </span>
                  )}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                  {context.productName || "Giỏ hoa chúc mừng khai trương"}
                </h4>
                <p className="text-[11px] text-stone-600 truncate">
                  {context.commercialPassport?.style || "Hiện đại & Tinh tế"} · {context.commercialPassport?.category || "Hoa tươi thiết kế"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowManualSourcePicker(!showManualSourcePicker)}
                className="text-xs text-stone-600 hover:text-stone-900 h-8"
              >
                {showManualSourcePicker ? "Ẩn đổi ảnh" : "Đổi ảnh khác từ kho"}
              </Button>
            </div>
          </Card>

          {showManualSourcePicker && (
            <SourcePicker
              masters={approvedMasters}
              selectedMasterId={selectedMasterId}
              onSelectMaster={setSelectedMasterId}
              assets={assets}
              onPromoteToMaster={promoteOriginalToMaster}
              onGoToOptimize={() => setPhase("select")}
              loadingMasters={loadingMasters}
              loadingAssets={loadingAssets}
              canApprove={canApprove}
            />
          )}
        </div>
      ) : (
        <SourcePicker
          masters={approvedMasters}
          selectedMasterId={selectedMasterId}
          onSelectMaster={setSelectedMasterId}
          assets={assets}
          onPromoteToMaster={promoteOriginalToMaster}
          onGoToOptimize={() => setPhase("select")}
          loadingMasters={loadingMasters}
          loadingAssets={loadingAssets}
          canApprove={canApprove}
        />
      )}

      {/* Kịch bản bối cảnh của CHỦ ĐỀ (Chặng 04–05) — nguồn duy nhất của các phân cảnh */}
      <div className="w-full space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-bold text-text uppercase tracking-wider">
              Kịch bản bối cảnh hình ảnh theo chủ đề
            </span>
          </div>
          <span className="text-[11px] text-text-muted">
            Chủ đề:{" "}
            <strong>{context?.selectedTopic?.title || "chưa chọn ở Chặng 05 — dùng tên sản phẩm"}</strong>
            {" · "}
            {context?.mode ?? "CREATIVE"} ({context?.mode === "AUTHENTIC" ? 3 : 5} cảnh)
          </span>
        </div>

        {planLoading && (
          <div className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-[12px] text-text-muted">
            Đang tra kịch bản đã có cho chủ đề này...
          </div>
        )}

        {!planLoading && !scenePlan && (
          <Card className="w-full p-4 border border-primary/30 bg-primary/5 flex flex-col gap-3">
            <div className="text-[13px] text-text">
              <span className="font-bold">Chưa tìm thấy kịch bản bối cảnh của chủ đề này.</span> Kịch bản được AI
              viết khi bấm &quot;Bắt đầu sáng tạo&quot; ở Chặng 05; phiên này mở Creative Studio mà chưa qua bước đó
              (hoặc lượt viết đã lỗi). Viết ngay tại đây — AI đọc chủ đề (dịp, tông màu, cảm xúc, hook, CTA) và thông
              tin bó hoa để viết từng cảnh. Kịch bản được lưu, dùng chung cho Khu vực B, C, D, E.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void handleWritePlan(false)}
                disabled={planWriting || !planCtx}
                className="gap-1.5"
              >
                <Sparkles size={14} className={planWriting ? "animate-spin" : ""} />
                {planWriting ? "AI đang viết kịch bản..." : "AI viết kịch bản bối cảnh (1 credit)"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleUseRulePlan} disabled={planWriting || !planCtx}>
                Dùng kịch bản cơ bản (miễn phí, không AI)
              </Button>
            </div>
          </Card>
        )}

        {planError && (
          <div className="w-full rounded-xl border border-danger bg-danger-bg px-4 py-3 text-[12.5px] text-danger">
            {planError}
          </div>
        )}

        {scenePlan && (
          <>
            <div className="rounded-xl border border-border bg-surface-alt px-3.5 py-2.5 text-[12px] text-text-muted flex flex-wrap items-center justify-between gap-2">
              <span>
                <Badge tone={scenePlan.source === "ai" ? "success" : "neutral"} className="text-[10px] mr-2">
                  {scenePlan.source === "ai" ? "AI viết" : "Kịch bản cơ bản"}
                </Badge>
                {scenePlan.emotionalTone && <strong className="text-text">{scenePlan.emotionalTone}. </strong>}
                {scenePlan.reasoning}
              </span>
              <button
                type="button"
                onClick={() => void handleWritePlan(true)}
                disabled={planWriting}
                className="text-[11.5px] font-bold text-primary hover:underline disabled:opacity-60 cursor-pointer"
              >
                {planWriting ? "Đang viết lại..." : "↻ AI viết lại kịch bản (1 credit)"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {narrativeResultScenes.map((scene) => (
                <div key={scene.sceneIndex} className="p-3.5 rounded-xl border-2 border-border bg-surface">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${scene.beatColor}`}>
                      Cảnh {scene.sceneIndex} · {scene.beat}
                    </span>
                    {scene.purpose && (
                      <Badge tone="neutral" className="text-[10px] px-1.5 py-0 max-w-[55%] truncate">
                        {scene.purpose}
                      </Badge>
                    )}
                  </div>
                  <h5 className="text-xs font-bold text-text mt-1">{scene.title}</h5>
                  <p className="text-[11.5px] text-text-muted mt-1 leading-relaxed">{scene.setting}</p>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed border-border text-[10.5px] gap-2">
                    <span className="text-stone-500 font-medium truncate">
                      {[scene.lighting, scene.palette.join(", ")].filter(Boolean).join(" · ")}
                    </span>
                    <span className="font-bold text-stone-500 shrink-0">
                      {scene.usesCloud ? "Stability · 2 credit" : "Studio cục bộ · 1 credit"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Nguồn hậu cảnh (chỉ CREATIVE — AUTHENTIC giữ phông cục bộ giản dị) */}
      {scenePlan && cloudAvailable && (
        <div className="w-full">
          <div className="text-xs font-bold text-text mb-2">Nguồn hậu cảnh cho các cảnh có không gian riêng:</div>
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-alt rounded-xl border border-border w-full">
            {(["cloud_provider", "local_studio"] as const).map((eng) => (
              <button
                key={eng}
                type="button"
                onClick={() => setSceneEngine(eng)}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  sceneEngine === eng ? "bg-primary text-white shadow-xs" : "text-text-muted hover:text-text"
                }`}
              >
                {eng === "cloud_provider" ? (
                  <>
                    <Sparkles size={14} /> Hậu cảnh Stability theo kịch bản (2 credit/cảnh)
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} /> Phông Studio cục bộ gần nhất (1 credit/cảnh)
                  </>
                )}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-text-muted leading-relaxed">
            {sceneEngine === "cloud_provider"
              ? "Stability vẽ không gian trống đúng mô tả của từng cảnh; bó hoa thật được dán nguyên khối từ Master Image và đo Subject Integrity. Cảnh phông trắng luôn chạy cục bộ. Nhà cung cấp lỗi thì worker tự lùi về phông cục bộ và ghi rõ trên ảnh."
              : "Mỗi cảnh dùng phông Studio dựng sẵn gần nhất với bối cảnh trong kịch bản (6 phông có sẵn) — rẻ hơn nhưng không đúng từng chi tiết không gian."}
          </p>
        </div>
      )}
      {scenePlan && !cloudAvailable && (
        <p className="w-full text-[11.5px] text-text-muted">
          Mode AUTHENTIC: giữ tinh thần ảnh thật — mọi cảnh dùng phông Studio cục bộ, không vẽ không gian mới.
        </p>
      )}

      {/* Multi-channel Controls (Ratio, Watermark, Credit Cost) */}
      <Card className="w-full p-4.5 border border-border bg-surface flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tùy biến xuất bản đa kênh</div>
          <Badge tone="accent" className="text-[11px] font-bold">
            {scenePlan ? `Trọn bộ ${sceneCount} cảnh: ${sceneCreditTotal} credit` : "Chưa có kịch bản"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-text block mb-1.5">Tỉ lệ khung hình</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["1:1", "4:5", "9:16", "16:9"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setVariantRatio(r)}
                  className={`h-8 rounded-lg text-xs font-bold border transition ${
                    variantRatio === r
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-surface-alt border-border text-text hover:border-text-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-text-muted mt-1">
              {variantRatio === "1:1" && "Vuông chuẩn Instagram / Zalo"}
              {variantRatio === "4:5" && "Dọc nhẹ chuẩn Facebook Feed"}
              {variantRatio === "9:16" && "Dọc toàn màn hình Story / Reels / TikTok"}
              {variantRatio === "16:9" && "Ngang Banner Website / Youtube"}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-text block mb-1.5">Bản quyền & Đóng dấu</label>
            <label className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-surface-alt cursor-pointer hover:border-text-muted">
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="accent-primary h-4 w-4 rounded"
              />
              <div className="text-xs">
                <span className="font-bold text-text">Đóng dấu Watermark Shop</span>
                <span className="block text-[11px] text-text-muted">Logo/tên tiệm từ Hồ sơ thương hiệu; bản PNG tách nền không đóng dấu</span>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Boundary Notice */}
      <div className="w-full rounded-xl bg-primary/5 p-4 border border-primary/20 flex items-start gap-3">
        <ShieldCheck size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="text-xs text-primary/90 leading-relaxed">
          <strong>Ranh giới bất biến:</strong> Biến thể marketing không thay đổi hình dáng hay màu sắc bó hoa thật. Bó hoa từ Master Image được bảo toàn 100%.
        </div>
      </div>

      {/* Nút chính: sinh trọn bộ, hoặc mở bảng để sinh từng cảnh */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          className="h-[48px] sm:col-span-2 px-6 text-sm font-bold shadow-md shadow-primary/20"
          onClick={() => void openSceneBoard(true)}
          disabled={!hasImageSource || !scenePlan || promotingMaster || generatingAllScenes}
        >
          <Sparkles size={18} strokeWidth={2} className="mr-2" />
          {promotingMaster
            ? "Đang dùng ảnh gốc làm Master..."
            : !scenePlan
            ? "Cần kịch bản bối cảnh trước"
            : `Sinh trọn bộ ${sceneCount} phân cảnh (${sceneCreditTotal} credit)`}
        </Button>
        <Button
          variant="outline"
          className="h-[48px] px-4 text-sm font-bold"
          onClick={() => void openSceneBoard(false)}
          disabled={!hasImageSource || !scenePlan || promotingMaster}
        >
          Sinh từng cảnh →
        </Button>
      </div>

      {masterError && (
        <div className="w-full rounded-xl border border-danger bg-danger-bg px-4 py-3 text-[13px] text-danger">
          {masterError}
        </div>
      )}
      {!activeMasterId && context?.assetId && !masterError && (
        <p className="w-full text-[12px] text-text-muted">
          Ảnh từ Khu vực A chưa là Master Image — khi bấm tạo, hệ thống sẽ dùng nguyên ảnh gốc làm Master (không chỉnh ảnh, cần quyền duyệt ảnh I2).
        </p>
      )}

      <div className="w-full flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={() => navigateToArea("a")}>
          <ArrowLeft size={14} className="mr-1.5" /> Quay lại Khu vực A
        </Button>
        <button
          type="button"
          onClick={() => navigateToArea("e")}
          className="text-xs font-semibold text-stone-500 hover:text-stone-800 transition underline decoration-dotted"
        >
          Bỏ qua tạo biến thể & Chuyển sang Tạo Video (Khu vực E) →
        </button>
      </div>
    </div>
  )
}
