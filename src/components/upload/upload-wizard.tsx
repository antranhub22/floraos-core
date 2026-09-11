"use client"

// Luồng phân tích ảnh (M01) — đặc tả 03 mục 6:
// Tải ảnh → Xác nhận ảnh → Đang chạy → Kết quả (sửa tại chỗ + duyệt).
//
// Nối API thật (trước đây chạy giả lập hoàn toàn ở client, không tạo job
// thật — tag "Chưa sẵn sàng" ở mock-data.ts trước đợt này):
//   Tải ảnh  → POST /assets/upload-url → PUT lên URL ký sẵn → POST /assets
//   Chạy     → POST /vision/analyses (một job cho cả lô, header
//              "idempotency-key" bắt buộc — YC-U7)
//   Theo dõi → GET /jobs/:id, vòng lặp tới khi COMPLETED/FAILED/CANCELLED
//   Kết quả  → GET /vision/analyses (hàng chờ duyệt), khớp theo job_id/asset_id
//   Sửa      → PATCH /vision/analyses/:id { edited } — thay NGUYÊN bản gốc,
//              không gộp một phần (đúng luật `resolveEffectiveAnalysis`)
//   Duyệt    → POST /vision/analyses/:id/approve — ghi Product Master,
//              không cần thân yêu cầu (tên sản phẩm nháp tự suy từ
//              identity.category)
//
// Job chạy dưới worker Python riêng (`workers/vision/jobs/worker.py`, cần
// biến môi trường DATABASE_URL và OPENAI_API_KEY) — màn này chỉ tạo và theo
// dõi đúng job thật, không tự giả lập kết quả.

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, X, Check, Pencil, Info, AlertTriangle, RotateCcw } from "lucide-react"
import { FlowTopBar } from "@/components/layout/flow-top-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

type Step = "upload" | "confirm" | "running" | "result"

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_PHOTOS = 10

type Photo = { id: number; file: File; previewUrl: string; name: string }
type UploadedPhoto = Photo & { assetId: string }

type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"
type JobState = { id: string; status: JobStatus; stage: string | null; result: string | null; error: string | null }

type AnalysisRow = {
  id: string
  asset_id: string
  job_id: string
  raw: Record<string, unknown>
  edited: Record<string, unknown> | null
  approval_state: "PENDING" | "APPROVED" | "REJECTED"
}

type RunPhase = "uploading" | "queuing" | "waiting" | "processing"
const RUN_PHASES: { key: RunPhase; label: string }[] = [
  { key: "uploading", label: "Tải ảnh lên" },
  { key: "queuing", label: "Tạo lượt phân tích" },
  { key: "waiting", label: "Xếp hàng chờ xử lý" },
  { key: "processing", label: "Phân tích ảnh (AI)" },
]

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : []
}
function asText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null
}
function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null
}
function effectiveAnalysis(row: AnalysisRow): Record<string, unknown> {
  return row.edited ?? row.raw
}
function bomOf(row: AnalysisRow): Record<string, unknown> {
  return asRecord(effectiveAnalysis(row).bom)
}

async function extractError(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
  return data?.error?.message ?? `${fallback} (${res.status})`
}

export function UploadWizard() {
  const router = useRouter()
  const { can } = useSession()

  const [step, setStep] = useState<Step>("upload")
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploadNote, setUploadNote] = useState<string | null>(null)
  const nextId = useRef(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[] | null>(null)
  const [runPhase, setRunPhase] = useState<RunPhase>("uploading")
  const [runError, setRunError] = useState<string | null>(null)
  const [job, setJob] = useState<JobState | null>(null)
  const [balanceAfter, setBalanceAfter] = useState<number | null>(null)
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([])
  const [resultIndex, setResultIndex] = useState(0)

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      if (pollTimer.current) clearTimeout(pollTimer.current)
    }
  }, [])

  const stepIndex = { upload: 1, confirm: 2, running: 3, result: 4 }[step]

  function addPhotos(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadNote(null)
    setPhotos((cur) => {
      const room = MAX_PHOTOS - cur.length
      const accepted: Photo[] = []
      let rejected = 0
      let overflow = 0
      Array.from(files).forEach((file) => {
        if (accepted.length >= room) {
          overflow++
          return
        }
        if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
          rejected++
          return
        }
        accepted.push({
          id: nextId.current++,
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name.replace(/\.[^.]+$/, ""),
        })
      })
      if (rejected > 0 || overflow > 0) {
        const parts: string[] = []
        if (rejected > 0) parts.push(`${rejected} tệp không phải ảnh jpg/png/webp/gif`)
        if (overflow > 0) parts.push(`${overflow} ảnh vượt quá tối đa ${MAX_PHOTOS}`)
        setUploadNote(`Đã bỏ qua: ${parts.join(", ")}.`)
      }
      return [...cur, ...accepted]
    })
  }

  function removePhoto(id: number) {
    setPhotos((cur) => {
      const target = cur.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return cur.filter((p) => p.id !== id)
    })
    // Danh sách ảnh đổi thì gói đã tải lên (nếu có từ một lượt chạy trước
    // đó bị lỗi) không còn khớp nữa — bắt tải lại từ đầu.
    setUploadedPhotos(null)
  }
  function renamePhoto(id: number, name: string) {
    setPhotos((cur) => cur.map((p) => (p.id === id ? { ...p, name } : p)))
  }

  function goBack() {
    if (step === "confirm") setStep("upload")
    else if (step === "running") setStep("confirm")
    else if (step === "result") setStep("confirm")
    else router.push("/")
  }

  function resetWizard() {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPhotos([])
    setUploadedPhotos(null)
    setJob(null)
    setAnalyses([])
    setResultIndex(0)
    setRunError(null)
    setStep("upload")
  }

  async function uploadAllPhotos(): Promise<UploadedPhoto[]> {
    const uploaded: UploadedPhoto[] = []
    for (const photo of photos) {
      const urlRes = await fetch("/api/v1/assets/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: null, mime_type: photo.file.type }),
      })
      if (!urlRes.ok) {
        throw new Error(await extractError(urlRes, `Không xin được URL tải lên cho "${photo.name}"`))
      }
      const { asset_id, storage_key, upload_url } = (await urlRes.json()) as {
        asset_id: string
        storage_key: string
        upload_url: string
      }

      const putRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": photo.file.type },
        body: photo.file,
      })
      if (!putRes.ok) throw new Error(`Tải ảnh "${photo.name}" lên kho thất bại (mã ${putRes.status})`)

      const registerRes = await fetch("/api/v1/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id,
          product_id: null,
          kind: "ORIGINAL",
          storage_key,
          mime_type: photo.file.type,
          file_size: photo.file.size,
        }),
      })
      if (!registerRes.ok) {
        throw new Error(await extractError(registerRes, `Không đăng ký được asset cho "${photo.name}"`))
      }

      uploaded.push({ ...photo, assetId: asset_id })
    }
    return uploaded
  }

  async function startAnalysis() {
    setRunError(null)
    setJob(null)
    setAnalyses([])
    setResultIndex(0)
    setStep("running")
    try {
      let assets = uploadedPhotos
      if (!assets || assets.length !== photos.length) {
        setRunPhase("uploading")
        assets = await uploadAllPhotos()
        setUploadedPhotos(assets)
      }

      setRunPhase("queuing")
      const idempotencyKey = crypto.randomUUID()
      const jobRes = await fetch("/api/v1/vision/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify({ asset_ids: assets.map((a) => a.assetId), product_id: null }),
      })
      if (!jobRes.ok) throw new Error(await extractError(jobRes, "Không tạo được lượt phân tích"))
      const created = (await jobRes.json()) as {
        job_id: string
        status: JobStatus
        usage: { cost_credit: number; balance_after: number | null }
      }
      setBalanceAfter(created.usage.balance_after)
      setJob({ id: created.job_id, status: created.status, stage: null, result: null, error: null })

      setRunPhase("waiting")
      await pollJob(created.job_id, assets)
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Có lỗi khi chạy phân tích")
    }
  }

  async function pollJob(jobId: string, assets: UploadedPhoto[]) {
    if (cancelledRef.current) return
    const res = await fetch(`/api/v1/jobs/${jobId}`)
    if (!res.ok) {
      setRunError(await extractError(res, "Không đọc được trạng thái lượt phân tích"))
      return
    }
    const { job: row } = (await res.json()) as { job: JobState }
    setJob(row)
    if (row.status === "PROCESSING") setRunPhase("processing")

    if (row.status === "COMPLETED") {
      await loadAnalyses(jobId, assets)
      return
    }
    if (row.status === "FAILED") {
      setRunError(row.error ?? "Lượt phân tích thất bại — chưa rõ lý do")
      return
    }
    if (row.status === "CANCELLED") {
      setRunError("Lượt phân tích đã bị huỷ")
      return
    }
    pollTimer.current = setTimeout(() => {
      pollJob(jobId, assets)
    }, 2000)
  }

  async function loadAnalyses(jobId: string, assets: UploadedPhoto[]) {
    const wanted = new Set(assets.map((a) => a.assetId))
    const found: AnalysisRow[] = []
    let cursor: string | null = null
    for (let page = 0; page < 10 && found.length < wanted.size; page++) {
      const params = new URLSearchParams({ limit: "50" })
      if (cursor) params.set("cursor", cursor)
      const res = await fetch(`/api/v1/vision/analyses?${params.toString()}`)
      if (!res.ok) {
        setRunError(await extractError(res, "Không tải được kết quả phân tích"))
        return
      }
      const data = (await res.json()) as { data: AnalysisRow[]; next_cursor: string | null }
      data.data.forEach((row) => {
        if (row.job_id === jobId && wanted.has(row.asset_id)) found.push(row)
      })
      cursor = data.next_cursor
      if (!cursor) break
    }
    // Xếp theo đúng thứ tự ảnh đã chọn, không theo thứ tự trả về của hàng
    // chờ duyệt (mới nhất trước).
    const byAsset = new Map(found.map((row) => [row.asset_id, row]))
    const ordered = assets.map((a) => byAsset.get(a.assetId)).filter((r): r is AnalysisRow => Boolean(r))
    setAnalyses(ordered)
    setResultIndex(0)
    setStep("result")
  }

  async function saveEdit(analysisId: string, section: string, index: number, quantity: number) {
    const target = analyses.find((a) => a.id === analysisId)
    if (!target) return
    const clone = JSON.parse(JSON.stringify(effectiveAnalysis(target))) as Record<string, unknown>
    const bom = asRecord(clone.bom)
    const rows = asArray(bom[section])
    if (!rows[index]) return
    rows[index] = { ...rows[index], quantity }
    bom[section] = rows
    clone.bom = bom

    const res = await fetch(`/api/v1/vision/analyses/${analysisId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edited: clone }),
    })
    if (!res.ok) throw new Error(await extractError(res, "Không lưu được chỉnh sửa"))
    const updated = (await res.json()) as { edited: Record<string, unknown> | null }
    setAnalyses((cur) => cur.map((a) => (a.id === analysisId ? { ...a, edited: updated.edited } : a)))
  }

  async function approveAnalysis(analysisId: string) {
    const res = await fetch(`/api/v1/vision/analyses/${analysisId}/approve`, { method: "POST" })
    if (!res.ok) throw new Error(await extractError(res, "Không duyệt được"))
    setAnalyses((cur) => cur.map((a) => (a.id === analysisId ? { ...a, approval_state: "APPROVED" } : a)))
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <FlowTopBar
        title={
          step === "upload"
            ? "Phân tích ảnh sản phẩm"
            : step === "confirm"
              ? "Xác nhận trước khi chạy"
              : step === "running"
                ? "Đang phân tích"
                : "Kết quả phân tích"
        }
        step={stepIndex}
        totalSteps={4}
        onBack={goBack}
      />

      {step === "upload" && (
        <UploadStep
          photos={photos}
          note={uploadNote}
          fileInputRef={fileInputRef}
          onPick={() => fileInputRef.current?.click()}
          onFiles={addPhotos}
          onRemove={removePhoto}
          onNext={() => setStep("confirm")}
        />
      )}
      {step === "confirm" && (
        <ConfirmStep
          photos={photos}
          canRun={can("H1")}
          onRemove={removePhoto}
          onRename={renamePhoto}
          onStart={startAnalysis}
        />
      )}
      {step === "running" && (
        <RunningStep
          photoCount={photos.length}
          phase={runPhase}
          job={job}
          error={runError}
          onRetry={startAnalysis}
          onBackToConfirm={() => setStep("confirm")}
        />
      )}
      {step === "result" && (
        <ResultStep
          analyses={analyses}
          index={resultIndex}
          setIndex={setResultIndex}
          photos={uploadedPhotos ?? []}
          job={job}
          balanceAfter={balanceAfter}
          canEdit={can("H2")}
          canApprove={can("H3")}
          onSaveEdit={saveEdit}
          onApprove={approveAnalysis}
          onFinish={() => router.push("/")}
          onRunAnother={resetWizard}
        />
      )}
    </div>
  )
}

function UploadStep({
  photos,
  note,
  fileInputRef,
  onPick,
  onFiles,
  onRemove,
  onNext,
}: {
  photos: Photo[]
  note: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onPick: () => void
  onFiles: (files: FileList | null) => void
  onRemove: (id: number) => void
  onNext: () => void
}) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_MIME_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ""
          }}
        />
        <button
          type="button"
          onClick={onPick}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-5 py-8"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-alt">
            <Camera size={26} strokeWidth={1.8} className="text-primary" />
          </div>
          <div className="text-[14.5px] font-bold">Chụp ảnh hoặc chọn từ thư viện</div>
          <div className="text-center text-xs text-text-muted">
            Nhiều ảnh cùng lúc được — mỗi ảnh một lượt nhận diện. Tối đa {MAX_PHOTOS} ảnh, jpg/png/webp/gif.
          </div>
        </button>

        {note && (
          <div className="flex items-start gap-1.5 rounded-lg bg-warning-bg px-2.5 py-2 text-[11.5px] text-warning">
            <Info size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
            <div>{note}</div>
          </div>
        )}

        {photos.length > 0 ? (
          <div>
            <div className="mb-2.5 text-[13px] font-bold text-text-muted">Ảnh đã chọn · {photos.length}</div>
            <div className="grid grid-cols-3 gap-2.5">
              {photos.map((p) => (
                <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-surface-alt">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.previewUrl} alt={p.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemove(p.id)}
                    className="absolute right-0.5 top-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/60"
                    aria-label="Bỏ ảnh"
                  >
                    <X size={13} strokeWidth={2.6} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-2.5 text-center text-[13px] text-text-muted">
            Chưa có ảnh nào — bấm ô phía trên để bắt đầu.
          </div>
        )}
      </div>
      <div className="flex-shrink-0 border-t border-border bg-surface p-5">
        <Button className="w-full" disabled={photos.length === 0} onClick={onNext}>
          Tiếp tục ({photos.length} ảnh)
        </Button>
      </div>
    </>
  )
}

function ConfirmStep({
  photos,
  canRun,
  onRemove,
  onRename,
  onStart,
}: {
  photos: Photo[]
  canRun: boolean
  onRemove: (id: number) => void
  onRename: (id: number, name: string) => void
  onStart: () => void
}) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <div className="text-[12.5px] text-text-muted">
          Kiểm tra lại danh sách ảnh trước khi chạy. Bỏ được từng ảnh khỏi lượt chạy.
        </div>

        <div className="flex flex-col gap-2.5">
          {photos.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-2.5">
              <div className="h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded-lg bg-surface-alt">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <input
                  value={p.name}
                  onChange={(e) => onRename(p.id, e.target.value)}
                  className="w-full border-none bg-transparent text-[13.5px] font-semibold text-text outline-none"
                />
                <div className="mt-0.5 truncate text-[11.5px] text-text-muted">{p.file.name}</div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt"
                aria-label="Bỏ ảnh"
              >
                <X size={17} strokeWidth={2} />
              </button>
            </Card>
          ))}
          {photos.length === 0 && (
            <div className="py-5 text-center text-[13px] text-text-muted">Không còn ảnh nào trong lượt chạy này.</div>
          )}
        </div>

        <Card className="flex flex-col gap-1.5 border-none bg-surface-alt p-4 text-[13px]">
          <div className="flex justify-between">
            <span className="text-text-muted">Cả lượt chạy này ({photos.length} ảnh)</span>
            <span className="font-bold text-primary">1 credit</span>
          </div>
          <div className="text-[11.5px] text-text-muted">
            Tính theo mỗi lượt phân tích, không theo số ảnh trong lượt.
          </div>
        </Card>
      </div>
      <div className="flex-shrink-0 border-t border-border bg-surface p-5">
        {canRun ? (
          <Button className="w-full" disabled={photos.length === 0} onClick={onStart}>
            Bắt đầu phân tích
          </Button>
        ) : (
          <div className="rounded-xl bg-surface-alt px-3.5 py-3 text-center text-[12.5px] text-text-muted">
            Tài khoản này chưa có quyền chạy phân tích ảnh.
          </div>
        )}
      </div>
    </>
  )
}

function RunningStep({
  photoCount,
  phase,
  job,
  error,
  onRetry,
  onBackToConfirm,
}: {
  photoCount: number
  phase: RunPhase
  job: JobState | null
  error: string | null
  onRetry: () => void
  onBackToConfirm: () => void
}) {
  const phaseIndex = RUN_PHASES.findIndex((p) => p.key === phase)

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg">
          <AlertTriangle size={26} strokeWidth={1.8} className="text-danger" />
        </div>
        <div className="text-[14.5px] font-bold">Lượt phân tích chưa xong</div>
        <div className="max-w-xs text-[12.5px] leading-relaxed text-text-muted">{error}</div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Button className="w-full" onClick={onRetry}>
            <RotateCcw size={15} strokeWidth={2} />
            Thử lại
          </Button>
          <Button variant="secondary" className="w-full" onClick={onBackToConfirm}>
            Quay lại xác nhận
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto p-[22px]">
      <div className="text-[13px] text-text-muted">Đang phân tích {photoCount} ảnh trong lượt này.</div>

      <Card className="flex flex-col p-[18px]">
        {RUN_PHASES.map((p, i) => {
          const isDone = i < phaseIndex
          const isActive = i === phaseIndex
          return (
            <div key={p.key} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                {isDone ? (
                  <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Check size={12} strokeWidth={3} color="#fff" />
                  </div>
                ) : isActive ? (
                  <div className="h-[22px] w-[22px] flex-shrink-0 animate-pulse rounded-full bg-primary" />
                ) : (
                  <div className="h-[22px] w-[22px] flex-shrink-0 rounded-full border-2 border-border" />
                )}
                <div className={cn("min-h-[22px] w-0.5 flex-1", isDone ? "bg-secondary" : "bg-border")} />
              </div>
              <div className="pb-[22px]">
                <div className={cn("text-sm", i > phaseIndex ? "text-text-muted" : "font-bold")}>{p.label}</div>
                {isActive && p.key === "waiting" && job?.status === "PENDING" && (
                  <div className="mt-0.5 text-[11.5px] text-text-muted">Chờ tới lượt trong hàng đợi worker...</div>
                )}
                {isActive && p.key === "processing" && (
                  <div className="mt-0.5 text-[11.5px] text-text-muted">
                    {job?.stage === "DETECTING" ? "Đang nhận diện cấu phần trong ảnh..." : "Đang xử lý..."}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </Card>

      <div className="flex items-start gap-2.5 rounded-xl bg-surface-alt p-3.5">
        <Info size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-primary" />
        <div className="text-xs leading-relaxed text-text-muted">
          Bạn có thể rời màn hình — job vẫn chạy tiếp ở máy chủ, quay lại đây để xem kết quả.
        </div>
      </div>
    </div>
  )
}

const SECTION_LABELS: Record<string, string> = {
  flowers: "Hoa",
  foliage: "Lá",
  accessories: "Phụ kiện",
  wrapping: "Bao bì / Gói",
}

function rowLabel(section: string, row: Record<string, unknown>): string {
  if (section === "wrapping") {
    const layer = asText(row.layer) ?? "Lớp gói"
    const material = asText(row.material)
    return material ? `${layer} · ${material}` : layer
  }
  return asText(row.name) ?? asText(row.nhom_hoa) ?? "Chưa xác định"
}
function rowColor(row: Record<string, unknown>): string | null {
  return asText(row.mau) ?? asText(row.color)
}
function rowQuantity(row: Record<string, unknown>): number | null {
  return asNumber(row.quantity)
}
function rowConfidence(row: Record<string, unknown>): number | null {
  return asNumber(row.confidence)
}

function ResultStep({
  analyses,
  index,
  setIndex,
  photos,
  job,
  balanceAfter,
  canEdit,
  canApprove,
  onSaveEdit,
  onApprove,
  onFinish,
  onRunAnother,
}: {
  analyses: AnalysisRow[]
  index: number
  setIndex: (i: number) => void
  photos: UploadedPhoto[]
  job: JobState | null
  balanceAfter: number | null
  canEdit: boolean
  canApprove: boolean
  onSaveEdit: (analysisId: string, section: string, rowIndex: number, quantity: number) => Promise<void>
  onApprove: (analysisId: string) => Promise<void>
  onFinish: () => void
  onRunAnother: () => void
}) {
  const [editing, setEditing] = useState<{ section: string; rowIndex: number } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [busy, setBusy] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)

  if (analyses.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-[13px] text-text-muted">
        Không tìm thấy kết quả phân tích cho lượt chạy này.
      </div>
    )
  }

  const current = analyses[index]
  if (!current) return null
  const currentId = current.id
  const photo = photos.find((p) => p.assetId === current.asset_id)
  const bom = bomOf(current)
  const overallConfidence = asNumber(effectiveAnalysis(current).confidence)
  const allApproved = analyses.every((a) => a.approval_state === "APPROVED")

  async function handleApprove() {
    setBusy(true)
    setRowError(null)
    try {
      await onApprove(currentId)
    } catch (e) {
      setRowError(e instanceof Error ? e.message : "Không duyệt được")
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveEdit(section: string) {
    if (!editing) return
    const qty = Number(editValue)
    if (!Number.isFinite(qty) || qty < 0) {
      setRowError("Số lượng phải là số không âm")
      return
    }
    setBusy(true)
    setRowError(null)
    try {
      await onSaveEdit(currentId, section, editing.rowIndex, qty)
      setEditing(null)
    } catch (e) {
      setRowError(e instanceof Error ? e.message : "Không lưu được")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
        <div className="flex items-center justify-between text-[12.5px] text-text-muted">
          <span>
            Ảnh {index + 1}/{analyses.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
              className="rounded-full px-2.5 py-1 font-bold text-primary disabled:opacity-30"
            >
              ← Trước
            </button>
            <button
              type="button"
              disabled={index === analyses.length - 1}
              onClick={() => setIndex(index + 1)}
              className="rounded-full px-2.5 py-1 font-bold text-primary disabled:opacity-30"
            >
              Sau →
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {photo ? (
            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-alt">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.previewUrl} alt={photo.name} className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <div className="text-[15px] font-extrabold">{photo?.name ?? "Ảnh sản phẩm"}</div>
            <div className="flex items-center gap-1.5">
              {current.approval_state === "APPROVED" && (
                <span className="rounded-full bg-success-bg px-2.5 py-1 text-[11.5px] font-bold text-primary">
                  Đã duyệt
                </span>
              )}
              {overallConfidence != null && (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11.5px] font-bold",
                    overallConfidence < 70 ? "bg-warning-bg text-warning" : "bg-surface-alt text-text-muted"
                  )}
                >
                  Tin cậy {overallConfidence}%
                </span>
              )}
            </div>
          </div>
          {job?.result === "LOW_CONFIDENCE" && (
            <div className="flex items-start gap-1.5 rounded-lg bg-warning-bg px-2.5 py-2 text-[11.5px] text-warning">
              <AlertTriangle size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
              <div>Lượt phân tích này có ảnh nhận diện với độ tin cậy thấp — nên kiểm lại trước khi duyệt.</div>
            </div>
          )}
        </div>

        {Object.keys(SECTION_LABELS).map((section) => {
          const rows = asArray(bom[section])
          if (rows.length === 0) return null
          return (
            <Card key={section} className="flex flex-col gap-3 p-4">
              <div className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
                {SECTION_LABELS[section]}
              </div>
              {rows.map((row, rowIndex) => {
                const isEditingRow = editing?.section === section && editing.rowIndex === rowIndex
                const qty = rowQuantity(row)
                const confidence = rowConfidence(row)
                const color = rowColor(row)
                const editable = canEdit && section !== "wrapping"
                return (
                  <div key={rowIndex} className="flex items-center gap-3">
                    {color && (
                      <div
                        className="h-4 w-4 flex-shrink-0 rounded-md border border-border"
                        style={{ background: colorSwatch(color) }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold">{rowLabel(section, row)}</div>
                      {confidence != null && confidence < 70 && (
                        <span className="mt-0.5 inline-flex items-center rounded-full border-[1.3px] border-warning px-1.5 py-0.5 text-[10.5px] font-bold text-warning">
                          Chưa chắc — nên kiểm lại
                        </span>
                      )}
                    </div>
                    {isEditingRow ? (
                      <>
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-[34px] w-14 rounded-lg border-[1.5px] border-primary text-center text-[13.5px] font-bold outline-none"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleSaveEdit(section)}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-secondary-text hover:bg-surface-alt disabled:opacity-40"
                        >
                          <Check size={17} strokeWidth={2.4} />
                        </button>
                      </>
                    ) : (
                      <>
                        {qty != null && <div className="text-[13.5px] font-bold">× {qty}</div>}
                        {editable && qty != null && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditing({ section, rowIndex })
                              setEditValue(String(qty))
                              setRowError(null)
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt"
                          >
                            <Pencil size={16} strokeWidth={1.8} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </Card>
          )
        })}

        <div className="px-3 text-center text-[11.5px] text-text-muted">
          Bản sửa lưu tách khỏi dự đoán gốc — xem lại được máy đoán gì ban đầu.
        </div>

        {rowError && (
          <div className="rounded-lg bg-danger-bg px-2.5 py-2 text-center text-[11.5px] font-medium text-danger">
            {rowError}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-border bg-surface p-5">
        {current.approval_state === "APPROVED" ? (
          allApproved ? (
            <div className="flex flex-col gap-2">
              <div className="text-center text-[12.5px] text-text-muted">
                Đã duyệt cả {analyses.length} ảnh
                {balanceAfter != null ? ` — còn ${balanceAfter} credit.` : "."}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={onRunAnother}>
                  Phân tích lô khác
                </Button>
                <Button className="flex-1" onClick={onFinish}>
                  Về trang chủ
                </Button>
              </div>
            </div>
          ) : (
            <Button className="h-[50px] w-full" onClick={() => setIndex(Math.min(index + 1, analyses.length - 1))}>
              Sang ảnh tiếp theo
            </Button>
          )
        ) : canApprove ? (
          <Button className="h-[50px] w-full" disabled={busy} onClick={handleApprove}>
            {busy ? "Đang duyệt..." : "Duyệt"}
          </Button>
        ) : (
          <div className="rounded-xl bg-surface-alt px-3.5 py-3 text-center text-[12.5px] text-text-muted">
            Chỉ Điều hành mới duyệt được kết quả phân tích.
          </div>
        )}
      </div>
    </div>
  )
}

// Bảng màu tối thiểu cho khối màu bên cạnh mỗi cấu phần — chỉ để phân biệt
// nhanh bằng mắt, không phải màu thật của ảnh (không đọc được từ hợp đồng
// AI). Không khớp nhãn nào thì dùng lại nền trung tính.
const COLOR_SWATCHES: Record<string, string> = {
  Đỏ: "#C0392B",
  Hồng: "#E48692",
  Trắng: "#F4F1EA",
  Vàng: "#E8B923",
  Cam: "#E07B39",
  Tím: "#8E6FB5",
  Xanh: "#5F9670",
  "Xanh lá": "#5F9670",
  "Xanh dương": "#3B6FA0",
  Nâu: "#B08D57",
  Kem: "#EDE3D0",
  Đen: "#2B2B2B",
}
function colorSwatch(label: string): string {
  return COLOR_SWATCHES[label] ?? "#D9D2C7"
}
