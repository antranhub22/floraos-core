"use client"

import React, { useState } from "react"
import { CheckCircle2, ShieldCheck, X, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import { DEFAULT_CANCELLATION_APPROVAL_TIMEOUT_MINUTES, parsePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"

interface CoordinatorAcceptRejectModalProps {
  mode: "accept" | "reject"
  orderId: string
  orderCode: string
  onClose: () => void
  onDone: () => void
}

const COMMON_REJECT_REASONS = [
  "Hết loại hoa theo yêu cầu của khách",
  "Xưởng quá tải khung giờ, không kịp cắm hoa",
  "Địa chỉ giao nằm ngoài khu vực hỗ trợ",
]

/**
 * Hộp thoại Điều phối xác nhận nhận đơn hoặc từ chối đơn hàng.
 * - Nhận đơn: chuyển đơn sang CONFIRMED để tiếp tục cắm hoa.
 * - Từ chối: huỷ đơn và kích hoạt quy trình hoàn tiền cho khách hàng.
 */
export function CoordinatorAcceptRejectModal({
  mode,
  orderId,
  orderCode,
  onClose,
  onDone,
}: CoordinatorAcceptRejectModalProps) {
  const isAccept = mode === "accept"
  const [note, setNote] = useState("")
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Thời gian chờ Điều hành duyệt theo cài đặt của tiệm (cùng nguồn với bảng Điều phối — SWR dùng chung bộ đệm)
  const org = useApi<{ settings?: Record<string, unknown> | null }>(isAccept ? null : "/api/v1/organizations/current")
  const approvalMinutes = parsePaymentPolicy(org.data?.settings).cancellationApprovalTimeoutMinutes ?? DEFAULT_CANCELLATION_APPROVAL_TIMEOUT_MINUTES

  async function handleSubmit() {
    setBusy(true)
    setError(null)
    try {
      if (isAccept) {
        await apiSend(
          `/api/v1/greeting-card/orders/${orderId}/accept`,
          "POST",
          { note: note.trim() || undefined },
          "Không thể xác nhận nhận đơn"
        )
      } else {
        if (!reason.trim()) {
          setError("Vui lòng nhập lý do từ chối nhận đơn")
          setBusy(false)
          return
        }
        await apiSend(
          `/api/v1/greeting-card/orders/${orderId}/reject`,
          "POST",
          { reason: reason.trim() },
          "Không thể từ chối nhận đơn"
        )
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác không thành công")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coordinator-decision-modal-title"
        className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h3 id="coordinator-decision-modal-title" className="text-body font-extrabold text-foreground flex items-center gap-2">
            {isAccept ? (
              <>
                <ShieldCheck size={20} className="text-success" aria-hidden="true" />
                Xác nhận Nhận đơn — #{orderCode}
              </>
            ) : (
              <>
                <XCircle size={20} className="text-danger" aria-hidden="true" />
                Từ chối Nhận đơn — #{orderCode}
              </>
            )}
          </h3>
          <button type="button" aria-label="Đóng" onClick={onClose} className="text-text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <p className="text-body-sm text-text-muted leading-relaxed">
          {isAccept
            ? "Xác nhận xưởng có đầy đủ hoa và nhân lực để hoàn thành đơn hàng. Đơn sẽ chuyển sang trạng thái Đã xác nhận để tiếp tục phân công Florist cắm hoa."
            : `Đề xuất không nhận đơn sẽ được gửi lên Điều hành phê duyệt hủy & hoàn tiền cho khách. Nếu Điều hành không duyệt trong vòng ${approvalMinutes} phút, đơn sẽ tự động hủy theo đề xuất.`}
        </p>

        {isAccept ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="coordinator-accept-note" className="text-body-sm font-semibold text-foreground">
              Ghi chú xưởng (tùy chọn)
            </label>
            <textarea
              id="coordinator-accept-note"
              rows={3}
              maxLength={500}
              placeholder="Vd: Chuẩn bị hoa sớm, khách yêu cầu thêm thiệp chúc mừng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted p-3 text-body-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor="coordinator-reject-reason" className="text-body-sm font-semibold text-foreground">
              Lý do từ chối <span className="text-danger">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {COMMON_REJECT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-caption px-2.5 py-1 rounded-lg border text-left transition-colors ${
                    reason === r
                      ? "border-danger bg-danger-bg text-danger font-semibold"
                      : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              id="coordinator-reject-reason"
              rows={3}
              maxLength={500}
              placeholder="Nhập hoặc chỉnh sửa lý do từ chối (bắt buộc)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted p-3 text-body-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-danger/40"
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-danger text-caption font-medium">
            {error}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy} className="h-9 text-caption">
            Huỷ
          </Button>
          {isAccept ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => void handleSubmit()}
              className="h-9 text-caption font-extrabold gap-1.5 bg-success hover:bg-success/90 text-white"
            >
              <CheckCircle2 size={15} />
              {busy ? "Đang xử lý..." : "Xác nhận Nhận đơn"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || !reason.trim()}
              onClick={() => void handleSubmit()}
              className="h-9 text-caption font-bold gap-1.5 border-danger/40 bg-danger text-white hover:bg-danger/90"
            >
              <XCircle size={15} />
              {busy ? "Đang xử lý..." : "Gửi đề xuất Từ chối đơn"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
