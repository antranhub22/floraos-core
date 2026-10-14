"use client"

import React, { useState } from "react"
import { Ban, AlertCircle } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface CancelFloristOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderCode: string
  recipeTitle: string
  onConfirmCancel: (reason: string) => Promise<void>
}

const QUICK_REASONS = [
  "Thợ quá tải / Bận giờ cao điểm",
  "Hết loại hoa chính trong công thức",
  "Thời gian chuẩn bị quá gấp",
  "Mức giá gia công chưa đạt thỏa thuận",
  "Khu vực giao quá xa phạm vi xưởng",
]

export function CancelFloristOrderModal({
  open,
  onOpenChange,
  orderCode,
  recipeTitle,
  onConfirmCancel,
}: CancelFloristOrderModalProps) {
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectQuickReason = (tag: string) => {
    if (!reason.trim()) {
      setReason(tag)
    } else if (!reason.includes(tag)) {
      setReason(`${reason.trim()}, ${tag}`)
    }
  }

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Vui lòng ghi ngắn gọn lý do từ chối / hủy nhận đơn.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onConfirmCancel(reason.trim())
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể thực hiện hủy đơn.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={
        <div className="flex items-center gap-2 text-danger">
          <Ban size={18} />
          <span>Hủy Không Nhận Đơn Gia Công</span>
        </div>
      }
      description={`Đơn #${orderCode} • ${recipeTitle}`}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
            Quay lại
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-danger hover:bg-danger-dark text-white font-bold"
          >
            {submitting ? "Đang xử lý..." : "Xác nhận hủy đơn"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-1 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger font-medium">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="font-bold text-text block">Chọn nhanh lý do từ chối</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelectQuickReason(tag)}
                className="px-2.5 py-1 rounded-lg border border-border bg-surface-alt hover:bg-surface text-text font-medium text-caption transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-text block">
            Lý do chi tiết <span className="text-danger">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do cụ thể vì sao không nhận đơn (được lưu vào lịch sử kiểm toán)..."
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text text-body-sm focus:outline-none focus:ring-1 focus:ring-danger"
          />
        </div>

        <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-caption flex items-start gap-2 text-text-muted">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-danger" />
          <span>
            Hành động này sẽ hủy và đóng đơn gia công trong hệ thống điều phối, đồng thời lưu trữ lý do hủy vào lịch sử kiểm toán của đơn hàng.
          </span>
        </div>
      </div>
    </Dialog>
  )
}
