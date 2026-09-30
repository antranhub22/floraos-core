"use client"

import React, { useState } from "react"
import { Clock, Loader2, Layers, FileText, Truck, Flower2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog } from "@/components/ui/dialog"
import { FloristTicketCard } from "@/components/templates/orders/florist-ticket-card"
import { DeliveryReceiptCard } from "@/components/templates/orders/delivery-receipt-card"
import { OrderCancelDialog } from "./order-cancel-dialog"
import { OrderActionButtons } from "./order-action-buttons"
import type { OrderItemRecord, OrderRecord, OrderSlaCalculation } from "@/modules/orders/domain/order-types"

/**
 * Đơn hàng như modal này đọc. Ba trục trạng thái để `string` CÓ CHỦ ĐÍCH: các nút
 * hành động bên dưới so với những giá trị KHÔNG có trong domain/API
 * (`IN_PRODUCTION`, `COMPLETED` cho sản xuất, `NOT_STARTED`, `SHIPPING`) — nợ #150,
 * chờ chủ sản phẩm chốt luồng trạng thái đúng (trùng phạm vi Chức năng 12).
 */
type OrderDetailView = Omit<OrderRecord, "status" | "productionStatus" | "deliveryStatus"> & {
  status: string
  productionStatus: string
  deliveryStatus: string
}

interface OrderDetailBody {
  order: OrderDetailView
  sla: OrderSlaCalculation
}

interface OrderItemFlower {
  flowerName?: string
  quantity?: number | string
  unit?: string
  color?: string
}

interface OrderDetailModalProps {
  orderId: string | null
  onClose: () => void
  onUpdated: () => void
}

export function OrderDetailModal({ orderId, onClose, onUpdated }: OrderDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OrderDetailBody | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "florist" | "delivery">("overview")
  const [cancelOpen, setCancelOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  React.useEffect(() => {
    if (!orderId) return
    setLoading(true)
    fetch(`/api/v1/orders/${orderId}`)
      .then((r) => r.json())
      .then((res) => { setData(res) })
      .catch(() => { /* im lặng — hiển thị "Không tìm thấy" */ })
      .finally(() => setLoading(false))
  }, [orderId])

  const order = data?.order
  const sla = data?.sla

  async function handleUpdateStatus(patch: {
    status?: string
    productionStatus?: string
    deliveryStatus?: string
  }) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (res.ok) { onUpdated(); onClose() }
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelOrder(reason: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) { onUpdated(); onClose() }
    } finally {
      setActionLoading(false)
    }
  }

  function handlePrint() {
    window.open(`/api/v1/orders/${orderId}/print`, "_blank")
  }

  // Chuẩn bị dữ liệu cho Florist Ticket Projection (Giấu giá, hiển thị BOM + Ảnh).
  const items: OrderItemRecord[] = order?.items ?? []
  const sampleImg = (items.find((it) => typeof it?.metadata?.sampleImageUrl === "string")?.metadata?.sampleImageUrl as string | undefined) ?? undefined

  const floristItems = items.flatMap((it) => {
    const flowers = Array.isArray(it?.metadata?.flowers) ? it.metadata.flowers : null
    if (flowers?.length) {
      return flowers.map((f: OrderItemFlower) => ({
        flowerName: f.flowerName ?? "Hoa (chưa rõ tên)",
        quantity: Number(f.quantity ?? 1),
        unit: f.unit ?? "chưa rõ đơn vị",
        color: f.color ?? "Chưa rõ màu",
      }))
    }
    return [{ flowerName: it?.description ?? "Mẫu hoa", quantity: it?.quantity ?? 1, unit: "xem ghi chú", color: "Chưa có BOM chi tiết — xem ghi chú thợ" }]
  })

  const wrapStyleText = (() => {
    const parts = items.map((it) => [it?.metadata?.wrapStyle, it?.metadata?.ribbon].filter(Boolean).join(" + ")).filter(Boolean)
    return parts.length > 0 ? Array.from(new Set(parts)).join(" | ") : "Chưa rõ kiểu gói — xem ghi chú thợ"
  })()

  const productNameText = items.map((it) => it?.description).filter(Boolean).join(", ") || "Bó hoa đặt cắm"

  const tabNav = (
    <div className="flex gap-2 px-5 pt-2 sm:px-6 text-caption font-semibold bg-surface-raised/30">
      {([
        { key: "overview", label: "Tổng quan & Điều hành", icon: <Layers className="h-3.5 w-3.5" /> },
        { key: "florist", label: "Thợ cắm hoa (Ẩn giá)", icon: <Flower2 className="h-3.5 w-3.5" /> },
        { key: "delivery", label: "Giao vận & Thiệp A6", icon: <Truck className="h-3.5 w-3.5" /> },
      ] as const).map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => setActiveTab(key)}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === key
              ? "border-primary text-primary font-bold"
              : "border-transparent text-text-muted hover:text-text"
          }`}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  )

  const dialogTitle = (
    <div className="flex items-center gap-3">
      <span className="rounded bg-primary/10 px-2.5 py-1 text-caption font-mono font-bold text-primary min-w-16 text-center">
        {order?.code ?? <Skeleton className="h-3 w-14" />}
      </span>
      <span>Chi tiết đơn &amp; Tiến độ SLA</span>
    </div>
  )

  const dialogFooter = order ? (
    <OrderActionButtons
      orderCode={order.code}
      orderStatus={order.status}
      productionStatus={order.productionStatus}
      deliveryStatus={order.deliveryStatus}
      actionLoading={actionLoading}
      onPrint={handlePrint}
      onCancelRequest={() => setCancelOpen(true)}
      onUpdateStatus={handleUpdateStatus}
    />
  ) : null

  return (
    <>
      <Dialog
        open={!!orderId}
        onOpenChange={(open) => { if (!open) onClose() }}
        title={dialogTitle}
        subHeader={tabNav}
        size="lg"
        footer={dialogFooter ?? undefined}
      >
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : order ? (
          <div className="space-y-6">
            {activeTab === "overview" && (
              <>
                <div className="flex items-center justify-between rounded-lg border border-border bg-surface-raised p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-text-muted" />
                    <div>
                      <div className="text-caption text-text-muted">Tổng thời gian xử lý</div>
                      <div className="font-bold text-text">{sla?.totalDurationMinutes ?? 0} phút / Mục tiêu {sla?.slaTargetMinutes ?? 180} phút</div>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-caption font-bold ${sla?.isSlaMet ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
                    {sla?.isSlaMet ? "✓ ĐẠT CHUẨN SLA" : "⚠️ CẢNH BÁO QUÁ HẠN"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <div className="font-bold text-text">Thông tin nhận hoa</div>
                    <div className="text-text-muted text-caption">Người nhận: <span className="font-semibold text-text">{order.deliveryAddress?.recipientName ?? "Khách lẻ"}</span></div>
                    <div className="text-text-muted text-caption">Điện thoại: <span className="font-semibold text-text">{order.deliveryAddress?.phone ?? "—"}</span></div>
                    <div className="text-text-muted text-caption">Địa chỉ: <span className="font-semibold text-text">{order.deliveryAddress?.street ?? "—"}</span></div>
                  </div>
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <div className="font-bold text-text">Thời gian &amp; Trạng thái</div>
                    <div className="text-text-muted text-caption">Hẹn giao: <span className="font-semibold text-text">{order.deliveryWindow?.date} ({order.deliveryWindow?.timeSlot})</span></div>
                    <div className="text-text-muted text-caption">Sản xuất: <span className="font-semibold text-info">{order.productionStatus}</span></div>
                    <div className="text-text-muted text-caption">Vận chuyển: <span className="font-semibold text-warning">{order.deliveryStatus}</span></div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 font-bold text-text">Mẫu hoa đặt cắm</div>
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {order.items?.map((it) => (
                      <div key={it.id} className="flex items-center justify-between p-3 text-caption">
                        <div>
                          <div className="font-semibold text-text">{it.description}</div>
                          <div className="text-text-muted">SL: {it.quantity}</div>
                        </div>
                        <div className="font-bold text-text">{(it.quantity * it.unitPriceVnd).toLocaleString("vi-VN")} đ</div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between bg-surface-raised p-3 font-bold text-body-sm">
                      <span>Tổng tiền:</span>
                      <span className="text-primary">{order.totalVnd.toLocaleString("vi-VN")} đ</span>
                    </div>
                  </div>
                </div>

                {order.cardMessage && (
                  <div className="rounded-lg border border-warning/30 bg-warning-bg/70 p-3 text-caption text-warning">
                    <span className="font-bold">💌 Lời nhắn thiệp: </span>{order.cardMessage}
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center gap-1.5 font-bold text-text">
                    <FileText className="h-4 w-4" /> Chuỗi sự kiện SLA
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto rounded-lg border border-border p-3 text-caption">
                    {order.events?.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between border-b border-border/50 pb-1.5 last:border-none">
                        <span className="font-mono text-text-muted">{new Date(ev.createdAt).toLocaleTimeString("vi-VN")} — [{ev.axis.toUpperCase()}]</span>
                        <span className="font-semibold text-text">{ev.toValue}</span>
                        <span className="text-text-muted italic">{ev.reason ?? ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "florist" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-info-bg/70 border border-info/30 p-3 text-caption text-info">
                  ℹ️ <strong>Nguyên tắc bảo mật:</strong> Lát cắt dữ liệu cho xưởng cắm hoa chỉ hiển thị BOM, ảnh mẫu và thời hạn. Toàn bộ giá vốn, giá bán đã được lọc bỏ.
                </div>
                <FloristTicketCard
                  orderCode={order.code}
                  productName={productNameText}
                  sampleImageUrl={sampleImg}
                  deadlineTime={`${order.deliveryWindow?.date} (${order.deliveryWindow?.timeSlot})`}
                  floristName="Thợ cắm hoa xưởng"
                  items={floristItems}
                  wrapStyle={wrapStyleText}
                  notes={order.internalNote ?? undefined}
                  onPrint={handlePrint}
                  onComplete={() => handleUpdateStatus({ productionStatus: "COMPLETED" })}
                />
              </div>
            )}

            {activeTab === "delivery" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-warning-bg/70 border border-warning/30 p-3 text-caption text-warning">
                  ℹ️ <strong>Phiếu giao vận A6:</strong> Chuẩn hóa thông tin người nhận, lời nhắn thiệp và số tiền COD.
                </div>
                <DeliveryReceiptCard
                  orderCode={order.code}
                  recipientName={order.deliveryAddress?.recipientName ?? "Khách nhận"}
                  recipientPhone={order.deliveryAddress?.phone ?? "—"}
                  deliveryAddress={order.deliveryAddress?.street ?? "—"}
                  deliveryTime={`${order.deliveryWindow?.date} (${order.deliveryWindow?.timeSlot})`}
                  cardMessage={order.cardMessage || "Chúc mừng ngày đặc biệt!"}
                  shippingFee="0 đ"
                  totalAmount={`${order.totalVnd.toLocaleString("vi-VN")} đ`}
                  onPrint={handlePrint}
                  onDelivered={() => handleUpdateStatus({ deliveryStatus: "DELIVERED", status: "COMPLETED" })}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-text-muted">Không tìm thấy thông tin đơn hàng.</div>
        )}
      </Dialog>

      <OrderCancelDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        orderCode={order?.code}
        onConfirm={handleCancelOrder}
        loading={actionLoading}
      />
    </>
  )
}
