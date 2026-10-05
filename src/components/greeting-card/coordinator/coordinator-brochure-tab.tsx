"use client"

import React, { useState, useEffect, useCallback } from "react"
import { RefreshCw, Camera, Sparkles, UserCheck, Truck, Image as ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CoordinatorImageUpload } from "./coordinator-image-upload"
import { CoordinatorOrderCard, type BrochureOrder, type ModalState } from "./coordinator-order-card"
import { readApiError } from "@/components/greeting-card/api-error"

export function CoordinatorBrochureTab() {
  const [orders, setOrders] = useState<BrochureOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>({ type: "none" })
  const [floristNote, setFloristNote] = useState("")
  const [shipNote, setShipNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")

  const loadOrders = useCallback(() => {
    setLoading(true)
    fetch("/api/v1/greeting-card/orders")
      .then((r) => r.json())
      .then((res) => { if (res.data) setOrders(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  function openModal(m: ModalState) {
    setModal(m)
    setFloristNote("")
    setShipNote("")
    setActionError("")
  }

  async function postAction(orderId: string, path: string, body: object) {
    setActionLoading(true)
    setActionError("")
    try {
      const res = await fetch(`/api/v1/greeting-card/orders/${orderId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        throw new Error(await readApiError(res, "Lỗi thực hiện tác vụ"))
      }
      setModal({ type: "none" })
      loadOrders()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Lỗi không xác định")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-title font-extrabold text-foreground flex items-center gap-2">
            <span>Tiếp Nhận Đơn Từ Thẻ Chào</span>
            <span className="text-caption px-2.5 py-0.5 rounded-full bg-info-bg text-info font-bold">
              Điều Phối Xưởng
            </span>
          </h2>
          <p className="text-body-sm text-text-muted mt-1">
            Mỗi tác vụ cập nhật trạng thái đơn — khách tự động nhận thông báo qua link theo dõi
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={loadOrders} className="gap-1.5 text-caption h-9">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center text-text-muted flex flex-col items-center">
          <Sparkles size={36} className="text-primary/40 mb-2" />
          <p className="text-body font-bold text-foreground">Chưa có đơn hàng nào từ Thẻ chào</p>
          <p className="text-caption text-text-muted mt-1">
            Khi khách hoàn tất đặt hoa qua link brochure, đơn sẽ hiển thị ngay tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <CoordinatorOrderCard key={order.id} order={order} onOpen={openModal} />
          ))}
        </div>
      )}

      {/* Modal overlay */}
      {modal.type !== "none" && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setModal({ type: "none" })}
        >
          <div
            className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal: Giao Florist */}
            {modal.type === "florist" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-body font-extrabold text-foreground flex items-center gap-2">
                    <UserCheck size={18} className="text-primary" />
                    Giao Florist — #{modal.orderCode}
                  </h3>
                  <button type="button" onClick={() => setModal({ type: "none" })} className="text-text-muted hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-body-sm text-text-muted">
                  Ghi chú phân công florist (tên thợ, yêu cầu đặc biệt). Trạng thái sẽ chuyển sang <strong>Đang cắm hoa</strong>.
                </p>
                <textarea
                  rows={3}
                  placeholder="Vd: Giao cho Thợ Mai — ưu tiên hoa hồng đỏ tươi"
                  value={floristNote}
                  onChange={(e) => setFloristNote(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-muted p-3 text-body-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {actionError && <p className="text-danger text-caption">{actionError}</p>}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModal({ type: "none" })} className="h-9 text-caption">Huỷ</Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!floristNote.trim() || actionLoading}
                    onClick={() => postAction(modal.orderId, "assign-florist", { floristNote: floristNote.trim() })}
                    className="h-9 text-caption"
                  >
                    {actionLoading ? "Đang lưu..." : "Xác nhận Giao Florist"}
                  </Button>
                </div>
              </>
            )}

            {/* Modal: Chụp thành phẩm */}
            {modal.type === "product-photo" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-body font-extrabold text-foreground flex items-center gap-2">
                    <Camera size={18} className="text-primary" />
                    Ảnh Thành Phẩm — #{modal.orderCode}
                  </h3>
                  <button type="button" onClick={() => setModal({ type: "none" })} className="text-text-muted hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>
                <CoordinatorImageUpload
                  orderId={modal.orderId}
                  endpoint="product-photo"
                  label="Ảnh hoa thành phẩm"
                  onSuccess={() => { setModal({ type: "none" }); loadOrders() }}
                  onCancel={() => setModal({ type: "none" })}
                />
              </>
            )}

            {/* Modal: Giao Ship */}
            {modal.type === "dispatch" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-body font-extrabold text-foreground flex items-center gap-2">
                    <Truck size={18} className="text-primary" />
                    Giao Ship — #{modal.orderCode}
                  </h3>
                  <button type="button" onClick={() => setModal({ type: "none" })} className="text-text-muted hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-body-sm text-text-muted">
                  Nhập thông tin shipper / mã vận đơn. Trạng thái sẽ chuyển sang <strong>Đang giao hoa</strong>.
                </p>
                <textarea
                  rows={3}
                  placeholder="Vd: Anh Hùng GHN · 0912345678 · Mã VĐ: GHNXXX"
                  value={shipNote}
                  onChange={(e) => setShipNote(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-muted p-3 text-body-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {actionError && <p className="text-danger text-caption">{actionError}</p>}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModal({ type: "none" })} className="h-9 text-caption">Huỷ</Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!shipNote.trim() || actionLoading}
                    onClick={() => postAction(modal.orderId, "dispatch-shipping", { trackingNote: shipNote.trim() })}
                    className="h-9 text-caption"
                  >
                    {actionLoading ? "Đang lưu..." : "Xác nhận Giao Ship"}
                  </Button>
                </div>
              </>
            )}

            {/* Modal: Ảnh người nhận */}
            {modal.type === "recipient-photo" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-body font-extrabold text-foreground flex items-center gap-2">
                    <ImageIcon size={18} className="text-primary" />
                    Ảnh Người Nhận — #{modal.orderCode}
                  </h3>
                  <button type="button" onClick={() => setModal({ type: "none" })} className="text-text-muted hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-body-sm text-text-muted">
                  Upload ảnh chụp trao hoa. Đơn sẽ chuyển sang <strong>Giao thành công · Hoàn tất</strong>.
                </p>
                <CoordinatorImageUpload
                  orderId={modal.orderId}
                  endpoint="recipient-photo"
                  label="Ảnh giao hoa thành công"
                  onSuccess={() => { setModal({ type: "none" }); loadOrders() }}
                  onCancel={() => setModal({ type: "none" })}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
