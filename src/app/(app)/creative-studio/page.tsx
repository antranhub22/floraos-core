"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Check, ChevronRight, Sparkles, ArrowLeft, ShieldCheck, AlertTriangle, Image as ImageIcon } from "lucide-react"
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
    return { ok: false, status: res.status as any, data: null, message }
  }
  return { ok: true, status: 200 as const, data: await res.json() }
}

// ============================================================
// MOCK DATA — chỉ giữ khi chưa có backend
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

const FIELDS_M04A: ResultField[] = [
  { key: "resolution", label: "Độ phân giải đầu ra", type: "readonly", editable: false, value: "4096 × 4096" },
  { key: "quality-score", label: "Điểm chất lượng Identity Guard", type: "readonly", editable: false, value: "TỐT" },
  { key: "ratio-1", label: "Tỉ lệ 1:1", type: "readonly", editable: false, value: "Có sẵn" },
  { key: "ratio-2", label: "Tỉ lệ 4:5", type: "readonly", editable: false, value: "Có sẵn" },
  { key: "ratio-3", label: "Tỉ lệ 9:16", type: "readonly", editable: false, value: "Có sẵn" },
  { key: "ratio-4", label: "Tỉ lệ 16:9", type: "readonly", editable: false, value: "Có sẵn" },
  { key: "brightness", label: "Độ sáng (sửa được)", type: "text", editable: true, value: "Normal" },
  { key: "contrast", label: "Độ tương phản (sửa được)", type: "text", editable: true, value: "Normal" },
]

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
  const [assets, setAssets] = useState<Array<{ id: string; name: string; storage_key: string }>>([])
  const [selectedAssetId, setSelectedAssetId] = useState<string>("")
  const [jobPhase, setJobPhase] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | null>(null)
  const [optimizationData, setOptimizationData] = useState<Record<string, unknown> | null>(null)
  const [optimizationId, setOptimizationId] = useState<string | null>(null)
  const [approvalState, setApprovalState] = useState<"pending" | "approved" | "rejected">("pending")
  const [requiresWarning, setRequiresWarning] = useState(false)
  const [fieldsA, setFieldsA] = useState<ResultField[]>(FIELDS_M04A)
  const [fieldsB, setFieldsB] = useState<ResultField[]>(FIELDS_M04B)
  const [savedA, setSavedA] = useState(false)
  const [savedB, setSavedB] = useState(false)
  const [judgmentA, setJudgmentA] = useState<JudgmentState>("safe")
  const [judgmentB, setJudgmentB] = useState<JudgmentState>("safe")
  const [variantIds, setVariantIds] = useState<string[]>(["v1"])
  const [showBoundary, setShowBoundary] = useState(false)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const canOptimize = session.can("I1")
  const canApprove = session.can("I2")
  const canDownload = session.can("I3")

  const masterImageExists = masterApproved || approvalState === "approved"

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
      setOptimizationData(res.data as Record<string, unknown>)
      setApprovalState(opt.approval.state)
      setRequiresWarning(opt.approval.requires_warning)
      setOptimizationId(opt.job_id)
      if (opt.approval.state === "approved") {
        setMasterApproved(true)
        setJudgmentA("safe")
      } else if (opt.approval.state === "rejected") {
        setJudgmentA("blocked")
      }
      if (opt.status === "COMPLETED" || opt.approval.state !== "pending") {
        setJobStatus("COMPLETED")
        setJobPhase(null)
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
      setApprovalState(opt.approval.state)
      setRequiresWarning(opt.approval.requires_warning)
      if (opt.approval.state === "approved") {
        setMasterApproved(true)
        setJudgmentA("safe")
      }
      if (opt.status === "COMPLETED" || opt.approval.state !== "pending") {
        setJobStatus("COMPLETED")
        setJobPhase(null)
      } else {
        setTimeout(() => pollOptimization(jobId), 2000)
      }
    } catch { /* polling continues */ }
  }

  // --- Phase helpers ---
  function goConfirmA() {
    if (!selectedAssetId) return
    setPhase("confirm-a")
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
        body: JSON.stringify({ asset_id: selectedAssetId }),
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

  function goResultA() {
    setPhase("result-a")
  }

  function goAreaB() {
    setPhase("area-b")
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

  function handleApproveA() {
    setMasterApproved(true)
    setSavedA(true)
    setJudgmentA("safe")
    setTimeout(() => {
      setSavedA(false)
      setPhase("area-b")
    }, 1000)
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
      setApprovalState(data.approval?.state as "pending" | "approved" | "rejected" ?? "approved")
      setMasterApproved(true)
      setSavedA(true)
      setSavedA(false)
      setTimeout(() => setPhase("area-b"), 800)
      await loadOptimization(optimizationId)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi duyệt")
    }
  }

  async function handleDownload() {
    if (!optimizationId || !canDownload) return
    try {
      const res = await apiFetch(`/api/v1/media/optimizations/${optimizationId}/download`)
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

  async function handleApproveB() {
    setSavedB(true)
    setJudgmentB("safe")
    setSavedB(false)
    setTimeout(() => setPhase("saved"), 800)
  }

  // --- Render ---
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">M04a + M04b</div>
          <div className="text-[17px] font-extrabold text-primary">AI Creative Studio</div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5">
          <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
        </Button>
      </div>

      {errorMsg && (
        <div className="mx-[18px] mt-3 rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
          {errorMsg}
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => setErrorMsg(null)}>Đóng</Button>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-y-auto p-[18px]">
        {/* ==== AREA A ==== */}
        {(phase === "select" || phase === "confirm-a") && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">Khu vực A — Tối ưu ảnh gốc</div>
              <div className="mt-1 text-[13px] text-text-muted">{masterApproved ? "Đã có Master Image — tối ưu lại" : "Chọn ảnh gốc để tối ưu"}</div>
            </div>

            {masterApproved && (
              <div className="w-full max-w-md rounded-xl bg-surface-alt p-4 text-center">
                <div className="text-[13.5px] font-bold text-secondary">Đã có ảnh chính thức</div>
                <Button variant="ghost" className="mt-2" onClick={goRunningA}>
                  Tối ưu lại
                </Button>
              </div>
            )}

            {!masterApproved && (
              <>
                {phase === "select" && (
                  <Card className="w-full max-w-md flex flex-col items-center gap-3 border-dashed border-2 border-border bg-surface-alt p-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
                      <Camera size={28} strokeWidth={1.5} className="text-text-muted" />
                    </div>
                    <div className="text-[14px] font-semibold">Chọn ảnh gốc</div>
                    <div className="text-[12px] text-text-muted">Ảnh gốc sẽ được phân tích, tăng cường, dựng bố cục</div>
                    <Button onClick={() => { loadAssets(); setPhase("confirm-a") }}>Chọn ảnh</Button>
                  </Card>
                )}

                {phase === "confirm-a" && (
                  <>
                    {loadingAssets && <div className="text-[13px] text-text-muted">Đang tải…</div>}
                    {!loadingAssets && assets.length > 0 && (
                      <>
                        {assets.map((a) => (
                          <label key={a.id} className="flex items-center gap-3 py-2 cursor-pointer">
                            <input
                              type="radio"
                              name="asset"
                              checked={selectedAssetId === a.id}
                              onChange={() => setSelectedAssetId(a.id)}
                              className="accent-primary"
                            />
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-surface-alt flex items-center justify-center">
                              <ImageIcon size={16} strokeWidth={1.5} className="text-text-muted" />
                            </div>
                            <div className="flex-1 text-[13px] font-medium">{a.name}</div>
                            <Badge tone="neutral">Ảnh gốc</Badge>
                          </label>
                        ))}
                        <Button className="h-[50px] w-full px-8" onClick={goRunningA} disabled={!selectedAssetId || !canOptimize}>
                          <Sparkles size={18} strokeWidth={2} className="mr-2" /> Tối ưu ảnh
                        </Button>
                      </>
                    )}
                    {assets.length === 0 && !loadingAssets && (
                      <div className="text-[13px] text-text-muted">Chưa có ảnh nào. Tải ảnh lên trước.</div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ==== RUNNING A ==== */}
        {phase === "running-a" && (
          <div className="flex flex-1 flex-col items-center gap-5">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">Đang xử lý M04a</div>
              <div className="mt-1 text-[13px] text-text-muted">{jobPhase ?? "Đang chuẩn bị..."}</div>
            </div>
            <div className="w-full max-w-md">
              <FlowSteps steps={FLOW_M04A} currentStep={jobPhase ?? "analyze"} cancellable={jobStatus === "PENDING"}
                onCancel={() => { setJobStatus("CANCELLED"); setPhase("select") }} showLog
                logs={jobPhase ? [{ seq: 1, text: `Đang ${jobPhase}...`, at: new Date().toISOString() }] : []} />
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-surface-alt p-3.5">
              <AlertTriangle size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-primary" />
              <div className="text-xs leading-relaxed text-text-muted">Job chạy ở máy chủ — không mất khi rời trang.</div>
            </div>
          </div>
        )}

        {/* ==== RESULT A ==== */}
        {phase === "result-a" && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <div>
                <div className="text-xs text-text-muted">④ Thẻ kết quả — M04a</div>
                <div className="text-[17px] font-extrabold">Kết quả tối ưu ảnh</div>
              </div>
              <Badge tone={savedA ? "success" : judgmentA === "blocked" ? "danger" : judgmentA === "warning" ? "warning" : "neutral"}>
                {savedA ? "Đã lưu nháp" : judgmentA === "blocked" ? "Bị chặn" : judgmentA === "warning" ? "Cảnh báo" : "An toàn"}
              </Badge>
            </div>

            {approvalState === "rejected" && (
              <div className="w-full max-w-3xl rounded-xl border-[1.5px] border-danger bg-danger-bg p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-danger" />
                  <div className="text-[13px] leading-relaxed text-danger">
                    Identity Guard đã từ chối ảnh này — không đưa vào luồng duyệt.
                    Chọn ảnh khác hoặc Chạy lại để tối ưu hóa ảnh khác.
                  </div>
                </div>
              </div>
            )}

            <ResultCard
              fields={fieldsA}
              judgment={judgmentA}
              quality={{ score: 92, label: "Identity Guard: TỐT — đạt ngưỡng Master Image", status: "safe" }}
              onSaveDraft={() => { setSavedA(true); setTimeout(() => setSavedA(false), 2000) }}
              onReject={() => setJudgmentA("blocked")}
              {...(approvalState !== "approved" && approvalState !== "rejected" ? { onApprove: handleApproveAApi } : {})}
              {...(approvalState === "rejected" ? { onRunAgain: goRunningA } : {})}
              {...(approvalState === "rejected" ? { onSkip: () => { setPhase("saved"); setMasterApproved(true) } } : {})}
              disabled={approvalState === "approved"}
              onFieldChange={(key, value) => setFieldsA((p) => p.map((f) => (f.key === key ? { ...f, value } : f)))}
            />

            {approvalState === "rejected" && (
              <div className="w-full max-w-3xl border-t border-border pt-5 flex items-center justify-between">
                <Button variant="ghost" onClick={() => { setJudgmentA("safe"); setPhase("select") }}>
                  <ArrowLeft size={16} strokeWidth={2} className="mr-2" /> Chọn ảnh khác
                </Button>
                <Button onClick={() => setPhase("saved")}>
                  Giữ ảnh gốc → Quay về Trang chủ
                </Button>
              </div>
            )}

            {approvalState !== "rejected" && (
              <div className="w-full max-w-3xl border-t border-border pt-5">
                {masterApproved && (
                  <div className="rounded-xl bg-surface-alt p-4 mb-3">
                    <div className="text-[11.5px] font-bold text-primary">
                      Biến thể không thay đổi chính bó hoa. Muốn sửa ánh sáng hoặc hình dáng sản phẩm, quay lại Khu vực A.
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setShowBoundary(!showBoundary)} className="mt-2">
                      {showBoundary ? "Ẩn" : "Hiện"} Khu vực A
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4">
                  <div>
                    <div className="text-[14px] font-bold text-primary">Khu vực B — Biến thể marketing</div>
                    <div className="text-[12px] text-text-muted">{VARIANTS.filter((v) => variantIds.includes(v.id)).length} biến thể đã chọn</div>
                  </div>
                  <Button onClick={goRunningB} className="flex items-center gap-2" disabled={!masterApproved}>
                    Tạo biến thể <ChevronRight size={16} strokeWidth={2.4} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==== AREA B ==== */}
        {phase === "area-b" && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <div>
                <div className="text-xs text-text-muted">④ Thẻ kết quả — M04b</div>
                <div className="text-[17px] font-extrabold">Biến thể marketing</div>
              </div>
              <Badge tone={savedB ? "success" : judgmentB === "blocked" ? "danger" : judgmentB === "warning" ? "warning" : "neutral"}>
                {savedB ? "Đã lưu nháp" : judgmentB === "blocked" ? "Bị chặn" : judgmentB === "warning" ? "Cảnh báo" : "An toàn"}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-3xl">
              {VARIANTS.map((v) => (
                <div key={v.id} className={`relative overflow-hidden rounded-xl border-2 bg-surface-alt ${variantIds.includes(v.id) ? "border-primary" : "border-border"}`}>
                  <div className="aspect-square">
                    <img src={v.src} alt={`Biến thể ${v.id}`} className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute top-2 left-2 flex gap-1">
                    {variantIds.includes(v.id) && <Badge tone="accent" className="text-[9px]">Đã chọn</Badge>}
                  </div>
                  <div className="p-2.5 flex flex-col gap-1">
                    <div className="text-[11px] font-bold">Nền: {v.bg}</div>
                    <div className="text-[11px] text-text-muted">Tỉ lệ: {v.ratio}</div>
                  </div>
                  <button type="button" onClick={() => toggleVariant(v.id)}
                    className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold">
                    {variantIds.includes(v.id) ? "✓" : "+"}
                  </button>
                </div>
              ))}
            </div>

            {showBoundary && (
              <div className="w-full max-w-3xl rounded-xl bg-surface-alt p-4">
                <div className="text-[12px] text-text-muted">Khu vực A hiện lại — ảnh gốc đã được tối ưu.</div>
              </div>
            )}

            <div className="w-full max-w-3xl border-t border-border pt-5 flex items-center justify-between">
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
          <div className="flex flex-1 flex-col items-center gap-5">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">Đang xử lý M04b</div>
              <div className="mt-1 text-[13px] text-text-muted">{jobPhase ?? "Đang sinh..."}</div>
            </div>
            <div className="w-full max-w-md">
              <FlowSteps steps={FLOW_M04B} currentStep={jobPhase ?? "generate"} cancellable={jobStatus === "PENDING"}
                onCancel={() => { setJobStatus("CANCELLED"); setPhase("result-a") }} />
            </div>
          </div>
        )}

        {/* ==== RESULT B ==== */}
        {phase === "result-b" && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <div>
                <div className="text-xs text-text-muted">④ Thẻ kết quả — M04b (biến thể)</div>
                <div className="text-[17px] font-extrabold">Danh sách biến thể</div>
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
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success-bg">
              <Check size={40} strokeWidth={2} className="text-secondary" />
            </div>
            <div className="text-center">
              <div className="text-[17px] font-extrabold">Đã lưu vào Kho ảnh sản phẩm</div>
              <div className="mt-1 text-[13px] text-text-muted">Master Image + biến thể đã được cập nhật</div>
            </div>
            <Button onClick={() => router.push("/")}>Quay về Trang chủ</Button>
          </div>
        )}

        {/* ==== ERROR ==== */}
        {phase === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-danger-bg">
              <AlertTriangle size={40} strokeWidth={2} className="text-danger" />
            </div>
            <div className="text-center">
              <div className="text-[17px] font-extrabold">Lỗi</div>
              <div className="mt-1 text-[13px] text-text-muted">{errorMsg ?? "Đã xảy ra lỗi"}</div>
            </div>
            <Button onClick={() => { setErrorMsg(null); setPhase("select") }}>Thử lại</Button>
            <Button variant="ghost" onClick={() => router.push("/")}>Quay về Trang chủ</Button>
          </div>
        )}
      </div>
    </div>
  )
}
