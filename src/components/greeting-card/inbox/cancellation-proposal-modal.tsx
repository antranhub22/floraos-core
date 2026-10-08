"use client"

import React, { useState } from "react"
import { AlertTriangle, Loader2, X, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"
import {
  CANCELLATION_TYPE_LABEL,
  type CancellationType,
  validateCancellationProposal,
} from "@/modules/greeting-card/domain/cancellation-request"

interface Props {
  orderId: string
  orderCode: string
  totalVnd: number
  paidVnd: number
  onClose: () => void
  onSuccess: () => void
}

export function CancellationProposalModal({
  orderId,
  orderCode,
  totalVnd,
  paidVnd,
  onClose,
  onSuccess,
}: Props) {
  const [type, setType] = useState<CancellationType>(paidVnd > 0 ? "FULL_REFUND" : "CANCEL_ONLY")
  const [refundAmount, setRefundAmount] = useState<string>(paidVnd > 0 ? String(paidVnd) : "0")
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTypeChange = (newType: CancellationType) => {
    setType(newType)
    if (newType === "CANCEL_ONLY") setRefundAmount("0")
    else if (newType === "FULL_REFUND") setRefundAmount(String(paidVnd))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const refundNum = Number(refundAmount) || 0
    const validationError = validateCancellationProposal(
      {
        type,
        reason: reason.trim(),
        refundAmountVnd: refundNum,
        note: note.trim(),
      },
      { status: "CONFIRMED", totalVnd, paidVnd }
    )

    if (validationError) {
      setError(validationError)
      return
    }

    setBusy(true)
    try {
      await apiSend(
        "/api/v1/greeting-card/cancellation-requests",
        "POST",
        {
          orderId,
          type,
          reason: reason.trim(),
          refundAmountVnd: refundNum,
          note: note.trim() || undefined,
        },
        "Không thể gửi đề xuất"
      )
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi gửi đề xuất")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-muted"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 text-danger mb-1">
          <AlertTriangle size={20} />
          <h3 id="cancel-modal-title" className="text-title-sm font-extrabold text-foreground">
            Đề xuất Hủy / Hoàn tiền đơn #{orderCode}
          </h3>
        </div>
        <p className="text-caption text-text-muted mb-4">
          Tổng đơn: <strong className="text-foreground">{totalVnd.toLocaleString("vi-VN")}đ</strong> · Đã thu:{" "}
          <strong className="text-success">{paidVnd.toLocaleString("vi-VN")}đ</strong>
        </p>

        {error && (
          <div role="alert" className="p-3 mb-4 rounded-xl bg-danger-bg text-danger text-body-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-body-sm font-bold text-foreground mb-1.5">Hình thức đề xuất</label>
            <div className="flex flex-col gap-2">
              {(["CANCEL_ONLY", "FULL_REFUND", "PARTIAL_REFUND"] as CancellationType[]).map((t) => (
                <label
                  key={t}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-body-sm transition-colors ${
                    type === t ? "border-primary bg-primary/5 font-semibold text-foreground" : "border-border text-text-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellation-type"
                    value={t}
                    checked={type === t}
                    onChange={() => handleTypeChange(t)}
                  />
                  <span>{CANCELLATION_TYPE_LABEL[t]}</span>
                </label>
              ))}
            </div>
          </div>

          {type !== "CANCEL_ONLY" && (
            <div>
              <label htmlFor="refund-amount" className="block text-body-sm font-bold text-foreground mb-1">
                Số tiền đề xuất hoàn (VNĐ) <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="refund-amount"
                  type="number"
                  min="1000"
                  max={paidVnd}
                  step="1000"
                  disabled={type === "FULL_REFUND"}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-body font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-75"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-muted">đ</span>
              </div>
              {type === "FULL_REFUND" && (
                <p className="mt-1 text-caption text-text-muted">Hoàn trả toàn bộ 100% số tiền khách đã thanh toán</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="cancel-reason" className="block text-body-sm font-bold text-foreground mb-1">
              Lý do đề xuất <span className="text-danger">*</span>
            </label>
            <textarea
              id="cancel-reason"
              required
              rows={2}
              placeholder="VD: Khách đổi lịch đột xuất không nhận hoa..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="cancel-note" className="block text-body-sm font-bold text-foreground mb-1">
              Ghi chú thêm cho Điều hành (tùy chọn)
            </label>
            <input
              id="cancel-note"
              type="text"
              placeholder="VD: Đã xin ý kiến khách qua Zalo..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-body-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
              Đóng
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={busy}
              className="bg-danger hover:bg-danger-dark text-white font-bold gap-1.5"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              <span>Gửi Điều hành duyệt</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
