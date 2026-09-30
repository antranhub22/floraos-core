/**
 * Creative Studio — Custom Hook
 *
 * Gom toàn bộ state (~30 useState) + API logic (~15 functions) từ page.tsx
 * monolith cũ (2.166 dòng) vào 1 hook duy nhất.
 *
 * Workspace components (`OptimizeWorkspace`, `VariantWorkspace`) nhận
 * dữ liệu và actions qua return type `UseCreativeStudioReturn` mà không
 * cần biết chi tiết bên trong.
 */

"use client"

import { useState, useEffect, useRef, type ChangeEvent } from "react"

import {
  JOB_CANCELLED_MESSAGE,
  JOB_POLL_INTERVAL_MS,
  onPollFailure,
  onPollPending,
  startJobPoll,
  type JobPollState,
  type JobPollVerdict,
} from "./job-polling"
import { useRouter } from "next/navigation"
import type { ResultField, JudgmentState } from "@/components/result/result-card"
import { useSession } from "@/lib/session"
import { getDefaultAutoCapabilityIds } from "@/modules/media/domain/optimization-capabilities"
import { getVariantPreset } from "@/modules/media/domain/variant-presets"
import type {
  CameraAngleType,
  HumanInteractionType,
  StorylineMode,
} from "@/modules/media/domain/creative-studio-schemas"
import type {
  AssetItem,
  MasterItem,
  M04bVariantItem,
  M04bIntegrity,
  Phase,
  JobStatus,
  OptimizationEngine,
  VariantEngineMode,
  CloudProvider,
} from "./types"
import {
  FIELDS_M04A_DEFAULT,
  FIELDS_M04B_DEFAULT,
  buildFieldsA,
  buildFieldsB,
} from "./types"

// ============================================================
// API HELPERS (internal)
// ============================================================

const IDEMPOTENCY_KEY_HEADER = "idempotency-key"

/** Mô tả hậu cảnh cho nhánh cloud M04b từ các lựa chọn storytelling. Chỉ mô tả
 *  KHÔNG GIAN — worker luôn nối ràng buộc "không hoa, không người, không chữ". */
function buildCloudScenePrompt(camera: string, human: string, storyline: string): string {
  const parts = [
    "Elegant softly lit interior backdrop for a flower shop product photo",
    `camera: ${camera.replace(/_/g, " ")}`,
    `mood: ${storyline.replace(/_/g, " ")}`,
  ]
  if (human && human !== "none") parts.push("lifestyle setting")
  return parts.join(", ")
}

function apiFetch(path: string, options?: RequestInit) {
  return fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
}

async function apiFetchWithAuth(path: string, options?: RequestInit) {
  const res = await apiFetch(path, options)
  if (res.status === 401) return { ok: false as const, status: 401 as const, data: null }
  if (!res.ok) {
    let message = `Lỗi ${res.status}`
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      message = body.error?.message ?? message
    } catch { /* ignore */ }
    return { ok: false as const, status: res.status, data: null, message }
  }
  return { ok: true as const, status: 200 as const, data: await res.json() }
}

// ============================================================
// Return Type
// ============================================================

export interface UseCreativeStudioReturn {
  // Router
  router: ReturnType<typeof useRouter>

  // Phase
  phase: Phase
  setPhase: (p: Phase) => void

  // M04a State
  assets: AssetItem[]
  selectedAssetId: string
  setSelectedAssetId: (id: string) => void
  optimizationEngine: OptimizationEngine
  setOptimizationEngine: (e: OptimizationEngine) => void
  selectedEnhancerProvider: string
  setSelectedEnhancerProvider: (p: string) => void
  selectedStudioScene: string
  setSelectedStudioScene: (s: string) => void
  optimizationMode: "auto" | "custom"
  setOptimizationMode: (m: "auto" | "custom") => void
  selectedCapabilities: string[]
  setSelectedCapabilities: (c: string[]) => void
  masterApproved: boolean
  setMasterApproved: (v: boolean) => void
  optimizationData: Record<string, unknown> | null
  optimizationId: string | null
  approvalState: "pending" | "approved" | "rejected"
  requiresWarning: boolean
  fieldsA: ResultField[]
  setFieldsA: React.Dispatch<React.SetStateAction<ResultField[]>>
  savedA: boolean
  setSavedA: (v: boolean) => void
  judgmentA: JudgmentState
  setJudgmentA: (j: JudgmentState) => void
  selectedRatio: "1:1" | "4:5" | "9:16" | "16:9"
  setSelectedRatio: (r: "1:1" | "4:5" | "9:16" | "16:9") => void
  showBoundary: boolean
  setShowBoundary: (v: boolean) => void

  // M04b State
  approvedMasters: MasterItem[]
  selectedMasterId: string
  setSelectedMasterId: (id: string) => void
  selectedVariantPreset: string
  setSelectedVariantPreset: (id: string) => void
  watermarkEnabled: boolean
  setWatermarkEnabled: (v: boolean) => void
  variantRatio: "1:1" | "4:5" | "9:16" | "16:9"
  setVariantRatio: (r: "1:1" | "4:5" | "9:16" | "16:9") => void
  generatedVariants: M04bVariantItem[]
  variantIntegrity: M04bIntegrity | null
  selectedVariantAssetId: string
  setSelectedVariantAssetId: (id: string) => void
  fieldsB: ResultField[]
  variantEngineMode: VariantEngineMode
  setVariantEngineMode: (m: VariantEngineMode) => void
  selectedCloudProvider: CloudProvider
  setSelectedCloudProvider: (p: CloudProvider) => void
  variantJobId: string | null

  // Visual Storytelling
  cameraAngle: CameraAngleType
  setCameraAngle: (c: CameraAngleType) => void
  humanInteraction: HumanInteractionType
  setHumanInteraction: (h: HumanInteractionType) => void
  storylineMode: StorylineMode
  setStorylineMode: (s: StorylineMode) => void

  // Upload
  fileInputRef: React.RefObject<HTMLInputElement | null>
  uploadingDirect: boolean
  handleDirectUpload: (e: ChangeEvent<HTMLInputElement>) => Promise<void>

  // Job
  jobPhase: string | null
  jobStatus: JobStatus
  setJobStatus: (s: JobStatus) => void
  judgmentB: JudgmentState

  // Loading/Error
  loadingAssets: boolean
  loadingMasters: boolean
  errorMsg: string | null
  setErrorMsg: (msg: string | null) => void

  // Capabilities
  canOptimize: boolean
  canApprove: boolean
  canDownload: boolean
  canRunVariant: boolean
  canApproveVariantCap: boolean

  // Actions
  loadAssets: () => Promise<void>
  loadApprovedMasters: () => Promise<void>
  goRunningA: () => void
  handleApproveAApi: () => Promise<void>
  handleDownloadRatio: (ratio?: string) => Promise<void>
  goRunningB: (masterIdOverride?: string) => Promise<void>
  handleApproveB: () => Promise<void>
  handleDownloadVariant: (assetId: string) => Promise<void>
  selectVariant: (assetId: string) => void
  promoteOriginalToMaster: (assetId: string) => Promise<void>
}

// ============================================================
// Hook
// ============================================================

export function useCreativeStudioData(): UseCreativeStudioReturn {
  const router = useRouter()
  const session = useSession()

  // --- Phase ---
  const [phase, setPhase] = useState<Phase>("select")

  // --- M04a States ---
  const [masterApproved, setMasterApproved] = useState(false)
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState<string>("")
  // PO 25/09/2026: nhà cung cấp trước — mặc định chuỗi nhà cung cấp theo thứ tự của tiệm.
  const [optimizationEngine, setOptimizationEngine] = useState<OptimizationEngine>("cloud_provider")
  const [selectedEnhancerProvider, setSelectedEnhancerProvider] = useState<string>("auto")
  const [selectedStudioScene, setSelectedStudioScene] = useState<string>("warm_gray")
  const [optimizationMode, setOptimizationMode] = useState<"auto" | "custom">("auto")
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(getDefaultAutoCapabilityIds())
  const [jobPhase, setJobPhase] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus>(null)
  const [optimizationData, setOptimizationData] = useState<Record<string, unknown> | null>(null)
  const [optimizationId, setOptimizationId] = useState<string | null>(null)
  const [approvalState, setApprovalState] = useState<"pending" | "approved" | "rejected">("pending")
  const [requiresWarning, setRequiresWarning] = useState(false)
  const [fieldsA, setFieldsA] = useState<ResultField[]>(FIELDS_M04A_DEFAULT)
  const [fieldsB, setFieldsB] = useState<ResultField[]>(FIELDS_M04B_DEFAULT)
  const [savedA, setSavedA] = useState(false)
  const [judgmentA, setJudgmentA] = useState<JudgmentState>("safe")
  const [judgmentB, setJudgmentB] = useState<JudgmentState>("safe")
  const [selectedRatio, setSelectedRatio] = useState<"1:1" | "4:5" | "9:16" | "16:9">("1:1")
  const [selectedVariantAssetId, setSelectedVariantAssetId] = useState<string>("")
  const [showBoundary, setShowBoundary] = useState(false)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // --- M04b States ---
  const [approvedMasters, setApprovedMasters] = useState<MasterItem[]>([])
  const [selectedMasterId, setSelectedMasterId] = useState<string>("")
  const [selectedVariantPreset, setSelectedVariantPreset] = useState<string>("transparent")
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(true)
  const [variantRatio, setVariantRatio] = useState<"1:1" | "4:5" | "9:16" | "16:9">("1:1")
  const [generatedVariants, setGeneratedVariants] = useState<M04bVariantItem[]>([])
  const [variantJobId, setVariantJobId] = useState<string | null>(null)
  const [variantIntegrity, setVariantIntegrity] = useState<M04bIntegrity | null>(null)
  const [loadingMasters, setLoadingMasters] = useState(false)
  const [variantEngineMode, setVariantEngineMode] = useState<VariantEngineMode>("cloud_provider")
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<CloudProvider>("stability")

  // --- Visual Storytelling States ---
  const [cameraAngle, setCameraAngle] = useState<CameraAngleType>("front_view")
  const [humanInteraction, setHumanInteraction] = useState<HumanInteractionType>("none")
  const [storylineMode, setStorylineMode] = useState<StorylineMode>("single_shot")

  // --- File Upload ---
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Token của vòng poll đang chạy (Khu vực A/B). Tăng khi bắt đầu vòng mới
  // hoặc khi rời trang — vòng cũ thấy token lệch thì tự dừng.
  const pollTokenRef = useRef(0)
  const [uploadingDirect, setUploadingDirect] = useState(false)

  // --- Capabilities ---
  const canOptimize = session.can("I1")
  const canApprove = session.can("I2")
  const canDownload = session.can("I3")
  const canRunVariant = session.can("I4")
  const canApproveVariantCap = session.can("I5")

  // ============================================================
  // API Functions
  // ============================================================

  const handleDirectUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file) return

    setUploadingDirect(true)
    setErrorMsg(null)
    try {
      const urlRes = await apiFetch("/api/v1/assets/upload-url", {
        method: "POST",
        body: JSON.stringify({ product_id: null, mime_type: file.type }),
      })
      if (!urlRes.ok) {
        let msg = "Không xin được URL tải lên"
        try {
          const body = (await urlRes.json()) as { error?: { message?: string } }
          msg = body.error?.message ?? msg
        } catch { /* ignore */ }
        throw new Error(msg)
      }
      const { asset_id, storage_key, upload_url } = (await urlRes.json()) as {
        asset_id: string
        storage_key: string
        upload_url: string
      }

      const putRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error(`Tải ảnh lên kho thất bại (${putRes.status})`)

      const registerRes = await apiFetch("/api/v1/assets", {
        method: "POST",
        body: JSON.stringify({
          asset_id,
          product_id: null,
          kind: "ORIGINAL",
          storage_key,
          mime_type: file.type,
          file_size: file.size,
        }),
      })
      if (!registerRes.ok) throw new Error("Không đăng ký được asset vào hệ thống")

      const newAsset: AssetItem = {
        id: asset_id,
        name: file.name.replace(/\.[^.]+$/, ""),
        storage_key,
        url: URL.createObjectURL(file),
        product_name: null,
        created_at: new Date().toISOString(),
      }

      setAssets((prev) => [newAsset, ...prev])
      setSelectedAssetId(asset_id)
      setPhase("confirm-a")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi khi tải ảnh lên")
    } finally {
      setUploadingDirect(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

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
      const items: AssetItem[] = (data.data ?? []).map((a) => {
        const url = a.url || a.image_url || null
        const name =
          a.name ||
          a.product_name ||
          a.filename ||
          (a.storage_key ? a.storage_key.split("/").pop() : null) ||
          `Ảnh chụp #${a.id.slice(0, 8).toUpperCase()}`
        return {
          id: a.id,
          name: name ?? "",
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

  const loadApprovedMasters = async () => {
    setLoadingMasters(true)
    try {
      const res = await apiFetchWithAuth("/api/v1/assets?kind=MASTER&approval_state=APPROVED&limit=50")
      if (res.ok && res.data) {
        const data = res.data as {
          data?: Array<{
            id: string
            name?: string
            url?: string
            image_url?: string
            product_id?: string
            product_name?: string
            storage_key: string
          }>
        }
        const items: MasterItem[] = (data.data ?? []).map((a) => ({
          id: a.id,
          name: a.name || a.product_name || `Master #${a.id.slice(0, 8).toUpperCase()}`,
          url: a.url || a.image_url || null,
          product_id: a.product_id ?? null,
          product_name: a.product_name ?? null,
          storage_key: a.storage_key,
        }))
        setApprovedMasters(items)
        if (items.length > 0) {
          setMasterApproved(true)
          setSelectedMasterId((prev) => prev || items[0]!.id)
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingMasters(false)
    }
  }

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

  /** Lượt poll kế tiếp, hoặc dừng và báo lỗi khi lỗi không tự khỏi / quá hạn. */
  function continuePolling(verdict: JobPollVerdict, token: number, next: (state: JobPollState) => void): void {
    if (token !== pollTokenRef.current) return
    if (verdict.retry) {
      const state = verdict.state
      setTimeout(() => next(state), JOB_POLL_INTERVAL_MS)
      return
    }
    setJobPhase(null)
    setErrorMsg(verdict.message)
    setPhase("error")
  }

  const pollOptimization = async (
    jobId: string,
    state: JobPollState = startJobPoll(),
    token: number = ++pollTokenRef.current
  ) => {
    if (token !== pollTokenRef.current) return
    const again = (s: JobPollState) => void pollOptimization(jobId, s, token)
    try {
      const res = await apiFetchWithAuth(`/api/v1/media/optimizations/${jobId}`)
      if (token !== pollTokenRef.current) return
      if (!res.ok || !res.data) {
        continuePolling(onPollFailure(res.status, state), token, again)
        return
      }
      const opt = res.data as {
        job_id: string
        status: string
        stage?: string | null
        approval: { state: "pending" | "approved" | "rejected"; requires_warning: boolean; can_approve: boolean }
      }
      if (opt.stage) {
        setJobPhase(opt.stage)
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
      } else if (opt.status === "CANCELLED") {
        setJobStatus("CANCELLED")
        setJobPhase(null)
        setErrorMsg(JOB_CANCELLED_MESSAGE)
        setPhase("error")
      } else {
        continuePolling(onPollPending(state), token, again)
      }
    } catch {
      continuePolling(onPollFailure(null, state), token, again)
    }
  }

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
            engine: optimizationEngine,
            enhancer_provider: optimizationEngine === "cloud_provider" ? selectedEnhancerProvider : "studio",
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
      // Cả hai bộ máy (Local Studio / nhà cung cấp) đều vào hàng đợi — 25/09/2026, nợ #120.
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

  function selectVariant(assetId: string) {
    setSelectedVariantAssetId(assetId)
  }

  async function goRunningB(masterIdOverride?: string) {
    if (!canRunVariant) {
      setErrorMsg("Không có năng lực I4 (dựng biến thể marketing)")
      setPhase("error")
      return
    }
    const masterId = masterIdOverride || selectedMasterId || approvedMasters[0]?.id || ""
    if (!masterId) {
      setErrorMsg(
        "Chưa có Master Image đã duyệt cho ảnh này. Bấm “Dùng ảnh gốc làm Master” ở mục nguồn ảnh (cần quyền I2), hoặc tối ưu ảnh ở Tải ảnh rồi duyệt Master."
      )
      setPhase("error")
      return
    }

    setPhase("running-b")
    setJobStatus("PENDING")
    setJobPhase(null)
    setErrorMsg(null)
    setGeneratedVariants([])
    setVariantIntegrity(null)
    setSelectedVariantAssetId("")

    const idempotencyKey = `var-${crypto.randomUUID()}`
    try {
      const isCloudEngine = variantEngineMode === "cloud_provider"
      const res = await apiFetch("/api/v1/media/variants", {
        method: "POST",
        headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey },
        // 23/09/2026: cả hai nhánh đi qua hàng đợi job; nhánh cloud gửi mô tả
        // HẬU CẢNH (không mô tả bó hoa) — bó hoa dán nguyên khối ở worker.
        body: JSON.stringify({
          master_asset_id: masterId,
          engine: variantEngineMode,
          preset: selectedVariantPreset,
          ratio: variantRatio,
          watermark: watermarkEnabled,
          ...(isCloudEngine
            ? {
                provider_key: "stability",
                scene_prompt: buildCloudScenePrompt(cameraAngle, humanInteraction, storylineMode),
              }
            : {}),
        }),
      })
      if (!res.ok) {
        let message = "Không tạo được job biến thể"
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          message = body.error?.message ?? message
        } catch { /* ignore */ }
        setErrorMsg(message)
        setPhase("error")
        return
      }
      const data = (await res.json()) as { job_id: string }
      setVariantJobId(data.job_id)
      pollVariantJob(data.job_id)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi tạo job biến thể")
      setPhase("error")
    }
  }

  async function pollVariantJob(
    jobId: string,
    state: JobPollState = startJobPoll(),
    token: number = ++pollTokenRef.current
  ) {
    if (token !== pollTokenRef.current) return
    const again = (s: JobPollState) => void pollVariantJob(jobId, s, token)
    try {
      const res = await apiFetchWithAuth(`/api/v1/media/variants/${jobId}`)
      if (token !== pollTokenRef.current) return
      if (!res.ok || !res.data) {
        continuePolling(onPollFailure(res.status, state), token, again)
        return
      }
      const chiTiet = res.data as {
        status: string
        stage: string | null
        error: string | null
        result: string | null
        source: { preset: string | null; ratio: string | null; watermark: boolean }
        subject_integrity: M04bIntegrity | null
        variants: M04bVariantItem[]
        approval: { can_approve: boolean; requires_warning: boolean }
      }

      setJobPhase(chiTiet.stage)
      setVariantIntegrity(chiTiet.subject_integrity)
      setFieldsB(buildFieldsB(chiTiet.source, chiTiet.subject_integrity, getVariantPreset))

      if (chiTiet.status === "COMPLETED") {
        setJobStatus("COMPLETED")
        setJobPhase(null)
        setGeneratedVariants(chiTiet.variants)
        setSelectedVariantAssetId(chiTiet.variants[0]?.asset_id ?? "")
        // COMPLETED + result=REJECTED: cổng Subject Integrity chặn, không asset
        // nào được ghi — không phải lỗi kỹ thuật (AGENTS.md: ba trục tách rời).
        setJudgmentB(
          chiTiet.result === "REJECTED" || chiTiet.subject_integrity?.result === "REJECTED"
            ? "blocked"
            : chiTiet.subject_integrity?.result === "WARNING" || chiTiet.approval.requires_warning
            ? "warning"
            : "safe"
        )
        setPhase("result-b")
        return
      }

      if (chiTiet.status === "FAILED") {
        setJobStatus("FAILED")
        setJobPhase(null)
        setErrorMsg(chiTiet.error ?? "Dựng biến thể thất bại")
        setPhase("error")
        return
      }

      if (chiTiet.status === "CANCELLED") {
        setJobStatus("CANCELLED")
        setJobPhase(null)
        setErrorMsg(JOB_CANCELLED_MESSAGE)
        setPhase("error")
        return
      }

      setJobStatus("PROCESSING")
      continuePolling(onPollPending(state), token, again)
    } catch {
      continuePolling(onPollFailure(null, state), token, again)
    }
  }

  async function handleApproveB() {
    if (!canApproveVariantCap) {
      setErrorMsg("Không có năng lực I5 (duyệt biến thể marketing)")
      return
    }
    if (!variantJobId || !selectedVariantAssetId) {
      setErrorMsg("Chưa chọn biến thể nào để duyệt")
      return
    }
    try {
      const res = await apiFetch(`/api/v1/media/variants/${variantJobId}/approve`, {
        method: "POST",
        body: JSON.stringify({ asset_id: selectedVariantAssetId }),
      })
      if (!res.ok) {
        let message = "Không duyệt được biến thể"
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          message = body.error?.message ?? message
        } catch { /* ignore */ }
        setErrorMsg(message)
        return
      }
      const data = (await res.json()) as { variants: M04bVariantItem[] }
      setGeneratedVariants(data.variants)
      setJudgmentB("safe")
      setErrorMsg(null)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi duyệt biến thể")
    }
  }

  async function handleDownloadVariant(assetId: string) {
    if (!variantJobId || !canDownload) {
      setErrorMsg("Không có năng lực I3 (tải ảnh)")
      return
    }
    try {
      const res = await apiFetch(
        `/api/v1/media/variants/${variantJobId}/download?asset_id=${encodeURIComponent(assetId)}`
      )
      if (!res.ok) {
        let message = "Không tải được biến thể"
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
      setErrorMsg(e instanceof Error ? e.message : "Lỗi tải biến thể")
    }
  }

  /**
   * [MỚI] Skip M04a — Duyệt nhanh ảnh ORIGINAL thành MASTER 1-chạm.
   * Backend tạo bản sao asset mới `kind=MASTER`, `approval_state=APPROVED`.
   */
  async function promoteOriginalToMaster(assetId: string) {
    if (!canApprove) {
      setErrorMsg("Không có năng lực I2 (duyệt ảnh)")
      return
    }
    setErrorMsg(null)
    try {
      const res = await apiFetch("/api/v1/media/promote-to-master", {
        method: "POST",
        body: JSON.stringify({ asset_id: assetId }),
      })
      if (!res.ok) {
        let message = "Không tạo được Master từ ảnh gốc"
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          message = body.error?.message ?? message
        } catch { /* ignore */ }
        setErrorMsg(message)
        return
      }
      const data = (await res.json()) as {
        master_asset_id: string
        approval_state: string
        name?: string
        url?: string
        storage_key?: string
      }

      // Thêm master mới vào danh sách và chọn ngay
      const originalAsset = assets.find((a) => a.id === assetId)
      const newMaster: MasterItem = {
        id: data.master_asset_id,
        name: data.name || originalAsset?.name || `Master #${data.master_asset_id.slice(0, 8).toUpperCase()}`,
        storage_key: data.storage_key || originalAsset?.storage_key || "",
        url: data.url || originalAsset?.url || null,
        product_id: null,
        product_name: originalAsset?.product_name ?? null,
      }

      setApprovedMasters((prev) => [newMaster, ...prev])
      setSelectedMasterId(data.master_asset_id)
      setMasterApproved(true)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi tạo Master từ ảnh gốc")
    }
  }

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ state từ nguồn ngoài (URL/API), chủ đích
    loadAssets()
    loadApprovedMasters()
    // Rời trang thì mọi vòng poll đang chạy tự dừng ở lượt kế tiếp. Ref này
    // là bộ đếm chứ không trỏ node DOM — đọc giá trị lúc dọn là chủ đích.
    const pollToken = pollTokenRef
    return () => {
      pollToken.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============================================================
  // Return
  // ============================================================

  return {
    router,
    phase,
    setPhase,
    assets,
    selectedAssetId,
    setSelectedAssetId,
    optimizationEngine,
    setOptimizationEngine,
    selectedEnhancerProvider,
    setSelectedEnhancerProvider,
    selectedStudioScene,
    setSelectedStudioScene,
    optimizationMode,
    setOptimizationMode,
    selectedCapabilities,
    setSelectedCapabilities,
    masterApproved,
    setMasterApproved,
    optimizationData,
    optimizationId,
    approvalState,
    requiresWarning,
    fieldsA,
    setFieldsA,
    savedA,
    setSavedA,
    judgmentA,
    setJudgmentA,
    selectedRatio,
    setSelectedRatio,
    showBoundary,
    setShowBoundary,
    approvedMasters,
    selectedMasterId,
    setSelectedMasterId,
    selectedVariantPreset,
    setSelectedVariantPreset,
    watermarkEnabled,
    setWatermarkEnabled,
    variantRatio,
    setVariantRatio,
    generatedVariants,
    variantIntegrity,
    selectedVariantAssetId,
    setSelectedVariantAssetId,
    fieldsB,
    variantEngineMode,
    setVariantEngineMode,
    selectedCloudProvider,
    setSelectedCloudProvider,
    variantJobId,
    cameraAngle,
    setCameraAngle,
    humanInteraction,
    setHumanInteraction,
    storylineMode,
    setStorylineMode,
    fileInputRef,
    uploadingDirect,
    handleDirectUpload,
    jobPhase,
    jobStatus,
    setJobStatus,
    judgmentB,
    loadingAssets,
    loadingMasters,
    errorMsg,
    setErrorMsg,
    canOptimize,
    canApprove,
    canDownload,
    canRunVariant,
    canApproveVariantCap,
    loadAssets,
    loadApprovedMasters,
    goRunningA,
    handleApproveAApi,
    handleDownloadRatio,
    goRunningB,
    handleApproveB,
    handleDownloadVariant,
    selectVariant,
    promoteOriginalToMaster,
  }
}
