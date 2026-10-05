"use client"

import React, { useState } from "react"
import { Camera, Image as ImageIcon, Truck, UserCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"
import { CoordinatorImageUpload } from "./coordinator-image-upload"
import type { ModalState } from "./coordinator-order-card"

type ActiveModal = Exclude<ModalState, { type: "none" }>

const CONFIG = {
  florist: {
    icon: UserCheck,
    title: "Giao Florist",
    description: <>Ghi chú phân công florist (tên thợ, yêu cầu đặc biệt). Trạng thái sẽ chuyển sang <strong>Đang cắm hoa</strong>.</>,
    note: { path: "assign-florist", field: "floristNote", placeholder: "Vd: Giao cho Thợ Mai — ưu tiên hoa hồng đỏ tươi", confirm: "Xác nhận Giao Florist" },
  },
  "product-photo": {
    icon: Camera,
    title: "Ảnh Thành Phẩm",
    description: null,
    photo: { endpoint: "product-photo", label: "Ảnh hoa thành phẩm" },
  },
  dispatch: {
    icon: Truck,
    title: "Giao Ship",
    description: <>Nhập thông tin shipper / mã vận đơn. Trạng thái sẽ chuyển sang <strong>Đang giao hoa</strong>.</>,
    note: { path: "dispatch-shipping", field: "trackingNote", placeholder: "Vd: Anh Hùng GHN · 0912345678 · Mã VĐ: GHNXXX", confirm: "Xác nhận Giao Ship" },
  },
  "recipient-photo": {
    icon: ImageIcon,
    title: "Ảnh Người Nhận",
    description: <>Upload ảnh chụp trao hoa. Đơn sẽ chuyển sang <strong>Giao thành công · Hoàn tất</strong>.</>,
    photo: { endpoint: "recipient-photo", label: "Ảnh giao hoa thành công" },
  },
} as const

/** Hộp thoại một tác vụ xưởng: ghi chú (florist, ship) hoặc tải ảnh (thành phẩm, người nhận). */
export function CoordinatorActionModal({ modal, onClose, onDone }: { modal: ActiveModal; onClose: () => void; onDone: () => void }) {
  const cfg = CONFIG[modal.type]
  const Icon = cfg.icon
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitNote() {
    if (!("note" in cfg)) return
    setBusy(true)
    setError(null)
    try {
      await apiSend(`/api/v1/greeting-card/orders/${modal.orderId}/${cfg.note.path}`, "POST", { [cfg.note.field]: note.trim() }, "Lỗi thực hiện tác vụ")
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định")
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
        aria-labelledby="coordinator-modal-title"
        className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h3 id="coordinator-modal-title" className="text-body font-extrabold text-foreground flex items-center gap-2">
            <Icon size={18} className="text-primary" />
            {cfg.title} — #{modal.orderCode}
          </h3>
          <button type="button" aria-label="Đóng" onClick={onClose} className="text-text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        {cfg.description && <p className="text-body-sm text-text-muted">{cfg.description}</p>}

        {"note" in cfg ? (
          <>
            <textarea
              rows={3}
              autoFocus
              maxLength={500}
              aria-label={cfg.title}
              placeholder={cfg.note.placeholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted p-3 text-body-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {error && <p role="alert" className="text-danger text-caption">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-9 text-caption">Huỷ</Button>
              <Button type="button" size="sm" disabled={!note.trim() || busy} onClick={() => void submitNote()} className="h-9 text-caption">
                {busy ? "Đang lưu..." : cfg.note.confirm}
              </Button>
            </div>
          </>
        ) : (
          <CoordinatorImageUpload
            orderId={modal.orderId}
            endpoint={cfg.photo.endpoint}
            label={cfg.photo.label}
            onSuccess={onDone}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  )
}
