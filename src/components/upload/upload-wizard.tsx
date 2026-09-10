"use client"

// Luồng phân tích ảnh (M01) — đặc tả 03 mục 6:
// Tải ảnh → Xác nhận ảnh → Đang chạy → Kết quả (sửa tại chỗ + duyệt).
//
// Bản demo: chạy hoàn toàn ở client, KHÔNG gọi API thật, không tạo job thật.
// Khi nối backend: bước "confirm" gọi POST tạo job, bước "running" thay
// interval giả bằng use-job-stream.ts (SSE) đọc theo đúng job thật.

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, X, Check, Pencil, Info } from "lucide-react"
import { FlowTopBar } from "@/components/layout/flow-top-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FlowerPlaceholder } from "@/components/ui/flower-placeholder"
import { cn } from "@/lib/utils"

type Step = "upload" | "confirm" | "running" | "result"

type Photo = { id: number; name: string; tint: string; color: string }

const TINTS = [
  { tint: "#FBEAEC", color: "#E48692" },
  { tint: "#E7EEE6", color: "#5F9670" },
  { tint: "#EEF4EE", color: "#174C3C" },
] as const

const FALLBACK_TINT = TINTS[0]

function tintFor(index: number) {
  return TINTS[index % TINTS.length] ?? FALLBACK_TINT
}

const RUN_STEPS = ["Phân tích ảnh", "Nhận diện cấu phần", "Đối chiếu từ điển", "Chốt số lượng"]

type Component = { id: string; section: string; name: string; qty: number | null; color: string; low: boolean }

const RESULT_COMPONENTS: Component[] = [
  { id: "flower", section: "Hoa", name: "Hồng đỏ", qty: 20, color: "#C0392B", low: false },
  { id: "leaf", section: "Lá", name: "Lá bạc hà", qty: 6, color: "#5F9670", low: true },
  { id: "accessory", section: "Phụ kiện", name: "Ruy băng đỏ", qty: 1, color: "#B0473F", low: false },
  { id: "packaging", section: "Bao bì", name: "Giấy kraft nâu", qty: null, color: "#B08D57", low: false },
]

export function UploadWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [photos, setPhotos] = useState<Photo[]>([
    { id: 1, name: "Bó hồng đỏ 20 cành", ...tintFor(0) },
    { id: 2, name: "Giỏ hoa chúc mừng", ...tintFor(1) },
  ])
  const nextId = useRef(3)

  const stepIndex = { upload: 1, confirm: 2, running: 3, result: 4 }[step]

  function addPhoto() {
    const t = tintFor(photos.length)
    setPhotos((cur) => [...cur, { id: nextId.current++, name: `Ảnh sản phẩm ${cur.length + 1}`, ...t }])
  }
  function removePhoto(id: number) {
    setPhotos((cur) => cur.filter((p) => p.id !== id))
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
        <UploadStep photos={photos} onAdd={addPhoto} onRemove={removePhoto} onNext={() => setStep("confirm")} />
      )}
      {step === "confirm" && (
        <ConfirmStep
          photos={photos}
          onRemove={removePhoto}
          onRename={renamePhoto}
          onStart={() => setStep("running")}
        />
      )}
      {step === "running" && <RunningStep photoName={photos[0]?.name ?? "Sản phẩm"} onDone={() => setStep("result")} />}
      {step === "result" && <ResultStep />}
    </div>
  )
}

function UploadStep({
  photos,
  onAdd,
  onRemove,
  onNext,
}: {
  photos: Photo[]
  onAdd: () => void
  onRemove: (id: number) => void
  onNext: () => void
}) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
        <button
          type="button"
          onClick={onAdd}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-5 py-8"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-alt">
            <Camera size={26} strokeWidth={1.8} className="text-primary" />
          </div>
          <div className="text-[14.5px] font-bold">Chụp ảnh hoặc chọn từ thư viện</div>
          <div className="text-center text-xs text-text-muted">
            Nhiều ảnh cùng lúc được — mỗi ảnh một lượt phân tích. Tối đa 10 ảnh.
          </div>
        </button>

        {photos.length > 0 ? (
          <div>
            <div className="mb-2.5 text-[13px] font-bold text-text-muted">Ảnh đã chọn · {photos.length}</div>
            <div className="grid grid-cols-3 gap-2.5">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl"
                  style={{ background: p.tint }}
                >
                  <FlowerPlaceholder size={26} color={p.color} />
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
  onRemove,
  onRename,
  onStart,
}: {
  photos: Photo[]
  onRemove: (id: number) => void
  onRename: (id: number, name: string) => void
  onStart: () => void
}) {
  const cost = photos.length
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <div className="text-[12.5px] text-text-muted">
          Kiểm tra lại danh sách ảnh trước khi trừ credit. Bỏ được từng ảnh khỏi lượt chạy.
        </div>

        <div className="flex flex-col gap-2.5">
          {photos.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-2.5">
              <div
                className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: p.tint }}
              >
                <FlowerPlaceholder size={24} color={p.color} />
              </div>
              <div className="min-w-0 flex-1">
                <input
                  value={p.name}
                  onChange={(e) => onRename(p.id, e.target.value)}
                  className="w-full border-none bg-transparent text-[13.5px] font-semibold text-text outline-none"
                />
                <div className="mt-0.5 text-[11.5px] text-text-muted">1 credit</div>
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

        <Card className="flex flex-col gap-2.5 border-none bg-surface-alt p-4">
          <div className="flex justify-between text-[13.5px]">
            <span className="text-text-muted">{photos.length} ảnh × 1 credit</span>
            <span className="font-bold">{cost} credit</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-[13.5px]">
            <span className="text-text-muted">Credit còn lại sau khi chạy</span>
            <span className="font-bold text-primary">{20 - cost} / 20</span>
          </div>
        </Card>
      </div>
      <div className="flex-shrink-0 border-t border-border bg-surface p-5">
        <Button className="w-full" disabled={photos.length === 0} onClick={onStart}>
          Bắt đầu phân tích ({cost} credit)
        </Button>
      </div>
    </>
  )
}

function RunningStep({ photoName, onDone }: { photoName: string; onDone: () => void }) {
  const [runStep, setRunStep] = useState(2)
  const [logOpen, setLogOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setRunStep((cur) => {
        if (cur >= 4) {
          clearInterval(timer)
          return cur
        }
        return cur + 1
      })
    }, 2200)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (runStep >= 4) {
      const t = setTimeout(onDone, 900)
      return () => clearTimeout(t)
    }
  }, [runStep, onDone])

  const logs = [
    "Đang tải ảnh lên máy chủ...",
    "Đang nhận diện cấu phần trong ảnh...",
    "Đang đối chiếu 'hồng đỏ' với từ điển cấu phần...",
    "Đang chốt số lượng từng cấu phần...",
  ]
  const currentLog = runStep >= 4 ? "Phân tích hoàn tất — đang chuyển sang màn hình kết quả..." : logs[runStep]

  return (
    <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto p-[22px]">
      <div className="flex items-center gap-3.5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FBEAEC]">
          <FlowerPlaceholder size={30} color="#E48692" />
        </div>
        <div>
          <div className="text-[15px] font-bold">{photoName}</div>
          <div className="text-xs text-text-muted">Ảnh 1/2 trong lượt này</div>
        </div>
      </div>

      <Card className="flex flex-col p-[18px]">
        {RUN_STEPS.map((label, i) => {
          const isDone = i < runStep
          const isActive = i === runStep
          return (
            <div key={label} className="flex gap-3.5">
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
                <div className={cn("text-sm", i > runStep ? "text-text-muted" : "font-bold")}>{label}</div>
              </div>
            </div>
          )
        })}
      </Card>

      <button type="button" onClick={() => setLogOpen((v) => !v)} className="flex flex-col gap-1 text-left">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" />
          <div className="text-[12.5px] text-text-muted">{currentLog}</div>
        </div>
        {logOpen && (
          <div className="ml-3 mt-1.5 rounded-lg bg-surface-alt px-3 py-2.5 text-[11.5px] leading-7 text-text-muted">
            09:41:02 — nhận ảnh, bắt đầu hàng đợi
            <br />
            09:41:05 — phân tích ảnh xong
            <br />
            09:41:09 — nhận diện 4 cấu phần
            <br />
            09:41:14 — đối chiếu từ điển cấu phần
          </div>
        )}
      </button>

      <div className="flex items-start gap-2.5 rounded-xl bg-surface-alt p-3.5">
        <Info size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-primary" />
        <div className="text-xs leading-relaxed text-text-muted">
          Bạn có thể rời màn hình — job vẫn chạy tiếp, chúng tôi báo khi xong.
        </div>
      </div>
    </div>
  )
}

function ResultStep() {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [approved, setApproved] = useState(false)

  const bySection = new Map<string, Component[]>()
  RESULT_COMPONENTS.forEach((c) => {
    bySection.set(c.section, [...(bySection.get(c.section) ?? []), c])
  })

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
        <div className="flex flex-col gap-2.5">
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-[#FBEAEC]">
            <FlowerPlaceholder size={72} color="#E48692" />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[15px] font-extrabold">Bó hồng đỏ 20 cành</div>
            <span className="rounded-full bg-success-bg px-2.5 py-1 text-[11.5px] font-bold text-primary">
              Nhận dạng · Bó hoa
            </span>
          </div>
        </div>

        {Array.from(bySection.entries()).map(([section, rows]) => (
          <Card key={section} className="flex flex-col gap-3 p-4">
            <div className="text-[13px] font-bold uppercase tracking-wide text-text-muted">{section}</div>
            {rows.map((row) => {
              const isEditing = editingId === row.id
              const qty = values[row.id] ?? (row.qty != null ? String(row.qty) : "")
              return (
                <div key={row.id} className="flex items-center gap-3">
                  <div className="h-4 w-4 flex-shrink-0 rounded-md" style={{ background: row.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold">{row.name}</div>
                    {row.low && (
                      <span className="mt-0.5 inline-flex items-center rounded-full border-[1.3px] border-warning px-1.5 py-0.5 text-[10.5px] font-bold text-warning">
                        Chưa chắc — nên kiểm lại
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <>
                      <input
                        value={qty}
                        onChange={(e) => setValues((v) => ({ ...v, [row.id]: e.target.value }))}
                        className="h-[34px] w-14 rounded-lg border-[1.5px] border-primary text-center text-[13.5px] font-bold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-secondary-text hover:bg-surface-alt"
                      >
                        <Check size={17} strokeWidth={2.4} />
                      </button>
                    </>
                  ) : (
                    <>
                      {row.qty != null || values[row.id] ? (
                        <div className="text-[13.5px] font-bold">× {qty}</div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setEditingId(row.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt"
                      >
                        <Pencil size={16} strokeWidth={1.8} />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </Card>
        ))}

        <div className="px-3 text-center text-[11.5px] text-text-muted">
          Bản sửa lưu tách khỏi dự đoán gốc — xem lại được máy đoán gì ban đầu.
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border bg-surface p-5">
        <Button className="h-[50px] w-full" onClick={() => setApproved(true)}>
          Duyệt
        </Button>
      </div>

      {approved && (
        <div className="absolute inset-0 flex items-end bg-primary/50">
          <div className="flex w-full flex-col items-center gap-3.5 rounded-t-3xl bg-surface px-6 py-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg">
              <Check size={26} strokeWidth={2.6} className="text-primary" />
            </div>
            <div className="text-base font-extrabold">Đã duyệt</div>
            <div className="text-center text-[13px] leading-relaxed text-text-muted">
              Dữ liệu đã vào Product Master. Màn hình tiếp theo sẽ gợi ý bước kế.
            </div>
            <Button className="mt-1.5 w-full" onClick={() => router.push("/")}>
              Về trang chủ
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
