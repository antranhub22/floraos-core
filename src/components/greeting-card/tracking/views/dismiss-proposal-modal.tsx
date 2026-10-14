"use client"

import React, { useState } from "react"
import { EyeOff, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TrackingViewItem } from "@/modules/greeting-card/domain/tracking-views"
import { DISMISSAL_REASONS, type DismissalReasonId } from "@/modules/greeting-card/domain/dismissal-policy"

interface DismissProposalModalProps {
  item: TrackingViewItem
  onClose: () => void
  onSuccess: () => void
}

/**
 * Modal đề xuất / hủy bỏ hiển thị đơn hàng/link chưa thanh toán.
 * - Sale: gửi đề xuất kèm lý do, hệ thống tự duyệt sau 5 phút nếu Điều hành không phản hồi.
 * - Điều hành: trực tiếp duyệt bỏ hiển thị và lưu lịch sử.
 */
export function DismissProposalModal({ item, onClose, onSuccess }: DismissProposalModalProps) {
  const [reasonId, setReasonId] = useState<DismissalReasonId>(DISMISSAL_REASONS[0].id)
  const [customReason, setCustomReason] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedReasonObj = DISMISSAL_REASONS.find((r) => r.id === reasonId)
  const finalReasonText = reasonId === "OTHER" ? customReason.trim() : (selectedReasonObj?.label ?? "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!finalReasonText) {
      setError("Vui lòng nhập lý do cụ thể")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/v1/greeting-card/tracking/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.orderId ?? item.sessionId,
          type: item.orderId ? "ORDER" : "SESSION",
          reasonId,
          reasonText: finalReasonText,
          note: note.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message || "Không thể thực hiện đề xuất bỏ hiển thị")
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra"
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const orderTitle = item.orderCode || item.sendCode || "Đơn hàng"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dismiss-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger">
              <EyeOff size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 id="dismiss-modal-title" className="text-body font-bold text-foreground">
                Bỏ hiển thị: {orderTitle}
              </h2>
              <p className="text-caption text-text-muted">
                {item.customerName || "Khách hàng"} · {item.productName || "Sản phẩm"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-foreground cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          <div className="rounded-xl border border-warning-border bg-warning-bg/40 p-3 text-caption text-warning-text flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-warning" aria-hidden="true" />
            <span>
              Đơn sẽ được ẩn khỏi bảng tiến độ. Sau <strong>5 phút</strong> nếu Điều hành chưa duyệt, hệ thống sẽ tự động chấp thuận. Đơn có thể khôi phục lại bất kỳ lúc nào từ bộ lọc &ldquo;Đã hủy / bỏ hiển thị&rdquo;.
            </span>
          </div>

          <div>
            <label htmlFor="dismiss-reason-select" className="block text-caption font-semibold text-foreground mb-1">
              Lý do bỏ hiển thị <span className="text-danger">*</span>
            </label>
            <select
              id="dismiss-reason-select"
              value={reasonId}
              onChange={(e) => setReasonId(e.target.value as DismissalReasonId)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {DISMISSAL_REASONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {reasonId === "OTHER" && (
            <div>
              <label htmlFor="dismiss-custom-reason" className="block text-caption font-semibold text-foreground mb-1">
                Chi tiết lý do khác <span className="text-danger">*</span>
              </label>
              <input
                id="dismiss-custom-reason"
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do cụ thể..."
                maxLength={200}
                required
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div>
            <label htmlFor="dismiss-note" className="block text-caption font-semibold text-foreground mb-1">
              Ghi chú thêm (tùy chọn)
            </label>
            <textarea
              id="dismiss-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú nội bộ cho Điều hành..."
              rows={2}
              maxLength={500}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-danger-border bg-danger-bg p-2.5 text-caption text-danger">
              {error}
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-danger text-white hover:opacity-90"
              disabled={submitting}
            >
              {submitting ? "Đang gửi..." : "Xác nhận bỏ hiển thị"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
