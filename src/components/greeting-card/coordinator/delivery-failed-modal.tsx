"use client"

import React, { useState } from "react"
import { PackageX, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"
import {
  DELIVERY_FAILURE_LABEL,
  DELIVERY_FAILURE_REASONS,
  FAILURE_NOTE_MAX,
  deliveryFailureError,
  type DeliveryFailureReason,
} from "@/modules/greeting-card/domain/delivery-failure"

/**
 * Điều phối ghi lần giao không thành công: lý do, ghi chú (vd. đã gọi mấy cuộc), có tính phí giao
 * lại theo cài đặt của tiệm không. Đơn chờ hẹn lại; khách thấy và đổi được giờ/địa chỉ giao.
 */
export function DeliveryFailedModal({ orderId, orderCode, onClose, onDone }: { orderId: string; orderCode: string; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState<DeliveryFailureReason>("NO_ANSWER")
  const [note, setNote] = useState("")
  const [chargeFee, setChargeFee] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const invalid = deliveryFailureError({ reason, note })

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await apiSend(`/api/v1/greeting-card/orders/${orderId}/delivery-failed`, "POST", { reason, note: note.trim(), chargeFee }, "Chưa ghi được")
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa ghi được")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div role="presentation" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="delivery-failed-title" className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 id="delivery-failed-title" className="text-body font-extrabold text-foreground flex items-center gap-2">
            <PackageX size={18} className="text-warning" aria-hidden="true" /> Giao không thành công — #{orderCode}
          </h3>
          <button type="button" aria-label="Đóng" onClick={onClose} className="text-text-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <p className="text-body-sm text-text-muted">Đơn chuyển sang <strong>chờ giao lại</strong>. Khách được báo và có thể đổi giờ hoặc địa chỉ giao trên trang theo dõi.</p>

        <fieldset className="flex flex-col gap-2" disabled={busy}>
          <legend className="text-body-sm font-bold text-foreground mb-1">Lý do</legend>
          {DELIVERY_FAILURE_REASONS.map((r) => (
            <label key={r} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-body-sm ${reason === r ? "border-primary bg-primary/5" : "border-border"}`}>
              <input type="radio" name="delivery-failed-reason" checked={reason === r} onChange={() => setReason(r)} />
              <span>{DELIVERY_FAILURE_LABEL[r]}</span>
            </label>
          ))}
        </fieldset>

        <label className="sr-only" htmlFor="delivery-failed-note">Ghi chú</label>
        <textarea id="delivery-failed-note" rows={2} maxLength={FAILURE_NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={reason === "OTHER" ? "Ghi rõ lý do (bắt buộc)" : "Ghi chú: đã gọi mấy cuộc, giờ nào, người nhận hẹn lại lúc nào…"}
          className="w-full rounded-xl border border-border bg-surface-muted p-3 text-body-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />

        <label className="flex min-h-11 items-start gap-2 text-body-sm text-foreground">
          <input type="checkbox" checked={chargeFee} onChange={(e) => setChargeFee(e.target.checked)} className="mt-1" />
          <span>Tính phí giao lại theo cài đặt của tiệm <span className="text-text-muted">(bỏ chọn nếu lỗi do cửa hàng / shipper)</span></span>
        </label>

        {error && <p role="alert" className="text-danger text-caption">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-9 text-caption">Huỷ</Button>
          <Button type="button" size="sm" disabled={!!invalid || busy} title={invalid ?? undefined} onClick={() => void submit()} className="h-9 text-caption">
            {busy ? "Đang lưu..." : "Xác nhận giao không thành công"}
          </Button>
        </div>
      </div>
    </div>
  )
}
