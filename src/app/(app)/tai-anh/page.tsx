"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, ChevronRight, Check, AlertTriangle, Sparkles, ArrowLeft } from "lucide-react"
import { ResultCard, type ResultField, type ResultImage, type JudgmentState } from "@/components/result/result-card"
import { FlowSteps, type FlowStep } from "@/components/flow/flow-steps"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSession } from "@/lib/session"

// ============================================================
// API HELPERS
// ============================================================

const IDEMPOTENCY_KEY_HEADER = "idempotency-key"

function apiFetch(path: string, options?: RequestInit) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
}

async function apiFetchWithAuth(path: string, options?: RequestInit) {
  const res = await apiFetch(path, options)
  if (res.status === 401) {
    return { ok: false, status: 401 as const, data: null }
  }
  if (!res.ok) {
    let message = `Lỗi ${res.status}`
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      message = body.error?.message ?? message
    } catch { /* ignore */ }
    return { ok: false, status: res.status as any, data: null, message }
  }
  const data = await res.json()
  return { ok: true, status: 200 as const, data }
}

// ============================================================
// FIELD MAPPER — raw analysis → ResultField[]
// ============================================================

function mapAnalysisToFields1(raw: Record<string, unknown>): ResultField[] {
  const bom = (raw.bom as Record<string, unknown> | undefined) ?? {}
  const identity = (raw.identity as Record<string, unknown> | undefined) ?? {}
  const colors = (raw.colors as Record<string, unknown> | undefined) ?? {}

  const flowers = Array.isArray(bom.flowers)
    ? bom.flowers.map((f: { name?: string; count?: number }, i: number) => ({
        id: `flower-${i}`,
        value: `${f.name ?? `Loại ${i + 1}`}${f.count != null ? ` — ${f.count} cành` : ""}`,
      }))
    : []

  const foliage = Array.isArray(bom.foliage)
    ? bom.foliage.map((f: { name?: string; count?: number }, i: number) => ({
        id: `foliage-${i}`,
        value: `${f.name ?? `Phụ kiện ${i + 1}`}${f.count != null ? ` — ${f.count}` : ""}`,
      }))
    : []

  const wrapping = Array.isArray(bom.wrapping)
    ? bom.wrapping.map((w: { name?: string }, i: number) => ({
        id: `wrapping-${i}`,
        value: w.name ?? `Bao bì ${i + 1}`,
      }))
    : []

  const colorList = Array.isArray(colors.list)
    ? colors.list.map((c: { name?: string }, i: number) => ({
        id: `color-${i}`,
        value: c.name ?? `Tone ${i + 1}`,
      }))
    : Array.isArray(colors.tones)
      ? colors.tones.map((c: { name?: string }, i: number) => ({
          id: `color-${i}`,
          value: c.name ?? `Tone ${i + 1}`,
        }))
      : []

  const confidence = typeof raw.confidence === "number" ? raw.confidence : typeof raw.confidence === "object" && raw.confidence != null ? (raw.confidence as Record<string, unknown>).overall ?? null : null
  const confidenceNum = typeof confidence === "number" ? confidence : null

  return [
    { key: "flowers", label: "Danh sách loại hoa", type: "list", editable: true, value: flowers, confidence: confidenceNum, placeholder: "Thêm loại hoa..." },
    { key: "foliage", label: "Lá, phụ kiện đi kèm", type: "list", editable: true, value: foliage, confidence: confidenceNum, placeholder: "Thêm lá/phụ kiện..." },
    { key: "wrapping", label: "Giấy gói, nơ", type: "list", editable: true, value: wrapping, confidence: confidenceNum, placeholder: "Thêm giấy gói/nơ..." },
    { key: "colors", label: "Màu sắc chủ đạo (tối đa 3 tone)", type: "list", editable: true, value: colorList, confidence: confidenceNum, placeholder: "Thêm tone màu..." },
    { key: "shape", label: "Hình dáng / vật chứa", type: "text", editable: true, value: (identity.shape as string) ?? "—", confidence: null },
    { key: "container", label: "Vật chứa", type: "text", editable: true, value: (identity.container as string) ?? "—", confidence: null },
    { key: "totals", label: "Tổng số cành", type: "readonly", editable: false, value: typeof raw.total_stems === "number" ? `${raw.total_stems} cành` : (raw.tong_so_cành as string) ?? "—" },
    { key: "totals-bud", label: "Tổng số nụ", type: "readonly", editable: false, value: typeof raw.total_buds === "number" ? `${raw.total_buds} nụ` : (raw.tong_so_nu as string) ?? "—" },
    { key: "totals-damaged", label: "Tổng số cành hỏng", type: "readonly", editable: false, value: typeof raw.total_damaged === "number" ? `${raw.total_damaged} cành` : (raw.tong_so_can_hong as string) ?? "—" },
    { key: "confidence", label: "Độ tin cậy tổng thể", type: "readonly", editable: false, value: confidenceNum != null ? `${confidenceNum}%` : "—" },
  ]
}

function mapSalesFields(raw: Record<string, unknown>): ResultField[] {
  const identity = (raw.identity as Record<string, unknown> | undefined) ?? {}
  return [
    { key: "name", label: "Tên sản phẩm", type: "text", editable: true, value: (raw.product_name as string) ?? (identity.category as string) ?? "—" },
    { key: "desc", label: "Mô tả bó hoa", type: "textarea", editable: true, value: (raw.description as string) ?? "" },
    { key: "tags", label: "Thẻ phân loại", type: "list", editable: true, value: [], confidence: null, placeholder: "Thêm thẻ..." },
    { key: "tones", label: "Tone màu dạng nhãn bán hàng", type: "list", editable: true, value: [], confidence: null, placeholder: "Thêm tone..." },
    { key: "style", label: "Phong cách thiết kế", type: "text", editable: true, value: (raw.style as string) ?? "—" },
    { key: "occasions", label: "Dịp phù hợp", type: "list", editable: true, value: [], confidence: null, placeholder: "Thêm dịp..." },
    { key: "price-segment", label: "Phân khúc giá gợi ý", type: "readonly", editable: false, value: (raw.price_segment as string) ?? "Xem từ M02" },
  ]
}

// ============================================================
// FIELD MAPPER — product copy → ResultField[] (M01b)
// ============================================================

function mapProductCopyToFields2(copy: Record<string, unknown>, analysisRaw: Record<string, unknown> | null): ResultField[] {
  const identity = analysisRaw ? (analysisRaw.identity as Record<string, unknown> | undefined) ?? {} : {}
  return [
    { key: "name", label: "Tên sản phẩm", type: "text", editable: true, value: (copy.suggested_name as string) ?? (identity.style as string) ?? "—" },
    { key: "desc", label: "Mô tả bó hoa", type: "textarea", editable: true, value: (copy.suggested_description as string) ?? "" },
    { key: "tags", label: "Thẻ phân loại", type: "list", editable: true, value: (copy.suggested_tags as string[]) ?? [], confidence: null, placeholder: "Thêm thẻ..." },
    { key: "tones", label: "Tone màu dạng nhãn bán hàng", type: "list", editable: true, value: (copy.suggested_tags as string[]) ?? (Array.isArray(identity.color_tone) ? identity.color_tone as string[] : []), confidence: null, placeholder: "Thêm tone..." },
    { key: "style", label: "Phong cách thiết kế", type: "text", editable: true, value: (copy.suggested_style as string) ?? (identity.style as string) ?? "—" },
    { key: "occasions", label: "Dịp phù hợp", type: "list", editable: true, value: (copy.suggested_occasions as string[]) ?? [], confidence: null, placeholder: "Thêm dịp..." },
    { key: "price-segment", label: "Phân khúc giá gợi ý", type: "readonly", editable: false, value: (copy.suggested_price_segment as string) ?? "—" },
  ]
}

// ============================================================
// MOCK DATA — chỉ dùng khi chưa có phân tích thật
// ============================================================

const FLOW_M01: FlowStep[] = [
  { key: "detect", label: "Nhận diện cấu phần" },
  { key: "count", label: "Đếm số lượng" },
  { key: "color", label: "Phân tích màu sắc" },
  { key: "style", label: "Nhận diện phong cách" },
]

// ============================================================
// PAGE
// ============================================================

type Phase =
  | "upload"
  | "confirm"
  | "running"
  | "result1"
  | "suggest"
  | "result2"
  | "saved"
  | "error"

export default function TaiAnhPage() {
  const router = useRouter()
  const session = useSession()

  const [phase, setPhase] = useState<Phase>("upload")
  const [assets, setAssets] = useState<Array<{ id: string; name: string; storage_key: string }>>([])
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [jobPhase, setJobPhase] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | null>(null)
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [approvalState, setApprovalState] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING")
  const [editedFields, setEditedFields] = useState<Record<string, unknown> | null>(null)
  const [judgment1, setJudgment1] = useState<JudgmentState>("safe")
  const [judgment2, setJudgment2] = useState<JudgmentState>("safe")
  const [saved1, setSaved1] = useState(false)
  const [saved2, setSaved2] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [productCopyData, setProductCopyData] = useState<Record<string, unknown> | null>(null)
  const [copyId, setCopyId] = useState<string | null>(null)
  const [copyApprovalState, setCopyApprovalState] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING")
  const [copyLoading, setCopyLoading] = useState(false)

  const canAnalyze = session.can("H1")
  const canEdit = session.can("H2")
  const canApprove = session.can("H3")
  const canH5 = session.can("H5")
  const canH6 = session.can("H6")

  // --- Load assets ---
  const loadAssets = async () => {
    setLoadingAssets(true)
    try {
      const res = await apiFetchWithAuth("/api/v1/assets?limit=50")
      if (!res.ok || !res.data) {
        setErrorMsg(res.message ?? "Không tải được danh sách ảnh")
        setPhase("error")
        return
      }
      const data = res.data as { data?: Array<{ id: string; name?: string; storage_key?: string; filename?: string }> }
      const items = (data.data ?? []).map((a) => ({
        id: a.id,
        name: a.name ?? a.filename ?? a.storage_key ?? a.id,
        storage_key: a.storage_key ?? "",
      }))
      setAssets(items)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Không tải được danh sách ảnh")
      setPhase("error")
    } finally {
      setLoadingAssets(false)
    }
  }

  // --- Load analysis ---
  const loadAnalysis = async (id: string) => {
    try {
      const res = await apiFetchWithAuth(`/api/v1/vision/analyses/${id}`)
      if (!res.ok || !res.data) {
        setErrorMsg(res.message ?? "Không tải được kết quả phân tích")
        return
      }
      const analysis = res.data as {
        id: string
        raw: Record<string, unknown>
        edited: Record<string, unknown> | null
        approval_state: "PENDING" | "APPROVED" | "REJECTED"
        job_id: string
        provider: string
        model: string
      }
      setAnalysisData(analysis.raw)
      setEditedFields(analysis.edited)
      setApprovalState(analysis.approval_state)
      setAnalysisId(analysis.id)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi tải phân tích")
    }
  }

  // --- Poll analysis status ---
  const pollAnalysis = async (id: string) => {
    try {
      const res = await apiFetchWithAuth(`/api/v1/vision/analyses/${id}`)
      if (!res.ok || !res.data) return
      const analysis = res.data as {
        id: string
        raw: Record<string, unknown>
        edited: Record<string, unknown> | null
        approval_state: "PENDING" | "APPROVED" | "REJECTED"
        status?: string
        stage?: string
        job_id: string
      }
      setAnalysisData(analysis.raw)
      setEditedFields(analysis.edited)
      setApprovalState(analysis.approval_state)
      setAnalysisId(analysis.id)
      if (analysis.status === "COMPLETED" || analysis.approval_state !== "PENDING") {
        setJobStatus("COMPLETED")
        setJobPhase(null)
      }
    } catch { /* polling will continue */ }
  }

  // --- M01b: Product Copy APIs ---
  async function generateProductCopyApi(analysisId: string, productId?: string | null) {
    setCopyLoading(true)
    try {
      const res = await apiFetch("/api/v1/product-copies/generate", {
        method: "POST",
        body: JSON.stringify({ analysisId, productId }),
      })
      if (!res.ok) {
        let message = "Không tạo được dữ liệu bán hàng"
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          message = body.error?.message ?? message
        } catch { /* ignore */ }
        setErrorMsg(message)
        return null
      }
      const data = (await res.json()) as { copyId: string; raw: unknown }
      setCopyId(data.copyId)
      setProductCopyData(data.raw as Record<string, unknown>)
      return data
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi tạo dữ liệu bán hàng")
      return null
    } finally {
      setCopyLoading(false)
    }
  }

  async function fetchProductCopyApi(id: string) {
    try {
      const res = await apiFetchWithAuth(`/api/v1/product-copies/${id}`)
      if (!res.ok || !res.data) return null
      return res.data as Record<string, unknown>
    } catch { return null }
  }

  async function updateProductCopyApi(id: string, edited: Record<string, unknown>) {
    try {
      const res = await apiFetchWithAuth(`/api/v1/product-copies/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ edited }),
      })
      if (!res.ok || !res.data) return null
      return res.data as Record<string, unknown>
    } catch { return null }
  }

  async function approveProductCopyApi(id: string) {
    try {
      const res = await apiFetchWithAuth(`/api/v1/product-copies/${id}/approve`, {
        method: "POST",
      })
      if (!res.ok || !res.data) return null
      return res.data as Record<string, unknown>
    } catch { return null }
  }

  async function rejectProductCopyApi(id: string, reason?: string) {
    try {
      const res = await apiFetchWithAuth(`/api/v1/product-copies/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason ?? null }),
      })
      if (!res.ok || !res.data) return null
      return res.data as Record<string, unknown>
    } catch { return null }
  }

  // --- Phase helpers ---
  function goConfirm() {
    if (selectedAssetIds.length === 0) return
    setPhase("confirm")
  }

  function goRunning() {
    if (!canAnalyze) {
      setErrorMsg("Không có năng lực H1 (phân tích ảnh)")
      setPhase("error")
      return
    }
    setPhase("running")
    setJobStatus("PENDING")
    setJobPhase("ANALYZING")
    createAnalysisJob()
  }

  async function createAnalysisJob() {
    const idempotencyKey = `analysis-${Date.now()}-${crypto.randomUUID()}`
    try {
      const res = await apiFetch("/api/v1/vision/analyses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [IDEMPOTENCY_KEY_HEADER]: idempotencyKey,
        },
        body: JSON.stringify({
          asset_ids: selectedAssetIds,
          product_id: null,
        }),
      })
      if (!res.ok) {
        let message = "Không tạo được job phân tích"
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          message = body.error?.message ?? message
        } catch { /* ignore */ }
        setErrorMsg(message)
        setPhase("error")
        return
      }
      const data = (await res.json()) as { job_id: string; status: string }
      setAnalysisId(data.job_id)
      // Poll for completion
      startPolling(data.job_id)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi tạo job")
      setPhase("error")
    }
  }

  function startPolling(jobId: string) {
    const poll = async () => {
      if (jobStatus === "CANCELLED" || jobStatus === "FAILED") return
      await pollAnalysis(jobId)
      if (jobStatus !== "COMPLETED") {
        setJobPhase((prev) => prev ?? "PROCESSING")
        setTimeout(poll, 2000)
      }
    }
    setTimeout(poll, 1500)
  }

  function goResult1() {
    setPhase("result1")
  }

  function goSuggest() {
    setPhase("suggest")
  }

  function goResult2() {
    if (!analysisId) return
    if (!canH5) {
      setErrorMsg("Không có năng lực H5 (tạo dữ liệu bán hàng)")
      return
    }
    setCopyLoading(true)
    generateProductCopyApi(analysisId, null).then((result) => {
      setCopyLoading(false)
      if (result) {
        setEditedFields(null)
        setPhase("result2")
      }
    })
  }

  function goSaved() {
    setPhase("saved")
  }

  // --- Field change handlers ---
  function handleFieldChange1(key: string, value: string | number | string[]) {
    setEditedFields((prev) => ({ ...(prev ?? {}), [key]: value }))
  }
  function handleFieldChange2(key: string, value: string | number | string[]) {
    setEditedFields((prev) => ({ ...(prev ?? {}), [key]: value }))
  }
  function handleFieldAdd1(key: string, item: { id: string; value: string }) {
    setEditedFields((prev) => {
      const current = (prev?.[key] as string[]) ?? []
      return { ...(prev ?? {}), [key]: [...current, item.value] }
    })
  }
  function handleFieldAdd2(key: string, item: { id: string; value: string }) {
    setEditedFields((prev) => {
      const current = (prev?.[key] as string[]) ?? []
      return { ...(prev ?? {}), [key]: [...current, item.value] }
    })
  }
  function handleFieldRemove1(key: string, itemId: string) {
    setEditedFields((prev) => {
      const current = (prev?.[key] as string[]) ?? []
      return { ...(prev ?? {}), [key]: current.filter((v) => v !== itemId) }
    })
  }
  function handleFieldRemove2(key: string, itemId: string) {
    setEditedFields((prev) => {
      const current = (prev?.[key] as string[]) ?? []
      return { ...(prev ?? {}), [key]: current.filter((v) => v !== itemId) }
    })
  }

  // --- Action handlers ---
  // --- Action handlers ---
  async function handleSaveDraft1() {
    if (!analysisId || !canEdit) {
      setErrorMsg("Không có quyền chỉnh sửa")
      return
    }
    try {
      const res = await apiFetch(`/api/v1/vision/analyses/${analysisId}`, {
        method: "PATCH",
        body: JSON.stringify({ edited: editedFields ?? {} }),
      })
      if (!res.ok) {
        let message = "Không lưu được nháp"
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          message = body.error?.message ?? message
        } catch { /* ignore */ }
        setErrorMsg(message)
        return
      }
      setSaved1(true)
      setTimeout(() => setSaved1(false), 2000)
      await loadAnalysis(analysisId)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi lưu nháp")
    }
  }

  async function handleReject1() {
    if (!analysisId || !canApprove) {
      setErrorMsg("Không có quyền từ chối")
      return
    }
    try {
      const res = await apiFetch(`/api/v1/vision/analyses/${analysisId}/reject`, {
        method: "POST",
        body: JSON.stringify({ ly_do: null }),
      })
      if (!res.ok) {
        let message = "Không từ chối được"
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          message = body.error?.message ?? message
        } catch { /* ignore */ }
        setErrorMsg(message)
        return
      }
      setJudgment1("blocked")
      setApprovalState("REJECTED")
      await loadAnalysis(analysisId)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi từ chối")
    }
  }

  async function handleApprove1() {
    if (!analysisId || !canApprove) {
      setErrorMsg("Không có năng lực H3 (duyệt phân tích)")
      return
    }
    try {
      const res = await apiFetch(`/api/v1/vision/analyses/${analysisId}/approve`, {
        method: "POST",
      })
      if (!res.ok) {
        let message = "Không duyệt được"
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          message = body.error?.message ?? message
        } catch { /* ignore */ }
        setErrorMsg(message)
        return
      }
      const data = (await res.json()) as { approval_state: string }
      setJudgment1("safe")
      setApprovalState(data.approval_state as "PENDING" | "APPROVED" | "REJECTED")
      setSaved1(true)
      setSaved1(false)
      await loadAnalysis(analysisId)
      setTimeout(() => goSuggest(), 800)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi duyệt")
    }
  }

  async function handleSaveDraft2() {
    if (!copyId) return
    if (!editedFields || Object.keys(editedFields).length === 0) return
    try {
      const res = await updateProductCopyApi(copyId, editedFields)
      if (res) {
        setSaved2(true)
        setTimeout(() => setSaved2(false), 2000)
        setProductCopyData(res as Record<string, unknown>)
      } else {
        setErrorMsg("Không lưu được nháp")
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi lưu nháp")
    }
  }
  async function handleReject2() {
    if (!copyId) return
    try {
      const res = await rejectProductCopyApi(copyId)
      if (res) {
        setJudgment2("blocked")
        setCopyApprovalState("REJECTED")
      } else {
        setErrorMsg("Không từ chối được")
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi từ chối")
    }
  }
  async function handleApprove2() {
    if (!copyId) return
    if (!canH6) {
      setErrorMsg("Không có năng lực H6 (duyệt dữ liệu bán hàng)")
      return
    }
    try {
      const res = await approveProductCopyApi(copyId)
      if (res) {
        setCopyApprovalState("APPROVED")
        setSaved2(true)
        setJudgment2("safe")
        setSaved2(false)
        setTimeout(() => goSaved(), 800)
      } else {
        setErrorMsg("Không duyệt được")
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi duyệt")
    }
  }

  // --- Render ---
  const fields1 = analysisData && typeof analysisData === "object"
    ? mapAnalysisToFields1(analysisData as Record<string, unknown>)
    : MOCK_FIELDS_RESULT1_PLACEHOLDER

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">M01</div>
          <div className="text-[17px] font-extrabold text-primary">Phân tích sản phẩm bằng AI</div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5">
          <ArrowLeft size={16} strokeWidth={2} />
          Quay về Trang chủ
        </Button>
      </div>

      {errorMsg && (
        <div className="mx-[18px] mt-3 rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
          {errorMsg}
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => setErrorMsg(null)}>Đóng</Button>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-y-auto p-[18px]">
        {/* Phase: Upload */}
        {phase === "upload" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">① Nhập liệu</div>
              <div className="mt-1 text-[13px] text-text-muted">Tải ảnh sản phẩm (1 hoặc nhiều ảnh)</div>
            </div>
            <Card className="w-full max-w-md flex flex-col items-center gap-3 border-dashed border-2 border-border bg-surface-alt p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
                <Camera size={28} strokeWidth={1.5} className="text-text-muted" />
              </div>
              <div className="text-[14px] font-semibold">Chụp ảnh hoặc chọn từ thư viện</div>
              <div className="text-[12px] text-text-muted">Nhiều ảnh cùng lúc được — mỗi ảnh một lượt phân tích</div>
              <Button onClick={() => { loadAssets() }}>Chọn ảnh</Button>
            </Card>
            {assets.length > 0 && (
              <div className="flex flex-wrap gap-2 max-w-md justify-center">
                {assets.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.includes(a.id)}
                      onChange={() => {
                        setSelectedAssetIds((prev) =>
                          prev.includes(a.id) ? prev.filter((i) => i !== a.id) : [...prev, a.id]
                        )
                      }}
                      className="accent-primary"
                    />
                    <span className="text-[13px]">{a.name}</span>
                  </label>
                ))}
              </div>
            )}
            {assets.length > 0 && (
              <Button
                className="h-[50px] px-8"
                onClick={goConfirm}
                disabled={selectedAssetIds.length === 0}
              >
                Tiếp tục — {selectedAssetIds.length} ảnh đã chọn
              </Button>
            )}
            {loadingAssets && (
              <div className="text-[13px] text-text-muted">Đang tải danh sách ảnh…</div>
            )}
          </div>
        )}

        {/* Phase: Confirm */}
        {phase === "confirm" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">② Kích hoạt AI</div>
              <div className="mt-1 text-[13px] text-text-muted">{selectedAssetIds.length} ảnh — {selectedAssetIds.length} credit</div>
            </div>
            <Card className="w-full max-w-md p-5">
              {assets
                .filter((a) => selectedAssetIds.includes(a.id))
                .map((a) => (
                  <div key={a.id} className="flex items-center gap-3 py-2">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-surface-alt flex items-center justify-center">
                      <Camera size={20} strokeWidth={1.5} className="text-text-muted" />
                    </div>
                    <div className="flex-1 text-[13px] font-medium">{a.name}</div>
                    <Badge tone="neutral">Ảnh</Badge>
                  </div>
                ))}
            </Card>
            <Button
              className="h-[50px] px-8"
              onClick={goRunning}
              disabled={!canAnalyze}
            >
              <Sparkles size={18} strokeWidth={2} className="mr-2" />
              Phân tích
            </Button>
          </div>
        )}

        {/* Phase: Running */}
        {phase === "running" && (
          <div className="flex flex-1 flex-col items-center gap-5">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">③ Đang xử lý</div>
              <div className="mt-1 text-[13px] text-text-muted">{jobPhase ?? "Đang chuẩn bị..."}</div>
            </div>
            <div className="w-full max-w-md">
              <FlowSteps
                steps={FLOW_M01}
                currentStep={jobPhase ?? "detect"}
                cancellable={jobStatus === "PENDING"}
                onCancel={() => {
                  setJobStatus("CANCELLED")
                  setPhase("upload")
                }}
                showLog
                logs={
                  jobPhase
                    ? [{ seq: 1, text: `Đang ${jobPhase}...`, at: new Date().toISOString() }]
                    : []
                }
              />
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-surface-alt p-3.5">
              <AlertTriangle size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-primary" />
              <div className="text-xs leading-relaxed text-text-muted">
                Job chạy ở máy chủ và không mất khi rời màn hình — mở lại ở mục Lượt chạy để xem kết quả.
              </div>
            </div>
          </div>
        )}

        {/* Phase: Result 1 */}
        {phase === "result1" && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <div>
                <div className="text-xs text-text-muted">④ Thẻ kết quả 1</div>
                <div className="text-[17px] font-extrabold">Đặc điểm nhận diện</div>
              </div>
              <Badge tone={saved1 ? "success" : judgment1 === "blocked" ? "danger" : judgment1 === "warning" ? "warning" : "neutral"}>
                {saved1 ? "Đã lưu nháp" : judgment1 === "blocked" ? "Bị chặn" : judgment1 === "warning" ? "Cảnh báo" : "An toàn"}
              </Badge>
            </div>

            <ResultCard
              images={[]}
              fields={fields1}
              judgment={judgment1}
              quality={{ score: 94, label: "Độ tin cậy cao — mọi cấu phần đạt ngưỡng", status: "safe" }}
              onSaveDraft={handleSaveDraft1}
              onReject={handleReject1}
              onApprove={handleApprove1}
              onFieldChange={handleFieldChange1}
              onFieldAdd={handleFieldAdd1}
              onFieldRemove={handleFieldRemove1}
              disabled={approvalState === "APPROVED" || !canEdit}
            />

            {saved1 && (
              <div className="rounded-lg bg-success-bg px-4 py-2 text-[12.5px] font-medium text-secondary">
                Đã lưu nháp — quay lại trang này để tiếp tục chỉnh sửa.
              </div>
            )}

            {approvalState !== "APPROVED" && (
              <div className="w-full max-w-3xl border-t border-border pt-5">
                <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4">
                  <div>
                    <div className="text-[14px] font-bold text-primary">⑤ Đã duyệt đặc điểm nhận diện</div>
                    <div className="text-[12px] text-text-muted">Sản phẩm đã có trong kho ở dạng cấu trúc</div>
                  </div>
                  <Button
                    onClick={goSuggest}
                    className="flex items-center gap-2"
                  >
                    Gợi ý: Sinh nội dung bán hàng
                    <ChevronRight size={16} strokeWidth={2.4} />
                  </Button>
                </div>
                <div className="mt-2 text-center text-[11.5px] text-text-muted">
                  Người dùng chọn đi tiếp — không tự chạy.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase: Suggest (between M01 and M01b) */}
        {phase === "suggest" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">Gợi ý bước kế tiếp</div>
              <div className="mt-1 text-[13px] text-text-muted">Sản phẩm đã có trong kho — M01b: Nội dung bán hàng</div>
            </div>
            <Card className="w-full max-w-md p-6 text-center">
              <Sparkles size={32} strokeWidth={1.5} className="mx-auto mb-3 text-primary" />
              <div className="text-[14px] font-semibold">Sinh nội dung bán hàng (M01b)</div>
              <div className="mt-1 text-[12px] text-text-muted">
                Đọc từ Product Master vừa duyệt → Tên, mô tả, thẻ, tone, dịp, phân khúc giá
              </div>
              <Button className="mt-5 w-full" onClick={goResult2}>
                Tiếp tục sang M01b
              </Button>
            </Card>
            <Button variant="ghost" onClick={goResult1}>
              Quay lại Thẻ kết quả 1
            </Button>
          </div>
        )}

        {/* Phase: Result 2 (M01b) */}
        {phase === "result2" && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <div>
                <div className="text-xs text-text-muted">④ Thẻ kết quả 2 — M01b</div>
                <div className="text-[17px] font-extrabold">Nội dung bán hàng</div>
              </div>
              <Badge tone={saved2 ? "success" : judgment2 === "blocked" ? "danger" : judgment2 === "warning" ? "warning" : "neutral"}>
                {saved2 ? "Đã lưu nháp" : judgment2 === "blocked" ? "Bị chặn" : judgment2 === "warning" ? "Cảnh báo" : "An toàn"}
              </Badge>
            </div>

            <ResultCard
              fields={productCopyData ? mapProductCopyToFields2(productCopyData as Record<string, unknown>, analysisData) : MOCK_COPY_FIELDS_PLACEHOLDER}
              judgment={judgment2}
              quality={{ score: 89, label: "Nội dung phù hợp giọng thương hiệu", status: "safe" }}
              onSaveDraft={handleSaveDraft2}
              onReject={handleReject2}
              onApprove={handleApprove2}
              onFieldChange={handleFieldChange2}
              onFieldAdd={handleFieldAdd2}
              onFieldRemove={handleFieldRemove2}
              disabled={copyApprovalState === "APPROVED" || !canH6}
            />

            {saved2 && (
              <div className="rounded-lg bg-success-bg px-4 py-2 text-[12.5px] font-medium text-secondary">
                Đã lưu nháp nội dung bán hàng.
              </div>
            )}

            {judgment2 !== "blocked" && (
              <div className="w-full max-w-3xl border-t border-border pt-5">
                <Button
                  onClick={goSaved}
                  className="w-full max-w-3xl"
                >
                  ⑥ Lưu vào Kho sản phẩm → Quay về Trang chủ
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Phase: Saved */}
        {phase === "saved" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success-bg">
              <Check size={40} strokeWidth={2} className="text-secondary" />
            </div>
            <div className="text-center">
              <div className="text-[17px] font-extrabold">Đã lưu vào Kho</div>
              <div className="mt-1 text-[13px] text-text-muted">Product Master + Thư viện nội dung đã được cập nhật</div>
            </div>
            <Button onClick={() => router.push("/")}>Quay về Trang chủ</Button>
          </div>
        )}

        {/* Phase: Error */}
        {phase === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-danger-bg">
              <AlertTriangle size={40} strokeWidth={2} className="text-danger" />
            </div>
            <div className="text-center">
              <div className="text-[17px] font-extrabold">Lỗi</div>
              <div className="mt-1 text-[13px] text-text-muted">{errorMsg ?? "Đã xảy ra lỗi"}</div>
            </div>
            <Button onClick={() => { setErrorMsg(null); setPhase("upload") }}>Thử lại</Button>
            <Button variant="ghost" onClick={() => router.push("/")}>Quay về Trang chủ</Button>
          </div>
        )}
      </div>
    </div>
  )
}

const MOCK_FIELDS_RESULT1_PLACEHOLDER: ResultField[] = [
  { key: "flowers", label: "Danh sách loại hoa", type: "list", editable: true, value: [], confidence: 94, placeholder: "Thêm loại hoa..." },
  { key: "foliage", label: "Lá, phụ kiện đi kèm", type: "list", editable: true, value: [], confidence: 91, placeholder: "Thêm lá/phụ kiện..." },
  { key: "wrapping", label: "Giấy gói, nơ", type: "list", editable: true, value: [], confidence: 88, placeholder: "Thêm giấy gói/nơ..." },
  { key: "colors", label: "Màu sắc chủ đạo (tối đa 3 tone)", type: "list", editable: true, value: [], confidence: 96, placeholder: "Thêm tone màu..." },
  { key: "shape", label: "Hình dáng / vật chứa", type: "text", editable: true, value: "—", confidence: null },
  { key: "totals", label: "Tổng số cành", type: "readonly", editable: false, value: "—" },
  { key: "totals-bud", label: "Tổng số nụ", type: "readonly", editable: false, value: "—" },
  { key: "totals-damaged", label: "Tổng số cành hỏng", type: "readonly", editable: false, value: "—" },
  { key: "confidence", label: "Độ tin cậy tổng thể", type: "readonly", editable: false, value: "—" },
]

const MOCK_COPY_FIELDS_PLACEHOLDER: ResultField[] = [
  { key: "name", label: "Tên sản phẩm", type: "text", editable: true, value: "—" },
  { key: "desc", label: "Mô tả bó hoa", type: "textarea", editable: true, value: "" },
  { key: "tags", label: "Thẻ phân loại", type: "list", editable: true, value: [], confidence: null, placeholder: "Thêm thẻ..." },
  { key: "tones", label: "Tone màu dạng nhãn bán hàng", type: "list", editable: true, value: [], confidence: null, placeholder: "Thêm tone..." },
  { key: "style", label: "Phong cách thiết kế", type: "text", editable: true, value: "—" },
  { key: "occasions", label: "Dịp phù hợp", type: "list", editable: true, value: [], confidence: null, placeholder: "Thêm dịp..." },
  { key: "price-segment", label: "Phân khúc giá gợi ý", type: "readonly", editable: false, value: "—" },
]
