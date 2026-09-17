"use client"

import React, { useState } from "react"
import { X, Clock, Printer, Ban, CheckCircle, Truck, Flower2, AlertCircle, Loader2, Layers, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloristTicketCard } from "@/components/templates/orders/florist-ticket-card"
import { DeliveryReceiptCard } from "@/components/templates/orders/delivery-receipt-card"

interface OrderDetailModalProps {
  orderId: string | null
  onClose: () => void
  onUpdated: () => void
}

export function OrderDetailModal({ orderId, onClose, onUpdated }: OrderDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "florist" | "delivery">("overview")
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  React.useEffect(() => {
    if (!orderId) return
    setLoading(true)
    fetch(`/api/v1/orders/${orderId}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [orderId])

  if (!orderId) return null

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
      if (res.ok) {
        onUpdated()
        onClose()
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelOrder() {
    if (!cancelReason.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      })
      if (res.ok) {
        onUpdated()
        onClose()
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePrint() {
    window.open(`/api/v1/orders/${orderId}/print`, "_blank")
  }

  // Chuẩn bị dữ liệu cho Florist Ticket Projection (Giấu giá, hiển thị BOM + Ảnh).
  //
  // Ưu tiên BOM có cấu trúc thật (`item.metadata.flowers`, kiểu FlowerBomItem[]) — chỉ có
  // ở các đơn được chọn mẫu từ Master Index. Gộp từ TẤT CẢ các mục trong đơn (không chỉ
  // mục đầu tiên), vì một đơn có thể có nhiều mẫu hoa/phụ kiện.
  //
  // Với mục KHÔNG có BOM cấu trúc (đơn nhập tay, không qua Master Index — hoặc đơn cũ tạo
  // trước khi có tính năng này), KHÔNG bịa lại đơn vị/màu như "bình/bó"/"Theo thiết kế" —
  // hiện đúng những gì đã biết (tên/số lượng từ dòng đơn hàng) và ghi rõ chưa có BOM chi
  // tiết, để thợ tự đọc phần ghi chú thay vì tin vào dữ liệu giả.
  const items: any[] = order?.items ?? []
  const firstItemWithImage = items.find((it) => it?.metadata?.sampleImageUrl)
  const sampleImg = firstItemWithImage?.metadata?.sampleImageUrl ?? undefined

  const floristItems = items.flatMap((it) => {
    const structuredFlowers = Array.isArray(it?.metadata?.flowers) ? it.metadata.flowers : null
    if (structuredFlowers && structuredFlowers.length > 0) {
      return structuredFlowers.map((f: any) => ({
        flowerName: f.flowerName ?? "Hoa (chưa rõ tên)",
        quantity: Number(f.quantity ?? 1),
        unit: f.unit ?? "chưa rõ đơn vị",
        color: f.color ?? "Chưa rõ màu",
      }))
    }
    return [
      {
        flowerName: it?.description ?? "Mẫu hoa (chưa rõ tên)",
        quantity: it?.quantity ?? 1,
        unit: "xem ghi chú",
        color: "Chưa có BOM chi tiết — xem ghi chú thợ",
      },
    ]
  })

  const wrapStyleParts = items
    .map((it) => [it?.metadata?.wrapStyle, it?.metadata?.ribbon].filter(Boolean).join(" + "))
    .filter(Boolean)
  const wrapStyleText =
    wrapStyleParts.length > 0
      ? Array.from(new Set(wrapStyleParts)).join(" | ")
      : "Chưa rõ kiểu gói — xem ghi chú thợ"

  const productNameText =
    items.map((it) => it?.description).filter(Boolean).join(", ") || "Bó hoa đặt cắm"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="rounded bg-primary/10 px-2.5 py-1 text-xs font-mono font-bold text-primary">
              {order?.code ?? "Đang tải..."}
            </span>
            <span className="text-sm font-bold text-foreground">Chi tiết đơn & Tiến độ SLA (M10)</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs (Field Projections) */}
        <div className="flex border-b border-border bg-muted/30 px-6 gap-2 pt-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-red-600 text-red-600 font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Tổng quan & Điều hành
          </button>
          <button
            onClick={() => setActiveTab("florist")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "florist"
                ? "border-red-600 text-red-600 font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flower2 className="h-3.5 w-3.5" />
            Lát cắt Thợ Cắm Hoa (Ẩn Giá)
          </button>
          <button
            onClick={() => setActiveTab("delivery")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "delivery"
                ? "border-red-600 text-red-600 font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            Lát cắt Giao Hàng & Thiệp (A6)
          </button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : order ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            {activeTab === "overview" && (
              <>
                {/* SLA Bar */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-surface-raised p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-text-muted" />
                    <div>
                      <div className="text-xs text-text-muted">Tổng thời gian xử lý</div>
                      <div className="font-bold text-text-main">
                        {sla?.totalDurationMinutes ?? 0} phút / Mục tiêu {sla?.slaTargetMinutes ?? 180} phút
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      sla?.isSlaMet ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {sla?.isSlaMet ? "✓ ĐẠT CHUẨN SLA" : "⚠️ CẢNH BÁO QUÁ HẠN"}
                  </span>
                </div>

                {/* Khách hàng & Giao nhận */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <div className="font-bold text-text-main">Thông tin nhận hoa</div>
                    <div className="text-text-muted text-xs">
                      Người nhận: <span className="font-semibold text-foreground">{order.deliveryAddress?.recipientName ?? "Khách lẻ"}</span>
                    </div>
                    <div className="text-text-muted text-xs">
                      Số điện thoại: <span className="font-semibold text-foreground">{order.deliveryAddress?.phone ?? "—"}</span>
                    </div>
                    <div className="text-text-muted text-xs">
                      Địa chỉ: <span className="font-semibold text-foreground">{order.deliveryAddress?.street ?? "—"}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <div className="font-bold text-text-main">Thời gian & Trạng thái</div>
                    <div className="text-text-muted text-xs">
                      Hẹn giao: <span className="font-semibold text-foreground">{order.deliveryWindow?.date} ({order.deliveryWindow?.timeSlot})</span>
                    </div>
                    <div className="text-text-muted text-xs">
                      Sản xuất: <span className="font-semibold text-blue-600">{order.productionStatus}</span>
                    </div>
                    <div className="text-text-muted text-xs">
                      Vận chuyển: <span className="font-semibold text-amber-600">{order.deliveryStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Chi tiết hoa */}
                <div>
                  <div className="mb-2 font-bold text-text-main">Mẫu hoa đặt cắm</div>
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {order.items?.map((it: any) => (
                      <div key={it.id} className="flex items-center justify-between p-3 text-xs">
                        <div>
                          <div className="font-semibold text-foreground">{it.description}</div>
                          <div className="text-text-muted">SL: {it.quantity}</div>
                        </div>
                        <div className="font-bold text-foreground">
                          {(it.quantity * it.unitPriceVnd).toLocaleString("vi-VN")} đ
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between bg-surface-raised p-3 text-sm font-bold">
                      <span>Tổng tiền:</span>
                      <span className="text-red-600">{order.totalVnd.toLocaleString("vi-VN")} đ</span>
                    </div>
                  </div>
                </div>

                {/* Lời nhắn thiệp */}
                {order.cardMessage && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                    <span className="font-bold">💌 Lời nhắn thiệp: </span>
                    {order.cardMessage}
                  </div>
                )}

                {/* Timeline sự kiện đo SLA */}
                <div>
                  <div className="mb-2 font-bold text-text-main">Chuỗi sự kiện đo SLA (Event Sourcing)</div>
                  <div className="space-y-2 max-h-36 overflow-y-auto rounded-lg border border-border p-3 text-xs">
                    {order.events?.map((ev: any) => (
                      <div key={ev.id} className="flex items-center justify-between border-b border-border/50 pb-1.5 last:border-none">
                        <span className="font-mono text-text-muted">
                          {new Date(ev.createdAt).toLocaleTimeString("vi-VN")} — [{ev.axis.toUpperCase()}]
                        </span>
                        <span className="font-semibold text-foreground">{ev.toValue}</span>
                        <span className="text-text-muted italic">{ev.reason ?? ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: PROJECTION CHO THỢ CẮM HOA (ẨN GIÁ TIỀN HOÀN TOÀN) */}
            {activeTab === "florist" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-3 text-xs text-blue-900">
                  ℹ️ <strong>Nguyên tắc bảo mật:</strong> Lát cắt dữ liệu cho xưởng cắm hoa chỉ hiển thị công thức hoa (BOM), ảnh mẫu và thời hạn giao hoa. Toàn bộ giá vốn, giá bán và thông tin tài chính đã được lọc bỏ.
                </div>
                <FloristTicketCard
                  orderCode={order.code}
                  productName={productNameText}
                  sampleImageUrl={sampleImg}
                  deadlineTime={`${order.deliveryWindow?.date} (${order.deliveryWindow?.timeSlot})`}
                  floristName={order.assignments?.[0]?.floristId ?? "Thợ cắm hoa xưởng"}
                  items={floristItems}
                  wrapStyle={wrapStyleText}
                  notes={order.internalNote}
                  onPrint={handlePrint}
                  onComplete={() => handleUpdateStatus({ productionStatus: "COMPLETED" })}
                />
              </div>
            )}

            {/* TAB 3: PROJECTION CHO GIAO VẬN (A6 DELIVERY RECEIPT) */}
            {activeTab === "delivery" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-3 text-xs text-amber-900">
                  ℹ️ <strong>Phiếu giao vận A6:</strong> Chuẩn hóa thông tin người nhận, lời nhắn thiệp mừng chúc mừng và số tiền cần thu hộ COD.
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

            {/* Nút hành động 1-chạm chung */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-1.5 h-4 w-4" /> In phiếu A6
                </Button>
                {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 border-red-200"
                    onClick={() => setCancelModal(true)}
                  >
                    <Ban className="mr-1.5 h-4 w-4" /> Hủy đơn
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {order.productionStatus === "PENDING" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus({ productionStatus: "IN_PRODUCTION", status: "CONFIRMED" })}
                  >
                    <Flower2 className="mr-1.5 h-4 w-4" /> Nhận cắm hoa
                  </Button>
                )}
                {order.productionStatus === "IN_PRODUCTION" && (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus({ productionStatus: "COMPLETED" })}
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" /> Đã cắm xong
                  </Button>
                )}
                {order.productionStatus === "COMPLETED" && order.deliveryStatus === "NOT_STARTED" && (
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus({ deliveryStatus: "SHIPPING", status: "IN_PROGRESS" })}
                  >
                    <Truck className="mr-1.5 h-4 w-4" /> Bắt đầu giao
                  </Button>
                )}
                {order.deliveryStatus === "SHIPPING" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus({ deliveryStatus: "DELIVERED", status: "COMPLETED" })}
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" /> Giao thành công
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-text-muted">Không tìm thấy thông tin đơn hàng.</div>
        )}

        {/* Modal nhập lý do hủy đơn */}
        {cancelModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <AlertCircle className="h-5 w-5" />
                <span>Xác nhận hủy đơn hàng #{order?.code}</span>
              </div>
              <p className="text-xs text-text-muted">
                Hành động này sẽ hủy đơn hàng vĩnh viễn và ghi log vào sự kiện SLA.
              </p>
              <textarea
                rows={3}
                className="w-full rounded-md border border-border bg-background p-2.5 text-xs focus:ring-1 focus:ring-red-500"
                placeholder="Nhập lý do hủy đơn (bắt buộc)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setCancelModal(false)}>
                  Đóng
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={!cancelReason.trim() || actionLoading}
                  onClick={handleCancelOrder}
                >
                  Xác nhận hủy
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
