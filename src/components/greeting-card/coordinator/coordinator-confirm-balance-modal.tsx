"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"
import Image from "next/image"
import { Banknote, CheckCircle2 } from "lucide-react"

interface CoordinatorConfirmBalanceModalProps {
  orderId: string
  orderCode: string
  balanceVnd: number
  proofUrl?: string | null | undefined
  onClose: () => void
  onDone: (message: string) => void
}

/**
 * Dialog xác nhận Điều phối đã nhận đủ tiền lần 2 (balance) cho đơn đặt cọc.
 * Hiển thị ảnh bill lần 2 để đối soát trước khi xác nhận.
 */
export function CoordinatorConfirmBalanceModal({
  orderId,
  orderCode,
  balanceVnd,
  proofUrl,
  onClose,
  onDone,
}: CoordinatorConfirmBalanceModalProps) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await apiSend(
        `/api/v1/greeting-card/orders/${orderId}/confirm-balance`,
        "POST",
        { note: note.trim() || undefined },
        "Không xác nhận được thanh toán lần 2",
      )
      onDone(`Đã xác nhận nhận đủ ${balanceVnd.toLocaleString("vi-VN")}đ cho đơn #${orderCode}. Đơn hàng sẵn sàng giao.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác không thành công")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-balance-title"
    >
      <form
        onSubmit={handleConfirm}
        className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md p-5 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <Banknote size={20} className="text-warning shrink-0" />
          <h3 id="confirm-balance-title" className="text-body font-extrabold text-foreground">
            Xác nhận Nhận Đủ Tiền Lần 2 — #{orderCode}
          </h3>
        </div>

        <p className="text-body-sm text-text-muted">
          Phần còn lại:{" "}
          <span className="font-extrabold text-foreground">
            {balanceVnd.toLocaleString("vi-VN")}đ
          </span>
        </p>

        {proofUrl && (
          <div className="flex flex-col gap-1.5">
            <span className="text-caption font-bold text-text-muted">Ảnh chuyển khoản lần 2 của khách:</span>
            <a href={proofUrl} target="_blank" rel="noopener noreferrer">
              <Image
                src={proofUrl}
                alt="Ảnh chuyển khoản lần 2"
                width={320}
                height={200}
                unoptimized
                className="w-full max-h-48 object-contain rounded-xl border border-border bg-surface-muted"
              />
            </a>
            <p className="text-caption text-text-muted">Nhấp ảnh để xem kích thước đầy đủ.</p>
          </div>
        )}

        {!proofUrl && (
          <div className="p-3 rounded-xl bg-warning-bg border border-warning/30 text-caption text-warning">
            Khách chưa tải ảnh bill lần 2. Hãy đối soát tài khoản ngân hàng trực tiếp trước khi xác nhận.
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-caption font-bold">Ghi chú (không bắt buộc)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="VD: Đã kiểm tra sao kê, khớp số tiền và nội dung CK"
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground"
          />
        </label>

        {error && (
          <p role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-body-sm">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Huỷ
          </Button>
          <Button
            type="submit"
            disabled={busy}
            className="bg-warning hover:bg-warning/90 text-white font-bold gap-1.5"
          >
            <CheckCircle2 size={16} />
            {busy ? "Đang xử lý..." : "Xác nhận Đã Nhận Đủ Tiền"}
          </Button>
        </div>
      </form>
    </div>
  )
}
