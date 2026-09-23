"use client"
/**
 * VariantWorkspace — Khu vực D (Chặng 06c): M04b Biến thể Marketing
 *
 * Cho phép tạo biến thể bối cảnh studio hoặc AI visual storytelling.
 * Tích hợp SourcePicker với lựa chọn:
 *   1. Dùng Master Image đã duyệt từ Tab 1
 *   2. Skip — Dùng nguyên ảnh gốc (duyệt nhanh 1-chạm tạo Master)
 */

import { useState, useEffect, useContext, useMemo } from "react"
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
import { FlowSteps } from "@/components/flow/flow-steps"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StageGateApprovalBar } from "@/components/ui/stage-gate-approval-bar"
import { SourcePicker } from "./source-picker"
import { promoteToMaster, resolveApprovedMaster, sceneTwoPresetFor } from "./package-client"
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
  approved?: boolean
}

type VariantJobPoll = {
  status: string
  result: string | null
  error: string | null
  source: { engine: "local_studio" | "cloud_provider"; cloud_fallback: boolean }
  subject_integrity: { subject_pixel_identity: number } | null
  variants: Array<{ asset_id: string; variant_key: string; url: string }>
}

/** Mô tả KHÔNG GIAN hậu cảnh gửi nhà cung cấp — không mô tả bó hoa (bó hoa
 *  thật được dán nguyên khối ở worker). */
const SCENE_BACKGROUND_PROMPTS: Record<number, string> = {
  2: "Luxury grand opening banquet hall, modern hotel lobby, warm cinematic lighting, shallow depth of field, soft bokeh",
  3: "Warm minimalist Nordic oak tabletop, soft morning sunlight from a window, creamy bokeh, calm interior",
}


function formatIntegrity(value: number | null, hasGenerated: boolean): string {
  if (!hasGenerated) return "Chưa sinh — chưa đo"
  if (value === null) return "Chưa có số đo"
  const pct = (value * 100).toFixed(2)
  if (value >= 0.999) return `Lõi trùng khít ${pct}% (SAFE)`
  if (value >= 0.99) return `Lõi trùng khít ${pct}% (WARNING)`
  return `Lõi trùng khít ${pct}% (REJECTED)`
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
  const [sceneErrors, setSceneErrors] = useState<Record<number, string>>({})
  const [generatingSceneIndex, setGeneratingSceneIndex] = useState<number | null>(null)
  const [generatingAllScenes, setGeneratingAllScenes] = useState<boolean>(false)
  // Cảnh 2–3 (hậu cảnh lifestyle/cận cảnh): mặc định Stability qua hàng đợi job
  // (chốt 23/09/2026); nhà cung cấp lỗi thì worker tự lùi về phông cục bộ.
  // Cảnh 1 (studio trắng) và Cảnh 4 (tách nền) luôn chạy cục bộ — không cần hậu cảnh AI.
  const [sceneEngine, setSceneEngine] = useState<"cloud_provider" | "local_studio">("cloud_provider")

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

  // Nạp các phân cảnh ĐÃ sinh của đúng Master đang chọn (không quét cả tổ chức).
  useEffect(() => {
    if (!activeMasterId) return
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
        // `data` sắp theo created_at giảm dần — bản mới nhất của mỗi cảnh thắng.
        for (const item of body.data ?? []) {
          const meta = item.metadata ?? {}
          const idx = typeof meta.scene_index === "number" ? meta.scene_index : null
          if (!idx || urls[idx] || !item.url) continue
          const wantKey = idx === 4 ? "transparent" : "styled"
          if (meta.variant_key !== wantKey) continue
          urls[idx] = item.url
          metas[idx] = {
            assetId: item.id,
            jobId: typeof meta.job_id === "string" ? meta.job_id : "",
            integrity: typeof item.identity_score === "number" ? item.identity_score : null,
            engine: meta.engine === "cloud_provider" ? "cloud_provider" : "local_studio",
            cloudFallback: meta.cloud_fallback === true,
            approved: item.approval_state === "APPROVED",
          }
        }
        if (cancelled) return
        setSceneImageMap(urls)
        setSceneMeta(metas)
      } catch (e) {
        console.error("Lỗi nạp phân cảnh đã sinh:", e)
      }
    }
    loadExistingScenes()
    return () => {
      cancelled = true
    }
  }, [activeMasterId])

  // Phân tích kịch bản bối cảnh hình ảnh (Narrative Arc) từ Chặng 04-05.
  // `angleCategory` thật: EMOTIONAL | PROBLEM_SOLUTION | PRODUCT_SHOWCASE |
  // EDUCATIONAL | TREND | PRICE_VALUE (bản trước so với "LOVE"/"OPENING" —
  // không bao giờ khớp, Cảnh 2 luôn rơi về phòng khách).
  const narrativeImageScenes = useMemo(() => {
    const topic = context?.selectedTopic
    const occasion = context?.commercialPassport?.suggestedOccasions?.[0] || "Khai trương & Sự kiện"
    const scene2Preset = sceneTwoPresetFor(topic?.angleCategory)
    const scene2Title =
      scene2Preset === "wedding"
        ? "Bàn Tiệc Cưới & Hẹn Hò"
        : scene2Preset === "luxury_hotel"
        ? "Sảnh Khách Sạn & Tiệc Mừng"
        : "Phòng Khách Gia Đình Ấm Cúng"

    return [
      {
        sceneIndex: 1,
        beat: "SETUP",
        beatLabel: "Mở đầu — Vẻ đẹp nguyên bản",
        presetId: "studio_white" as const,
        title: "Studio Trắng Tinh Khôi",
        description: `Tập trung vào phom dáng và màu sắc nguyên bản của ${context?.productName || "bó hoa"}, đổ bóng mềm tự nhiên chuẩn E-commerce.`,
        tag: "Catalog",
      },
      {
        sceneIndex: 2,
        beat: "RISING",
        beatLabel: `Trải nghiệm — ${occasion}`,
        presetId: scene2Preset,
        title: scene2Title,
        description: `Hòa phối bó hoa vào không gian ${occasion.toLowerCase()}, mang lại cảm xúc chân thực cho người mua.`,
        tag: "Lifestyle",
      },
      {
        sceneIndex: 3,
        beat: "CLIMAX",
        beatLabel: "Chi tiết — Tôn vinh phụ liệu & Thiệp",
        presetId: "wood_minimal" as const,
        title: "Gỗ Tối Giản Nghệ Thuật (Bắc Âu)",
        description: "Bối cảnh ánh sáng ban mai nhẹ nhàng, làm nổi bật thông điệp thiệp in/viết và phụ liệu nơ thiết kế riêng.",
        tag: "Tối giản",
      },
      {
        sceneIndex: 4,
        beat: "CTA",
        beatLabel: "Xuất bản — Đa kênh",
        presetId: "transparent" as const,
        title: "Tách Nền Trong Suốt (PNG)",
        description: "Khử nền, giữ nguyên từng cánh hoa và lá đệm, sẵn sàng ghép banner để xuất bản đa kênh.",
        tag: "Xuất bản",
      },
    ]
  }, [context])

  // Sinh MỘT phân cảnh qua hàng đợi job rồi chờ kết quả thật.
  const handleGenerateSingleScene = async (targetIndex: number): Promise<void> => {
    const scene = narrativeImageScenes.find((s) => s.sceneIndex === targetIndex)
    if (!scene) return
    const masterForScene = await ensureMaster()
    if (!masterForScene) {
      setSceneErrors((prev) => ({
        ...prev,
        [targetIndex]:
          masterError ?? "Chưa có Master Image đã duyệt và không có ảnh gốc từ Khu vực A để dùng.",
      }))
      return
    }

    const useCloud = sceneEngine === "cloud_provider" && (targetIndex === 2 || targetIndex === 3)
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
          preset: scene.presetId,
          ratio: variantRatio || "1:1",
          // Cảnh 4 là PNG tách nền để ghép banner — không bao giờ đóng dấu.
          watermark: watermarkEnabled && targetIndex !== 4,
          scene_index: targetIndex,
          ...(useCloud ? { provider_key: "stability", scene_prompt: SCENE_BACKGROUND_PROMPTS[targetIndex] } : {}),
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(err.error?.message || `Lỗi API HTTP ${res.status}`)
      }
      const { job_id: jobId } = (await res.json()) as { job_id: string }
      const detail = await waitForVariantJob(jobId)

      if (detail.status !== "COMPLETED") {
        throw new Error(detail.error || "Worker không dựng được phân cảnh này")
      }
      if (detail.result === "REJECTED") {
        throw new Error(
          "Cổng Subject Integrity từ chối: lõi bó hoa bị thay đổi — không biến thể nào được ghi vào kho."
        )
      }
      const wantKeys =
        targetIndex === 4
          ? ["transparent"]
          : watermarkEnabled
          ? ["branded", "styled"]
          : ["styled"]
      const variant =
        wantKeys.map((k) => detail.variants.find((v) => v.variant_key === k)).find(Boolean) ??
        detail.variants[0]
      if (!variant) throw new Error("Job hoàn tất nhưng không có ảnh nào được ghi.")

      setSceneImageMap((prev) => ({ ...prev, [targetIndex]: variant.url }))
      setSceneMeta((prev) => ({
        ...prev,
        [targetIndex]: {
          assetId: variant.asset_id,
          jobId,
          integrity: detail.subject_integrity?.subject_pixel_identity ?? null,
          engine: detail.source.engine,
          cloudFallback: detail.source.cloud_fallback,
        },
      }))
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
    } catch (err) {
      setSceneErrors((prev) => ({
        ...prev,
        [targetIndex]: err instanceof Error ? err.message : "Không duyệt được phân cảnh",
      }))
    } finally {
      setApprovingSceneIndex(null)
    }
  }

  // Sinh trọn bộ 4 phân cảnh — tuần tự, mỗi cảnh một job (một lượt trừ credit).
  const handleGenerateAllScenes = async () => {
    setGeneratingAllScenes(true)
    try {
      for (const idx of [1, 2, 3, 4]) {
        await handleGenerateSingleScene(idx)
      }
    } finally {
      setGeneratingAllScenes(false)
    }
  }

  // 4 khung phân cảnh cho màn kết quả — CHỈ hiển thị ảnh thật đã sinh cho đúng
  // cảnh. Cảnh chưa sinh thì để trống và ghi "Chưa sinh", không mượn ảnh gốc
  // gắn nhãn "Biến thể AI" như bản trước.
  const narrativeResultScenes = useMemo(() => {
    const beatColors: Record<number, string> = {
      1: "bg-blue-100 text-blue-800 border-blue-200",
      2: "bg-purple-100 text-purple-800 border-purple-200",
      3: "bg-rose-100 text-rose-800 border-rose-200",
      4: "bg-amber-100 text-amber-800 border-amber-200",
    }
    return narrativeImageScenes.map((scene) => {
      const meta = sceneMeta[scene.sceneIndex]
      const url = sceneImageMap[scene.sceneIndex] || ""
      const hasGenerated = Boolean(url)
      return {
        sceneIndex: scene.sceneIndex,
        beat: scene.beat,
        beatColor: beatColors[scene.sceneIndex] ?? "",
        beatLabel: scene.beatLabel,
        title: scene.title,
        presetId: scene.presetId,
        imageUrl: url,
        isOriginal: false,
        isTransparent: scene.sceneIndex === 4,
        tag: !hasGenerated
          ? "Chưa sinh"
          : meta?.engine === "cloud_provider" && !meta.cloudFallback
          ? "Hậu cảnh Stability"
          : meta?.cloudFallback
          ? "Studio cục bộ (Stability lỗi)"
          : "Studio cục bộ",
        ratio: variantRatio || "1:1",
        description: scene.description,
        integrityText: formatIntegrity(meta?.integrity ?? null, hasGenerated),
        hasGenerated,
        approved: meta?.approved === true,
        error: sceneErrors[scene.sceneIndex] ?? null,
      }
    })
  }, [narrativeImageScenes, sceneImageMap, sceneMeta, sceneErrors, variantRatio])

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
  if (phase === "result-b") {
    const activeScene = narrativeResultScenes.find((s) => s.sceneIndex === selectedSceneIndex) || narrativeResultScenes[0]

    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-5xl mx-auto">
        {/* Header kết quả */}
        <div className="flex items-center justify-between w-full flex-wrap gap-2 border-b border-border pb-4">
          <div>
            <div className="text-xs text-text-muted">④ Thẻ kết quả — M04b (Biến thể Marketing Narrative Arc)</div>
            <div className="text-[19px] font-extrabold text-text">Bộ 4 Phân Cảnh Hình Ảnh Theo Cung Kịch Bản</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-border overflow-hidden text-[11px] font-bold">
              {(["cloud_provider", "local_studio"] as const).map((eng) => (
                <button
                  key={eng}
                  type="button"
                  onClick={() => setSceneEngine(eng)}
                  className={`px-2.5 py-1.5 cursor-pointer ${sceneEngine === eng ? "bg-primary text-white" : "bg-surface text-text-muted"}`}
                  title={
                    eng === "cloud_provider"
                      ? "Cảnh 2–3: Stability vẽ hậu cảnh, bó hoa thật dán nguyên khối (2 credit/cảnh)"
                      : "Cảnh 2–3: phông Studio cục bộ (1 credit/cảnh)"
                  }
                >
                  {eng === "cloud_provider" ? "Hậu cảnh Stability" : "Studio cục bộ"}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={handleGenerateAllScenes}
              disabled={generatingAllScenes || generatingSceneIndex !== null}
              className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-md hover:from-red-700 hover:to-rose-700 h-9 cursor-pointer"
            >
              <Sparkles size={14} className={generatingAllScenes ? "animate-spin" : ""} />
              {generatingAllScenes ? "Đang sinh trọn bộ 4 phân cảnh..." : "⚡ Sinh trọn bộ 4 phân cảnh"}
            </Button>
            <Badge tone={judgmentB === "blocked" ? "danger" : "success"} className="text-xs px-3 py-1 font-bold">
              {judgmentB === "blocked"
                ? "Bị cổng toàn vẹn từ chối"
                : `${generatedSceneCount}/4 phân cảnh đã sinh`}
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
                  activeScene.isTransparent
                    ? {
                        backgroundImage:
                          "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                        backgroundSize: "16px 16px",
                        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                      }
                    : { backgroundColor: "#f8fafc" }
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
                      Phân cảnh đang xem ({activeScene.sceneIndex}/4)
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-xs text-text-muted">{activeScene.beatLabel}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-text mt-1">
                    {activeScene.title}
                  </h4>
                  <p className="text-xs sm:text-[13px] text-text-muted mt-2 leading-relaxed">
                    {activeScene.description}
                  </p>
                </div>

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
                      {activeScene.sceneIndex === 1 && "Catalog thương mại / Ảnh Master xác thực"}
                      {activeScene.sceneIndex === 2 && "Bài viết Facebook Feed / Quảng cáo Instagram"}
                      {activeScene.sceneIndex === 3 && "Slide chi tiết chất lượng / Zalo chốt đơn"}
                      {activeScene.sceneIndex === 4 && "Ghép banner khuyến mãi / Xuất bản đa kênh"}
                    </span>
                  </div>
                </div>

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

        {/* Lưới 4 Khung Phân Cảnh Narrative Arc (Cảnh 1 - 2 - 3 - 4) */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text uppercase tracking-wider">
              Danh sách 4 Khung Phân Cảnh (Chọn cảnh để xem tiêu điểm):
            </span>
            <span className="text-[11px] text-text-muted">
              Chuẩn kịch bản Narrative Arc Chặng 04–05
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {narrativeResultScenes.map((scene) => {
              const isSelected = scene.sceneIndex === selectedSceneIndex
              const isTransparent = scene.isTransparent
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
                      isTransparent
                        ? {
                            backgroundImage:
                              "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                            backgroundSize: "16px 16px",
                            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                          }
                        : { backgroundColor: "#f8fafc" }
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
                        {scene.description}
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
                        : scene.sceneIndex === 4
                        ? "⚡ Tạo PNG tách nền"
                        : (scene.sceneIndex === 2 || scene.sceneIndex === 3) && sceneEngine === "cloud_provider"
                        ? `⚡ Sinh Cảnh ${scene.sceneIndex} (hậu cảnh Stability)`
                        : `⚡ Sinh Cảnh ${scene.sceneIndex} (Studio cục bộ)`}
                    </button>
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
            title="Phê duyệt Trọn bộ 4 Khung Ảnh Tiếp Thị (Narrative Arc)"
            description={`Đã sinh ${generatedSceneCount}/4 phân cảnh theo kịch bản Setup → Rising → Climax → CTA. Số toàn vẹn lõi hoa bên dưới là số ĐO bởi worker trên từng ảnh. Chủ shop xác nhận để tiến sang Tạo Video Marketing (Khu vực E).`}
            isApproved={judgmentB !== "blocked" && generatedSceneCount > 0}
            approveLabel="Phê duyệt Trọn bộ 4 Ảnh Biến thể & Chuyển sang Tạo Video (Khu vực E) →"
            onApprove={() => navigateToArea("e")}
            metrics={[
              { label: "Phân cảnh", value: `${generatedSceneCount}/4 đã sinh` },
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
  // Khu vực D chạy theo kịch bản Narrative Arc (24/09/2026): bối cảnh từng cảnh
  // do chủ đề Chặng 04–05 quyết định, không còn bộ chọn tay "6 bối cảnh" chạy
  // một lượt riêng. Cấu hình chỉ còn nguồn hậu cảnh Cảnh 2–3, tỉ lệ, watermark.
  const openSceneBoard = async (generateAll: boolean) => {
    const id = await ensureMaster()
    if (!id) return // lỗi hiển thị ở masterError, giữ màn cấu hình
    setPhase("result-b")
    if (generateAll) await handleGenerateAllScenes()
  }
  const sceneCreditTotal = sceneEngine === "cloud_provider" ? 6 : 4

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

      {/* Kịch bản Bối cảnh Hình ảnh (Narrative Arc) từ Chặng 04-05 */}
      {narrativeImageScenes.length > 0 && (
        <div className="w-full space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-bold text-text uppercase tracking-wider">
                Kịch bản Bối cảnh Hình ảnh (Narrative Arc — Chặng 04–05)
              </span>
            </div>
            <span className="text-[11px] text-text-muted">
              Dựa trên chủ đề: <strong>{context?.selectedTopic?.title || context?.productName || "Hoa tươi"}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {narrativeImageScenes.map((scene) => {
              const usesCloud =
                sceneEngine === "cloud_provider" && (scene.sceneIndex === 2 || scene.sceneIndex === 3)
              return (
                <div
                  key={scene.sceneIndex}
                  className="p-3.5 rounded-xl border-2 border-border bg-surface"
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Cảnh {scene.sceneIndex} · {scene.beat}
                    </span>
                    <Badge tone="neutral" className="text-[10px] px-1.5 py-0">
                      {scene.tag}
                    </Badge>
                  </div>
                  <h5 className="text-xs font-bold text-text mt-1">{scene.title}</h5>
                  <p className="text-[11.5px] text-text-muted mt-1 line-clamp-2 leading-relaxed">
                    {scene.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed border-border text-[10.5px]">
                    <span className="text-stone-500 font-medium">{scene.beatLabel}</span>
                    <span className="font-bold text-stone-500">
                      {usesCloud ? "Hậu cảnh Stability · 2 credit" : "Studio cục bộ · 1 credit"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Nguồn hậu cảnh cho Cảnh 2–3 (Cảnh 1 và 4 luôn chạy cục bộ) */}
      <div className="w-full">
        <div className="text-xs font-bold text-text mb-2">Nguồn hậu cảnh cho Cảnh 2–3:</div>
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
                  <Sparkles size={14} /> Hậu cảnh Stability (2 credit/cảnh)
                </>
              ) : (
                <>
                  <ShieldCheck size={14} /> Studio cục bộ (1 credit/cảnh)
                </>
              )}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-text-muted leading-relaxed">
          {sceneEngine === "cloud_provider"
            ? "Stability chỉ vẽ không gian trống theo bối cảnh của cảnh; bó hoa thật được dán nguyên khối từ Master Image và đo Subject Integrity. Nhà cung cấp lỗi thì worker tự lùi về phông Studio cục bộ và ghi rõ trên ảnh."
            : "Bó hoa được dán nguyên khối vào phông Studio dựng sẵn tương ứng với từng cảnh, không gọi nhà cung cấp trả phí. Worker đo Subject Integrity sau khi ghép."}
        </p>
      </div>

      {/* Multi-channel Controls (Ratio, Watermark, Credit Cost) */}
      <Card className="w-full p-4.5 border border-border bg-surface flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tùy biến xuất bản đa kênh</div>
          <Badge tone="accent" className="text-[11px] font-bold">
            Trọn bộ 4 cảnh: {sceneCreditTotal} credit
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
                <span className="block text-[11px] text-text-muted">Logo/tên tiệm từ Hồ sơ thương hiệu, áp cho Cảnh 1–3 (Cảnh 4 PNG không đóng dấu)</span>
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
          disabled={!hasImageSource || promotingMaster || generatingAllScenes}
        >
          <Sparkles size={18} strokeWidth={2} className="mr-2" />
          {promotingMaster
            ? "Đang dùng ảnh gốc làm Master..."
            : `Sinh trọn bộ 4 phân cảnh (${sceneCreditTotal} credit)`}
        </Button>
        <Button
          variant="outline"
          className="h-[48px] px-4 text-sm font-bold"
          onClick={() => void openSceneBoard(false)}
          disabled={!hasImageSource || promotingMaster}
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
