"use client"

import React, { useState } from "react"
import { X, ShieldCheck, CheckCircle2, RotateCcw, Ban, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { errorMessage, type CoordinationOrder } from "@/components/coordinator/coordinator-api"

/**
 * P5 — Kiểm định chất lượng (Template T14, F10).
 *
 * Người kiểm so ảnh thành phẩm với ảnh mẫu và kết luận. Bản trước hiện "AI
 * Similarity 94%" từ một hằng số — không có lượt Vision nào chạy. Chấm AI
 * thật là nợ #140; tới khi có, `qc.aiScore` luôn null và giao diện nói rõ.
 */
export interface AiQcInspectionModalProps {
  isOpen: boolean
  order: CoordinationOrder | null
  onClose: () => void
  onSubmit: (decision: "PASSED" | "REWORK_REQUESTED" | "REJECTED", notes: string, checklist: Record<string, boolean>) => Promise<void>
}

const CHECKS: Array<{ key: string; label: string }> = [
  { key: "flowerMatch", label: "Đúng loại hoa và số cành theo BOM" },
  { key: "colorTone", label: "Đúng tông màu" },
  { key: "wrapping", label: "Đúng giấy gói / nơ / phụ kiện" },
  { key: "cardMessage", label: "Thiệp đúng nguyên văn lời chúc" },
]

export function AiQcInspectionModal({ isOpen, order, onClose, onSubmit }: AiQcInspectionModalProps) {
  const [notes, setNotes] = useState("")
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !order) return null

  const finished = order.finishedImageUrls[0] ?? null
  const allChecked = CHECKS.every((c) => checklist[c.key])

  const decide = async (decision: "PASSED" | "REWORK_REQUESTED" | "REJECTED") => {
    if (decision !== "PASSED" && !notes.trim()) {
      setError("QC không đạt phải ghi rõ lý do để xưởng sửa.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit(decision, notes.trim(), checklist)
      setNotes("")
      setChecklist({})
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const imageBox = (title: string, url: string | null, empty: string) => (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-surface-alt">
      <span className="font-bold text-text text-xs">{title}</span>
      <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-surface flex items-center justify-center">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-text-muted text-[11px] p-4 text-center">{empty}</span>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase border border-zinc-200">
                  CHẶNG P5 • KIỂM ĐỊNH QC
                </span>
                <h3 className="text-base font-extrabold text-text">Kiểm Định Chất Lượng (T14)</h3>
              </div>
              <p className="text-[11px] text-text-muted">
                Đơn #{order.orderCode} • Đối chiếu ảnh thợ cắm với ảnh mẫu chuẩn đầu vào
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {imageBox("📸 Ảnh mẫu chuẩn đầu vào", order.sampleImageUrl, "Đơn chưa có ảnh mẫu")}
            {imageBox("🌸 Ảnh thành phẩm thợ gửi", finished, "Chưa có ảnh thành phẩm — không kiểm được")}
          </div>

          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-900 flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>
              Chấm điểm AI tự động chưa bật cho điều phối — kết luận dưới đây là của người kiểm và được ghi vào hồ sơ QC
              kèm tên người kiểm.
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-bold text-text">Danh mục kiểm:</span>
            {CHECKS.map((c) => (
              <label key={c.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(checklist[c.key])}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="font-bold text-text block mb-1">Ghi chú QC (bắt buộc khi không đạt):</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ví dụ: nơ lệch màu, thiếu 2 cành hồng chủ đạo…"
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
            />
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-800 font-semibold">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex flex-wrap items-center justify-end gap-2.5 sticky bottom-0 bg-surface">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="outline" size="sm" disabled={busy || !finished} onClick={() => decide("REJECTED")} className="gap-1.5 text-red-700 border-red-300">
            <Ban size={14} /> Loại — mở sự cố
          </Button>
          <Button variant="outline" size="sm" disabled={busy || !finished} onClick={() => decide("REWORK_REQUESTED")} className="gap-1.5">
            <RotateCcw size={14} /> Yêu cầu làm lại
          </Button>
          <Button
            size="sm"
            disabled={busy || !finished || !allChecked}
            onClick={() => decide("PASSED")}
            title={allChecked ? undefined : "Tích đủ danh mục kiểm trước khi duyệt đạt"}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
          >
            <CheckCircle2 size={14} /> Đạt — chuyển giao hàng (P6)
          </Button>
        </div>
      </div>
    </div>
  )
}
