"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Camera,
  Check,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Image as ImageIcon,
  Download,
  RotateCcw,
} from "lucide-react"
import { ResultCard, type ResultField, type JudgmentState } from "@/components/result/result-card"
import { FlowSteps, type FlowStep } from "@/components/flow/flow-steps"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSession } from "@/lib/session"
import { TabActionHeader, type TabItem, type TabAction, type TabOverflowAction } from "@/components/ui/tab-header"
import { CreativeGuidanceCard } from "@/components/templates/creative-studio/creative-guidance-card"
import { BeforeAfterPreviewCard } from "@/components/templates/creative-studio/before-after-preview-card"
import {
  EnhancerProviderSelector,
  ENHANCER_PROVIDERS,
  StudioSceneSelector,
  OptimizationModeSelector,
  AppliedChangesBreakdown,
} from "@/components/templates/creative-studio"
import { getDefaultAutoCapabilityIds } from "@/modules/media/domain/optimization-capabilities"

// ============================================================
// API HELPERS
// ============================================================

const IDEMPOTENCY_KEY_HEADER = "idempotency-key"

function apiFetch(path: string, options?: RequestInit) {
  return fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
}

async function apiFetchWithAuth(path: string, options?: RequestInit) {
  const res = await apiFetch(path, options)
  if (res.status === 401) return { ok: false, status: 401 as const, data: null }
  if (!res.ok) {
    let message = `Lỗi ${res.status}`
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      message = body.error?.message ?? message
    } catch { /* ignore */ }
    return { ok: false, status: res.status, data: null, message }
  }
  return { ok: true, status: 200 as const, data: await res.json() }
}

// ============================================================
// CONFIG & FLOW DEFINITIONS
// ============================================================

const FLOW_M04A: FlowStep[] = [
  { key: "analyze", label: "Phân tích chất lượng" },
  { key: "segment", label: "Tách sản phẩm" },
  { key: "enhance", label: "Tăng cường" },
  { key: "compose", label: "Dựng bố cục" },
]

const FLOW_M04B: FlowStep[] = [
  { key: "generate", label: "Sinh biến thể" },
]

const FIELDS_M04A_DEFAULT: ResultField[] = [
  { key: "enhancer", label: "Bộ tăng cường AI (Provider)", type: "readonly", editable: false, value: "Studio AI Pipeline (Chuẩn E-commerce)" },
  { key: "resolution", label: "Độ phân giải đầu ra", type: "readonly", editable: false, value: "Chuẩn HD Master (2x Lanczos)" },
  { key: "quality-score", label: "Điểm kiểm duyệt Identity Guard", type: "readonly", editable: false, value: "Đang chờ chấm..." },
  { key: "ratio-1", label: "Tỉ lệ 1:1 (Vuông)", type: "readonly", editable: false, value: "Sẵn sàng" },
  { key: "ratio-2", label: "Tỉ lệ 4:5 (Dọc nhẹ)", type: "readonly", editable: false, value: "Sẵn sàng" },
  { key: "ratio-3", label: "Tỉ lệ 9:16 (Stories/Reels)", type: "readonly", editable: false, value: "Sẵn sàng" },
  { key: "ratio-4", label: "Tỉ lệ 16:9 (Banner)", type: "readonly", editable: false, value: "Sẵn sàng" },
  { key: "brightness", label: "Độ sáng (sửa được)", type: "text", editable: true, value: "Cân bằng tự nhiên" },
  { key: "contrast", label: "Độ tương phản (sửa được)", type: "text", editable: true, value: "Tối ưu tương phản Studio" },
]

function buildFieldsA(data: Record<string, unknown> | null, baseFields: ResultField[]): ResultField[] {
  if (!data) return baseFields
  const guard = data.identity_guard as {
    identity_score?: number
    color_score?: number
    geometry_score?: number
    component_consistency?: number
    result?: string
    ly_do?: string[]
  } | null
  const outputs = data.outputs as { master?: string | null; ratios?: Record<string, string> } | null
  const ratios = outputs?.ratios ?? {}
  const flags = (data.flags as Record<string, unknown>) ?? {}

  const idScore = guard?.identity_score != null ? guard.identity_score : 1
  const colScore = guard?.color_score != null ? guard.color_score : 1
  const geoScore = guard?.geometry_score != null ? guard.geometry_score : 1
  const compScore = guard?.component_consistency != null ? guard.component_consistency : 1

  const diemThapNhat = Math.min(idScore, colScore, geoScore, compScore)
  const diemThapNhatPercent = `${Math.round(diemThapNhat * 100)}%`
  const guardVerdict = (data.result as string) || (guard?.result as string) || "SAFE"

  const providerMap: Record<string, string> = {
    studio: "Studio AI Pipeline (Chuẩn E-commerce)",
    openai: "OpenAI Image AI (Cloud)",
    gemini: "Google Gemini Imagen (Cloud)",
    replicate: "Replicate Real-ESRGAN (Cloud GPU)",
    local: "Real-ESRGAN / PIL Lanczos (Local)",
    realesrgan: "Real-ESRGAN (Local)",
    passthrough: "PIL Lanczos 2x (Local)",
  }
  const rawProvider = String(flags.enhancer_provider || "studio")
  const displayProvider = providerMap[rawProvider] || rawProvider

  return [
    { key: "enhancer", label: "Bộ tăng cường AI (Provider)", type: "readonly", editable: false, value: displayProvider },
    { key: "resolution", label: "Độ phân giải đầu ra", type: "readonly", editable: false, value: "Chuẩn HD Master (2x Lanczos)" },
    { key: "quality-score", label: "Điểm kiểm duyệt Identity Guard", type: "readonly", editable: false, value: `${guardVerdict} (Điểm thấp nhất: ${diemThapNhatPercent})` },
    { key: "score-id", label: "1. Điểm Nhận dạng (dáng khối, vật chứa)", type: "readonly", editable: false, value: `${Math.round(idScore * 100)}%` },
    { key: "score-geo", label: "2. Điểm Hình học (hướng nhìn, tỉ lệ)", type: "readonly", editable: false, value: `${Math.round(geoScore * 100)}%` },
    { key: "score-color", label: "3. Điểm Màu sắc thành phần", type: "readonly", editable: false, value: `${Math.round(colScore * 100)}%` },
    { key: "score-comp", label: "4. Điểm Nhất quán thành phần (BOM)", type: "readonly", editable: false, value: `${Math.round(compScore * 100)}%` },
    { key: "ratio-1", label: "Tỉ lệ 1:1 (Vuông Instagram/Catalog)", type: "readonly", editable: false, value: ratios["1:1"] ? "Sẵn sàng" : "Có sẵn" },
    { key: "ratio-2", label: "Tỉ lệ 4:5 (Dọc nhẹ Facebook/Feed)", type: "readonly", editable: false, value: ratios["4:5"] ? "Sẵn sàng" : "Có sẵn" },
    { key: "ratio-3", label: "Tỉ lệ 9:16 (Full Story/Reels/TikTok)", type: "readonly", editable: false, value: ratios["9:16"] ? "Sẵn sàng" : "Có sẵn" },
    { key: "ratio-4", label: "Tỉ lệ 16:9 (Ngang Web/Banner)", type: "readonly", editable: false, value: ratios["16:9"] ? "Sẵn sàng" : "Có sẵn" },
    { key: "brightness", label: "Độ sáng (sửa được)", type: "text", editable: true, value: "Cân bằng tự nhiên" },
    { key: "contrast", label: "Độ tương phản (sửa được)", type: "text", editable: true, value: "Tối ưu tương phản Studio" },
  ]
}

const FIELDS_M04B: ResultField[] = [
  { key: "background", label: "Nền đã dùng", type: "text", editable: true, value: "Studio trắng" },
  { key: "ratio", label: "Tỉ lệ khung", type: "text", editable: true, value: "1:1" },
  { key: "watermark", label: "Watermark logo", type: "text", editable: true, value: "Bật" },
  { key: "generative-fill", label: "Cờ generative fill", type: "readonly", editable: false, value: "Có" },
  { key: "integrity", label: "Điểm toàn vẹn sản phẩm", type: "readonly", editable: false, value: "98/100" },
]

const VARIANTS = [
  { id: "v1", src: "/demo/v1.jpg", bg: "Studio trắng", ratio: "4:5", used: true },
  { id: "v2", src: "/demo/v2.jpg", bg: "Phòng khách", ratio: "1:1", used: false },
  { id: "v3", src: "/demo/v3.jpg", bg: "Khách sạn", ratio: "9:16", used: false },
]

// ============================================================
// PAGE
// ============================================================

type Phase =
  | "select"
  | "confirm-a"
  | "running-a"
  | "result-a"
  | "area-b"
  | "running-b"
  | "result-b"
  | "saved"
  | "error"

export default function CreativeStudioPage() {
  const router = useRouter()
  const session = useSession()

  const [phase, setPhase] = useState<Phase>("select")
  const [masterApproved, setMasterApproved] = useState(false)
  const [assets, setAssets] = useState<
    Array<{
      id: string
      name: string
      storage_key: string
      url?: string | null
      product_name?: string | null
      created_at?: string | null
    }>
  >([])
  const [selectedAssetId, setSelectedAssetId] = useState<string>("")
  const [selectedEnhancerProvider, setSelectedEnhancerProvider] = useState<string>("studio")
  const [selectedStudioScene, setSelectedStudioScene] = useState<string>("warm_gray")
  const [optimizationMode, setOptimizationMode] = useState<"auto" | "custom">("auto")
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(getDefaultAutoCapabilityIds())
  const [jobPhase, setJobPhase] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | null>(null)
  const [optimizationData, setOptimizationData] = useState<Record<string, unknown> | null>(null)
  const [optimizationId, setOptimizationId] = useState<string | null>(null)
  const [approvalState, setApprovalState] = useState<"pending" | "approved" | "rejected">("pending")
  const [requiresWarning, setRequiresWarning] = useState(false)
  const [fieldsA, setFieldsA] = useState<ResultField[]>(FIELDS_M04A_DEFAULT)
  const [fieldsB, setFieldsB] = useState<ResultField[]>(FIELDS_M04B)
  const [savedA, setSavedA] = useState(false)
  const [savedB, setSavedB] = useState(false)
  const [judgmentA, setJudgmentA] = useState<JudgmentState>("safe")
  const [judgmentB, setJudgmentB] = useState<JudgmentState>("safe")
  const [selectedRatio, setSelectedRatio] = useState<"1:1" | "4:5" | "9:16" | "16:9">("1:1")
  const [variantIds, setVariantIds] = useState<string[]>(["v1"])
  const [showBoundary, setShowBoundary] = useState(false)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const canOptimize = session.can("I1")
  const canApprove = session.can("I2")
  const canDownload = session.can("I3")

  // --- Load assets ---
  const loadAssets = async () => {
    setLoadingAssets(true)
    try {
      const res = await apiFetchWithAuth("/api/v1/assets?kind=ORIGINAL&limit=50")
      if (!res.ok || !res.data) {
        setErrorMsg(res.message ?? "Không tải được danh sách ảnh")
        setPhase("error")
        return
      }
      const data = res.data as {
        data?: Array<{
          id: string
          name?: string
          storage_key?: string
          filename?: string
          url?: string
          image_url?: string
          product_name?: string
          created_at?: string
        }>
      }
      const items = (data.data ?? []).map((a) => {
        const url = a.url || a.image_url || null
        const name =
          a.name ||
          a.product_name ||
          a.filename ||
          (a.storage_key ? a.storage_key.split("/").pop() : null) ||
          `Ảnh chụp #${a.id.slice(0, 8).toUpperCase()}`
        return {
          id: a.id,
          name,
          storage_key: a.storage_key ?? "",
          url,
          product_name: a.product_name ?? null,
          created_at: a.created_at ?? null,
        }
      })
      setAssets(items)
      if (items.length > 0 && !selectedAssetId && items[0]) {
        setSelectedAssetId(items[0].id)
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Không tải được danh sách ảnh")
      setPhase("error")
    } finally {
      setLoadingAssets(false)
    }
  }

  // --- Load optimization status ---
  const loadOptimization = async (jobId: string) => {
    try {
      const res = await apiFetchWithAuth(`/api/v1/media/optimizations/${jobId}`)
      if (!res.ok || !res.data) {
        setErrorMsg(res.message ?? "Không tải được trạng thái tối ưu")
        return
      }
      const opt = res.data as {
        job_id: string
        status: string
        approval: {
          state: "pending" | "approved" | "rejected"
          requires_warning: boolean
          can_approve: boolean
        }
        identity_guard?: { result?: string }
      }
      const rawData = res.data as Record<string, unknown>
      const isRejected = opt.approval.state === "rejected" || rawData.result === "REJECTED"
      setOptimizationData(rawData)
      setApprovalState(isRejected ? "rejected" : opt.approval.state)
      setRequiresWarning(opt.approval.requires_warning)
      setOptimizationId(opt.job_id)
      setFieldsA((prev) => buildFieldsA(rawData, prev))

      if (opt.approval.state === "approved") {
        setMasterApproved(true)
        setJudgmentA("safe")
      } else if (isRejected) {
        setJudgmentA("blocked")
      } else if (opt.approval.requires_warning) {
        setJudgmentA("warning")
      } else {
        setJudgmentA("safe")
      }

      if (opt.status === "COMPLETED" || opt.approval.state !== "pending") {
        setJobStatus("COMPLETED")
        setJobPhase(null)
      } else if (opt.status === "FAILED") {
        setJobStatus("FAILED")
        setJobPhase(null)
        setErrorMsg(String(rawData.error || "Tối ưu ảnh thất bại"))
        setPhase("error")
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi tải trạng thái")
    }
  }

  // --- Poll optimization ---
  const pollOptimization = async (jobId: string) => {
    try {
      const res = await apiFetchWithAuth(`/api/v1/media/optimizations/${jobId}`)
      if (!res.ok || !res.data) return
      const opt = res.data as {
        job_id: string
        status: string
        approval: { state: "pending" | "approved" | "rejected"; requires_warning: boolean; can_approve: boolean }
      }
      const rawData = res.data as Record<string, unknown>
      const isRejected = opt.approval.state === "rejected" || rawData.result === "REJECTED"
      setOptimizationData(rawData)
      setApprovalState(isRejected ? "rejected" : opt.approval.state)
      setRequiresWarning(opt.approval.requires_warning)
      setFieldsA((prev) => buildFieldsA(rawData, prev))

      if (opt.approval.state === "approved") {
        setMasterApproved(true)
        setJudgmentA("safe")
      } else if (isRejected) {
        setJudgmentA("blocked")
      } else if (opt.approval.requires_warning) {
        setJudgmentA("warning")
      }

      if (opt.status === "COMPLETED" || opt.approval.state !== "pending") {
        setJobStatus("COMPLETED")
        setJobPhase(null)
        setPhase("result-a")
      } else if (opt.status === "FAILED") {
        setJobStatus("FAILED")
        setJobPhase(null)
        setErrorMsg(String(rawData.error || "Tối ưu ảnh thất bại"))
        setPhase("error")
      } else {
        setTimeout(() => pollOptimization(jobId), 2000)
      }
    } catch { /* polling continues */ }
  }

  // --- Create optimization job ---
  function goRunningA() {
    if (!canOptimize) {
      setErrorMsg("Không có năng lực I1 (tối ưu ảnh)")
      setPhase("error")
      return
    }
    setPhase("running-a")
    setJobStatus("PENDING")
    setJobPhase("ANALYZING")
    createOptimizationJob()
  }

  async function createOptimizationJob() {
    const idempotencyKey = `opt-${Date.now()}-${crypto.randomUUID()}`
    try {
      const res = await apiFetch("/api/v1/media/optimizations", {
        method: "POST",
        headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey },
        body: JSON.stringify({
          asset_id: selectedAssetId,
          config: {
            enhancer_provider: selectedEnhancerProvider,
            studio_style: selectedStudioScene,
            mode: optimizationMode,
            selected_capabilities: optimizationMode === "custom" ? selectedCapabilities : undefined,
          },
        }),
      })
      if (!res.ok) {
        let message = "Không tạo được job tối ưu"
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          message = body.error?.message ?? message
        } catch { /* ignore */ }
        setErrorMsg(message)
        setPhase("error")
        return
      }
      const data = (await res.json()) as { job_id: string; status: string }
      setOptimizationId(data.job_id)
      setJobPhase("PROCESSING")
      pollOptimization(data.job_id)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi tạo job")
      setPhase("error")
    }
  }

  async function handleApproveAApi() {
    if (!optimizationId || !canApprove) {
      setErrorMsg("Không có năng lực I2 (duyệt ảnh)")
      return
    }
    try {
      const res = await apiFetch(`/api/v1/media/optimizations/${optimizationId}/approve`, { method: "POST" })
      if (!res.ok) {
        let message = "Không duyệt được"
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          message = body.error?.message ?? message
        } catch { /* ignore */ }
        setErrorMsg(message)
        return
      }
      const data = (await res.json()) as { approval?: { state: string } }
      setJudgmentA("safe")
      setApprovalState((data.approval?.state as "pending" | "approved" | "rejected") ?? "approved")
      setMasterApproved(true)
      setSavedA(true)
      setTimeout(() => setSavedA(false), 2000)
      await loadOptimization(optimizationId)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi duyệt")
    }
  }

  async function handleDownloadRatio(ratio?: string) {
    if (!optimizationId || !canDownload) return
    try {
      const q = ratio ? `?ratio=${encodeURIComponent(ratio)}` : ""
      const res = await apiFetch(`/api/v1/media/optimizations/${optimizationId}/download${q}`)
      if (!res.ok) {
        let message = "Không tải được"
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          message = body.error?.message ?? message
        } catch { /* ignore */ }
        setErrorMsg(message)
        return
      }
      const data = (await res.json()) as { url: string }
      window.open(data.url, "_blank")
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi tải")
    }
  }

  function toggleVariant(id: string) {
    setVariantIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  function goRunningB() {
    setPhase("running-b")
    setJobStatus("PENDING")
    setJobPhase("GENERATING")
    setTimeout(() => {
      setJobStatus("COMPLETED")
      setPhase("result-b")
    }, 2500)
  }

  async function handleApproveB() {
    setSavedB(true)
    setJudgmentB("safe")
    setSavedB(false)
    setTimeout(() => setPhase("saved"), 800)
  }

  // --- Tabs and Action Header Configuration ---
  const tabs: TabItem[] = [
    {
      id: "area-a",
      label: "Khu vực A — Tối ưu ảnh gốc (M04a)",
      ...(masterApproved ? { badge: "Đã duyệt", badgeTone: "success" as const } : {}),
    },
    {
      id: "area-b",
      label: "Khu vực B — Biến thể marketing (M04b)",
      disabled: !masterApproved,
      badge: "M04b",
      badgeTone: "neutral",
    },
  ]

  const activeTabId = phase === "area-b" || phase === "running-b" || phase === "result-b" ? "area-b" : "area-a"

  const primaryActions: TabAction[] = []
  if (phase === "result-a") {
    if (approvalState !== "approved" && judgmentA !== "blocked" && canApprove) {
      primaryActions.push({
        id: "approve-master",
        label: "Duyệt Master Image",
        icon: ShieldCheck,
        variant: "success",
        onClick: handleApproveAApi,
      })
    }
    if (canDownload && (masterApproved || approvalState === "approved")) {
      primaryActions.push({
        id: "download-master",
        label: `Tải Master (${selectedRatio})`,
        icon: Download,
        variant: "primary",
        onClick: () => handleDownloadRatio(selectedRatio),
      })
    }
    primaryActions.push({
      id: "save-draft",
      label: savedA ? "Đã lưu nháp" : "Lưu nháp",
      icon: Check,
      variant: "outline",
      onClick: () => {
        setSavedA(true)
        setTimeout(() => setSavedA(false), 2000)
      },
    })
  }

  const overflowActions: TabOverflowAction[] = [
    {
      id: "dl-1-1",
      label: "Tải tỷ lệ 1:1 (Vuông Instagram)",
      icon: Download,
      disabled: !canDownload || !optimizationId || judgmentA === "blocked",
      onClick: () => handleDownloadRatio("1:1"),
    },
    {
      id: "dl-4-5",
      label: "Tải tỷ lệ 4:5 (Dọc Feed)",
      icon: Download,
      disabled: !canDownload || !optimizationId || judgmentA === "blocked",
      onClick: () => handleDownloadRatio("4:5"),
    },
    {
      id: "dl-9-16",
      label: "Tải tỷ lệ 9:16 (Story/TikTok)",
      icon: Download,
      disabled: !canDownload || !optimizationId || judgmentA === "blocked",
      onClick: () => handleDownloadRatio("9:16"),
    },
    {
      id: "dl-16-9",
      label: "Tải tỷ lệ 16:9 (Ngang Web)",
      icon: Download,
      disabled: !canDownload || !optimizationId || judgmentA === "blocked",
      onClick: () => handleDownloadRatio("16:9"),
    },
    {
      id: "re-optimize",
      label: "Tối ưu lại với ảnh khác",
      icon: RotateCcw,
      dividerAbove: true,
      onClick: () => {
        setJudgmentA("safe")
        setPhase("confirm-a")
        loadAssets()
      },
    },
    {
      id: "go-home",
      label: "Quay về Trang chủ",
      icon: ArrowLeft,
      dividerAbove: true,
      onClick: () => router.push("/"),
    },
  ]

  // --- Render ---
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Top Header with Standard Action Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div>
          <div className="text-xs text-text-muted">M04a (Tối ưu ảnh gốc) + M04b (Biến thể Marketing)</div>
          <div className="text-[17px] font-extrabold text-primary">AI Creative Studio</div>
        </div>
        <TabActionHeader
          tabs={tabs}
          activeTab={activeTabId}
          onTabChange={(tabId) => {
            if (tabId === "area-b" && masterApproved) {
              setPhase("area-b")
            } else if (tabId === "area-a") {
              if (phase === "area-b" || phase === "result-b") {
                setPhase("result-a")
              }
            }
          }}
          primaryActions={primaryActions}
          overflowActions={overflowActions}
        />
      </div>

      {errorMsg && (
        <div className="mx-4 mt-3 rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setErrorMsg(null)}>Đóng</Button>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6 gap-6">
        {/* Standard Feature Guidance Card */}
        {(phase === "select" || phase === "confirm-a" || phase === "running-a" || phase === "result-a") && (
          <div className="w-full max-w-3xl mx-auto">
            <CreativeGuidanceCard />
          </div>
        )}

        {/* ==== AREA A: SELECT OR CONFIRM ==== */}
        {(phase === "select" || phase === "confirm-a") && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 w-full max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">Khu vực A — Tối ưu ảnh gốc & Kiểm duyệt Danh tính</div>
              <div className="mt-1 text-[13px] text-text-muted">
                {masterApproved ? "Đã có Master Image chính thức — bạn có thể tối ưu lại với ảnh khác" : "Chọn ảnh chụp xưởng hoa để nâng cấp thành Master Image chuẩn HD"}
              </div>
            </div>

            {masterApproved && (
              <div className="w-full rounded-xl bg-surface-alt p-5 text-center border border-border">
                <div className="text-[14px] font-bold text-secondary">Đã có Master Image được duyệt chính thức</div>
                <div className="text-xs text-text-muted mt-1">Bạn có thể tạo thêm biến thể ở Khu vực B hoặc tối ưu lại ảnh mới.</div>
                <div className="flex justify-center gap-3 mt-4">
                  <Button variant="outline" onClick={() => { setPhase("confirm-a"); loadAssets() }}>
                    Tối ưu lại ảnh khác
                  </Button>
                  <Button onClick={() => setPhase("area-b")} className="gap-1.5">
                    Sang Khu vực B (Biến thể) <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}

            {!masterApproved && (
              <>
                {phase === "select" && (
                  <Card className="w-full flex flex-col items-center gap-3 border-dashed border-2 border-border bg-surface-alt p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface shadow-xs">
                      <Camera size={28} strokeWidth={1.5} className="text-primary" />
                    </div>
                    <div className="text-[15px] font-bold">Chọn ảnh gốc từ kho sản phẩm</div>
                    <div className="text-[12.5px] text-text-muted max-w-md">
                      Ảnh gốc sẽ được phân tích danh tính hoa, tăng cường độ nét (Lanczos 2x), cân bằng tương phản và sinh 4 tỷ lệ chuẩn.
                    </div>
                    <Button onClick={() => { loadAssets(); setPhase("confirm-a") }} className="mt-2">
                      <Sparkles size={16} className="mr-2" /> Chọn ảnh bắt đầu
                    </Button>
                  </Card>
                )}

                {phase === "confirm-a" && (
                  <div className="w-full flex flex-col gap-4">
                    {loadingAssets && (
                      <div className="text-center py-8 text-sm text-text-muted">
                        Đang tải danh sách ảnh từ kho...
                      </div>
                    )}
                    {!loadingAssets && assets.length > 0 && (
                      <>
                        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                          Danh sách ảnh ({assets.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto p-1">
                          {assets.map((a) => (
                            <label
                              key={a.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition cursor-pointer ${
                                selectedAssetId === a.id
                                  ? "border-primary bg-primary/5 shadow-xs"
                                  : "border-border bg-surface hover:border-text-muted/40"
                              }`}
                            >
                              <input
                                type="radio"
                                name="asset"
                                checked={selectedAssetId === a.id}
                                onChange={() => setSelectedAssetId(a.id)}
                                className="accent-primary h-4 w-4 flex-shrink-0"
                              />
                              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-surface-alt flex items-center justify-center border border-border relative">
                                {a.url ? (
                                  <img
                                    src={a.url}
                                    alt={a.name}
                                    className="h-full w-full object-cover rounded-md"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none"
                                    }}
                                  />
                                ) : (
                                  <ImageIcon size={20} strokeWidth={1.5} className="text-text-muted" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-bold truncate text-text" title={a.name}>
                                  {a.name}
                                </div>
                                <div className="text-[11px] text-text-muted truncate mt-0.5">
                                  Mã: {a.id.slice(0, 8).toUpperCase()}
                                </div>
                              </div>
                              <Badge tone="neutral" className="flex-shrink-0 text-[10px]">Ảnh gốc</Badge>
                            </label>
                          ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-border">
                          <EnhancerProviderSelector
                            value={selectedEnhancerProvider}
                            onChange={setSelectedEnhancerProvider}
                          />
                        </div>

                        <div className="mt-2 pt-2 border-t border-border">
                          <StudioSceneSelector
                            value={selectedStudioScene}
                            onChange={setSelectedStudioScene}
                          />
                        </div>

                        <div className="mt-2 pt-2 border-t border-border">
                          <OptimizationModeSelector
                            mode={optimizationMode}
                            onModeChange={setOptimizationMode}
                            selectedCapabilities={selectedCapabilities}
                            onCapabilitiesChange={setSelectedCapabilities}
                            selectedProvider={selectedEnhancerProvider}
                          />
                        </div>

                        <Button
                          className="h-[48px] w-full px-8 text-sm font-bold shadow-md shadow-primary/20 mt-2"
                          onClick={goRunningA}
                          disabled={
                            !selectedAssetId ||
                            !canOptimize ||
                            (optimizationMode === "custom" && selectedCapabilities.length === 0)
                          }
                        >
                          <Sparkles size={18} strokeWidth={2} className="mr-2" />
                          Tiến hành tối ưu ảnh M04a ({ENHANCER_PROVIDERS.find((p) => p.id === selectedEnhancerProvider)?.name || "OpenAI"})
                        </Button>
                      </>
                    )}
                    {assets.length === 0 && !loadingAssets && (
                      <div className="text-center py-8 text-[13px] text-text-muted">
                        Chưa có ảnh nào trong kho. Vui lòng tải ảnh lên ở mục Nhận diện hoa trước.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ==== AREA A: RUNNING ==== */}
        {phase === "running-a" && (
          <div className="flex flex-1 flex-col items-center gap-5 w-full max-w-xl mx-auto">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">Đang tối ưu ảnh & Kiểm duyệt Identity Guard</div>
              <div className="mt-1 text-[13px] text-text-muted">{jobPhase ?? "Đang khởi tạo job..."}</div>
            </div>
            <div className="w-full">
              <FlowSteps
                steps={FLOW_M04A}
                currentStep={jobPhase ?? "analyze"}
                cancellable={jobStatus === "PENDING"}
                onCancel={() => { setJobStatus("CANCELLED"); setPhase("select") }}
                showLog
                logs={jobPhase ? [{ seq: 1, text: `Đang xử lý: ${jobPhase}...`, at: new Date().toISOString() }] : []}
              />
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-surface-alt p-4 border border-border w-full">
              <AlertTriangle size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-primary" />
              <div className="text-xs leading-relaxed text-text-muted">
                Job M04a chạy độc lập tại máy chủ — bạn có thể an tâm chuyển trang mà không làm mất tiến trình xử lý.
              </div>
            </div>
          </div>
        )}

        {/* ==== AREA A: RESULT ==== */}
        {phase === "result-a" && (
          <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="text-xs text-text-muted">④ Thẻ kết quả — M04a</div>
                <div className="text-[17px] font-extrabold">Kết quả tối ưu ảnh & Kiểm duyệt Identity Guard</div>
              </div>
              <Badge tone={savedA ? "success" : judgmentA === "blocked" ? "danger" : judgmentA === "warning" ? "warning" : "neutral"}>
                {savedA ? "Đã lưu nháp" : judgmentA === "blocked" ? "Bị từ chối" : judgmentA === "warning" ? "Cảnh báo" : "An toàn"}
              </Badge>
            </div>

            {requiresWarning && approvalState !== "approved" && (
              <div className="w-full rounded-xl border-[1.5px] border-amber-300 bg-amber-50 p-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 flex-shrink-0 text-amber-700" />
                  <div className="text-[13px] leading-relaxed text-amber-900 font-medium">
                    Lưu ý chất lượng: Identity Guard phát hiện sự khác biệt nhẹ giữa ảnh gốc và ảnh sau tối ưu. Vui lòng kiểm tra kỹ trước khi duyệt.
                  </div>
                </div>
              </div>
            )}

            {(approvalState === "rejected" || judgmentA === "blocked") && (
              <div className="w-full rounded-xl border-[1.5px] border-danger bg-danger-bg p-4.5 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={18} strokeWidth={2} className="mt-0.5 flex-shrink-0 text-danger" />
                  <div className="flex-1">
                    <div className="text-[14.5px] font-bold text-danger">
                      Identity Guard đã TỪ CHỐI ảnh này
                    </div>
                    <div className="text-[12.5px] text-danger/90 mt-0.5 leading-relaxed">
                      Ảnh sau khi tăng cường làm sai lệch đặc tính hoa thật (điểm số dưới ngưỡng an toàn 90%). Nút duyệt Master Image đã được khóa bảo vệ.
                    </div>
                  </div>
                </div>

                {Array.isArray((optimizationData?.identity_guard as { ly_do?: string[] } | undefined)?.ly_do) &&
                  ((optimizationData?.identity_guard as { ly_do?: string[] }).ly_do?.length ?? 0) > 0 && (
                    <div className="rounded-lg bg-white/70 dark:bg-black/20 p-3 border border-danger/20 text-xs">
                      <div className="font-bold text-danger mb-1.5 flex items-center gap-1.5">
                        <AlertTriangle size={14} /> Chi tiết các sai lệch được phát hiện:
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-text">
                        {((optimizationData?.identity_guard as { ly_do?: string[] }).ly_do ?? []).map((ld, i) => (
                          <li key={i} className="leading-relaxed font-medium">
                            {ld}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setJudgmentA("safe")
                      setPhase("confirm-a")
                      loadAssets()
                    }}
                    className="border-danger/30 text-danger hover:bg-danger-bg"
                  >
                    <ArrowLeft size={14} className="mr-1.5" /> Chọn ảnh khác
                  </Button>
                  <Button
                    size="sm"
                    onClick={goRunningA}
                    className="bg-danger text-white hover:bg-danger/90"
                  >
                    <RotateCcw size={14} className="mr-1.5" /> Chạy lại với ảnh này
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPhase("saved")}
                    className="text-text-muted hover:text-text ml-auto"
                  >
                    Bỏ qua tối ưu → Giữ ảnh gốc
                  </Button>
                </div>
              </div>
            )}

            {/* Before / After Preview Card with real preview URLs */}
            <BeforeAfterPreviewCard
              originalImageUrl={
                (optimizationData?.outputs as { original_url?: string | null } | undefined)?.original_url ?? null
              }
              enhancedImageUrl={(() => {
                const outputs = optimizationData?.outputs as {
                  master_url?: string | null
                  original_url?: string | null
                  ratio_urls?: Record<string, string>
                  variant_urls?: { studio?: string; lifestyle?: string; bokeh?: string }
                } | undefined
                return outputs?.ratio_urls?.[selectedRatio] || outputs?.master_url || null
              })()}
              variantUrls={
                (optimizationData?.outputs as {
                  variant_urls?: { studio?: string; lifestyle?: string; bokeh?: string }
                } | undefined)?.variant_urls
              }
              variantRatioUrls={
                (optimizationData?.outputs as {
                  variant_ratio_urls?: Record<string, Record<string, string>>
                } | undefined)?.variant_ratio_urls
              }
              aspectRatio={selectedRatio}
              availableRatios={["1:1", "4:5", "9:16", "16:9"]}
              onRatioChange={(r) => setSelectedRatio(r)}
              presetName={
                judgmentA === "blocked"
                  ? "Identity Guard: TỪ CHỐI"
                  : judgmentA === "warning"
                  ? "Identity Guard: CẢNH BÁO"
                  : "Identity Guard: AN TOÀN"
              }
              presetTone={judgmentA === "blocked" ? "danger" : judgmentA === "warning" ? "warning" : "success"}
              isRejected={judgmentA === "blocked" || approvalState === "rejected"}
              onDownload={
                canDownload && (masterApproved || approvalState === "approved")
                  ? () => handleDownloadRatio(selectedRatio)
                  : undefined
              }
              onApplyVariant={masterApproved ? () => setPhase("area-b") : undefined}
            />

            {/* Applied Changes Breakdown */}
            {(() => {
              const appliedChanges =
                (optimizationData as { applied_changes?: string[] } | undefined)?.applied_changes ||
                ((optimizationData?.parameters as { applied_changes?: string[] } | undefined)?.applied_changes) ||
                ((optimizationData?.flags as { applied_changes?: string[] } | undefined)?.applied_changes)
              const executedMode =
                (optimizationData?.parameters as { mode?: string } | undefined)?.mode || optimizationMode
              const providerUsed =
                ENHANCER_PROVIDERS.find((p) => p.id === selectedEnhancerProvider)?.name || "OpenAI"

              return (
                <AppliedChangesBreakdown
                  appliedChanges={appliedChanges}
                  mode={executedMode}
                  providerName={providerUsed}
                />
              )
            })()}

            {/* Dynamic ResultCard with Atomic Fields */}
            {(() => {
              const guardObj = optimizationData?.identity_guard as {
                identity_score?: number
                color_score?: number
                geometry_score?: number
                component_consistency?: number
              } | undefined
              const idS = guardObj?.identity_score ?? 1
              const colS = guardObj?.color_score ?? 1
              const geoS = guardObj?.geometry_score ?? 1
              const compS = guardObj?.component_consistency ?? 1
              const minScore = Math.min(idS, colS, geoS, compS)
              const scorePercent = Math.round(minScore * 100)

              return (
                <ResultCard
                  fields={fieldsA}
                  judgment={judgmentA}
                  quality={{
                    score: scorePercent,
                    label:
                      judgmentA === "blocked"
                        ? `Identity Guard: TỪ CHỐI (${scorePercent}%) — dưới ngưỡng tối thiểu 90%`
                        : judgmentA === "warning"
                        ? `Identity Guard: CẢNH BÁO (${scorePercent}%) — cần kiểm tra kỹ trước khi duyệt`
                        : `Identity Guard: TỐT (${scorePercent}%) — đạt chuẩn Master Image`,
                    status: judgmentA,
                  }}
                  onSaveDraft={() => { setSavedA(true); setTimeout(() => setSavedA(false), 2000) }}
                  onReject={() => setJudgmentA("blocked")}
                  {...(approvalState !== "approved" && approvalState !== "rejected" ? { onApprove: handleApproveAApi } : {})}
                  {...(approvalState === "rejected" ? { onRunAgain: goRunningA } : {})}
                  {...(approvalState === "rejected" ? { onSkip: () => { setPhase("saved"); setMasterApproved(true) } } : {})}
                  disabled={approvalState === "approved"}
                  onFieldChange={(key, value) => setFieldsA((p) => p.map((f) => (f.key === key ? { ...f, value } : f)))}
                />
              )
            })()}

            {approvalState !== "rejected" && (
              <div className="w-full border-t border-border pt-5">
                {masterApproved && (
                  <div className="rounded-xl bg-surface-alt p-4 mb-3 border border-border">
                    <div className="text-[12px] font-bold text-primary">
                      Ranh giới cứng: Biến thể marketing không thay đổi bản chất bó hoa. Nếu cần chỉnh ánh sáng hoặc hình dáng sản phẩm, hãy quay lại Khu vực A.
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setShowBoundary(!showBoundary)} className="mt-2">
                      {showBoundary ? "Ẩn ghi chú" : "Xem chi tiết ranh giới"}
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4 border border-primary/20">
                  <div>
                    <div className="text-[14px] font-bold text-primary">Khu vực B — Biến thể marketing (M04b)</div>
                    <div className="text-[12px] text-text-muted">
                      {masterApproved ? "Master Image đã duyệt — sẵn sàng tạo biến thể bối cảnh" : "Cần duyệt Master Image trước khi tạo biến thể"}
                    </div>
                  </div>
                  <Button onClick={goRunningB} className="flex items-center gap-2" disabled={!masterApproved}>
                    Tạo biến thể <ChevronRight size={16} strokeWidth={2.4} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==== AREA B: VARIANTS ==== */}
        {phase === "area-b" && (
          <div className="flex flex-col items-center gap-5 w-full max-w-3xl mx-auto">
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="text-xs text-text-muted">④ Thẻ kết quả — M04b</div>
                <div className="text-[17px] font-extrabold">Biến thể marketing</div>
              </div>
              <Badge tone={savedB ? "success" : judgmentB === "blocked" ? "danger" : judgmentB === "warning" ? "warning" : "neutral"}>
                {savedB ? "Đã lưu nháp" : judgmentB === "blocked" ? "Bị chặn" : judgmentB === "warning" ? "Cảnh báo" : "An toàn"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              {VARIANTS.map((v) => (
                <div
                  key={v.id}
                  className={`relative overflow-hidden rounded-xl border-2 bg-surface-alt transition ${
                    variantIds.includes(v.id) ? "border-primary shadow-sm" : "border-border"
                  }`}
                >
                  <div className="aspect-square bg-slate-900/10 flex items-center justify-center">
                    <img src={v.src} alt={`Biến thể ${v.id}`} className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute top-2 left-2 flex gap-1">
                    {variantIds.includes(v.id) && <Badge tone="accent" className="text-[10px]">Đã chọn</Badge>}
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <div className="text-[12px] font-bold">Nền: {v.bg}</div>
                    <div className="text-[11px] text-text-muted">Tỉ lệ: {v.ratio}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleVariant(v.id)}
                    className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold shadow-sm"
                  >
                    {variantIds.includes(v.id) ? "✓" : "+"}
                  </button>
                </div>
              ))}
            </div>

            {showBoundary && (
              <div className="w-full rounded-xl bg-surface-alt p-4 border border-border">
                <div className="text-[12px] text-text-muted">Khu vực A hiện lại — ảnh gốc đã được tối ưu thành Master Image chuẩn.</div>
              </div>
            )}

            <div className="w-full border-t border-border pt-5 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setPhase("result-a")}>
                <ArrowLeft size={16} strokeWidth={2} className="mr-2" /> Quay lại Khu vực A
              </Button>
              <Button onClick={() => setPhase("saved")}>
                Lưu vào Kho ảnh marketing → Quay về Trang chủ
              </Button>
            </div>
          </div>
        )}

        {/* ==== RUNNING B ==== */}
        {phase === "running-b" && (
          <div className="flex flex-1 flex-col items-center gap-5 w-full max-w-xl mx-auto">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">Đang sinh biến thể M04b</div>
              <div className="mt-1 text-[13px] text-text-muted">{jobPhase ?? "Đang sinh..."}</div>
            </div>
            <div className="w-full">
              <FlowSteps
                steps={FLOW_M04B}
                currentStep={jobPhase ?? "generate"}
                cancellable={jobStatus === "PENDING"}
                onCancel={() => { setJobStatus("CANCELLED"); setPhase("result-a") }}
              />
            </div>
          </div>
        )}

        {/* ==== RESULT B ==== */}
        {phase === "result-b" && (
          <div className="flex flex-col items-center gap-5 w-full max-w-3xl mx-auto">
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="text-xs text-text-muted">④ Thẻ kết quả — M04b (biến thể)</div>
                <div className="text-[17px] font-extrabold">Danh sách biến thể đã sinh</div>
              </div>
              <Badge tone="neutral">{variantIds.length}/{VARIANTS.length} đã chọn</Badge>
            </div>
            <ResultCard
              fields={fieldsB}
              judgment={judgmentB}
              quality={{ score: 95, label: "Biến thể đạt chuẩn marketing", status: "safe" }}
              onSaveDraft={() => { setSavedB(true); setTimeout(() => setSavedB(false), 2000) }}
              onReject={() => setJudgmentB("blocked")}
              onApprove={handleApproveB}
              disabled={!masterApproved}
              onFieldChange={(key, value) => setFieldsB((p) => p.map((f) => (f.key === key ? { ...f, value } : f)))}
            />
          </div>
        )}

        {/* ==== SAVED ==== */}
        {phase === "saved" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center my-auto">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success-bg">
              <Check size={40} strokeWidth={2} className="text-secondary" />
            </div>
            <div>
              <div className="text-[18px] font-extrabold">Đã lưu vào Kho ảnh sản phẩm</div>
              <div className="mt-1 text-[13px] text-text-muted">Master Image và các tỷ lệ Smart Reframe đã được cập nhật thành công</div>
            </div>
            <Button onClick={() => router.push("/")} className="mt-2">Quay về Trang chủ</Button>
          </div>
        )}

        {/* ==== ERROR ==== */}
        {phase === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center my-auto">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-danger-bg">
              <AlertTriangle size={40} strokeWidth={2} className="text-danger" />
            </div>
            <div>
              <div className="text-[18px] font-extrabold">Đã xảy ra lỗi</div>
              <div className="mt-1 text-[13px] text-text-muted">{errorMsg ?? "Không thể hoàn thành tác vụ"}</div>
            </div>
            <div className="flex gap-3 mt-2">
              <Button onClick={() => { setErrorMsg(null); setPhase("select") }}>Thử lại</Button>
              <Button variant="ghost" onClick={() => router.push("/")}>Quay về Trang chủ</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
