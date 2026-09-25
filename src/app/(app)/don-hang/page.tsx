"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, RefreshCw, Clock, Flower2, Truck, CheckCircle2, AlertTriangle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OrderGuidanceCard } from "@/components/templates/orders/order-guidance-card"
import { CreateOrderModal } from "@/components/orders/create-order-modal"
import { OrderDetailModal } from "@/components/orders/order-detail-modal"

type OrderItem = {
  id: string
  code: string
  status: string
  productionStatus: string
  deliveryStatus: string
  totalVnd: number
  cardMessage?: string
  deliveryAddress?: { recipientName?: string; phone?: string; street?: string }
  deliveryWindow?: { date: string; timeSlot?: string }
  items?: Array<{ description: string; quantity: number }>
  createdAt: string
}

export default function DonHangPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  function loadOrders() {
    setLoading(true)
    fetch("/api/v1/orders")
      .then((r) => r.json())
      .then((res) => {
        if (res.orders) setOrders(res.orders)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu từ API khi mount/đổi tham số; setState nằm trong hàm tải (nợ #149)
    loadOrders()
  }, [])

  const filteredOrders = orders.filter((o) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      o.code.toLowerCase().includes(q) ||
      o.deliveryAddress?.recipientName?.toLowerCase().includes(q) ||
      o.deliveryAddress?.phone?.includes(q) ||
      o.items?.some((it) => it.description.toLowerCase().includes(q))
    )
  })

  // Phân nhóm 4 cột Kanban
  const colNew = filteredOrders.filter((o) => o.status === "DRAFT" || o.status === "CONFIRMED")
  const colArranging = filteredOrders.filter(
    (o) => o.status === "PROCESSING" && (o.productionStatus === "WAITING" || o.productionStatus === "ASSIGNED" || o.productionStatus === "ARRANGING")
  )
  const colDelivery = filteredOrders.filter(
    (o) => (o.productionStatus === "READY" || o.deliveryStatus === "DISPATCHED" || o.deliveryStatus === "DELIVERING") && o.status !== "COMPLETED" && o.status !== "CANCELLED"
  )
  const colCompleted = filteredOrders.filter((o) => o.status === "COMPLETED" || o.status === "CANCELLED" || o.deliveryStatus === "DELIVERED")

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* 1. Header chuẩn FloraOS */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">M10 — Điều phối sản xuất & giao hàng</div>
          <div className="text-lg font-extrabold text-foreground">Đơn Hàng & Vận Hành Xưởng Hoa</div>
        </div>

        {/* Top-Right Action Header */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-semibold" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Tạo đơn mới
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Trang chủ
          </Button>
        </div>
      </div>

      {/* 2. Nội dung chính cuộn dọc */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Khối hướng dẫn thao tác chuẩn OrderGuidanceCard */}
        <OrderGuidanceCard />

        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="flex items-center justify-between">
          <div className="w-80">
            <input
              type="text"
              placeholder="Tìm theo mã đơn, người nhận, SĐT..."
              className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-text-muted">
            Tổng cộng: <span className="font-bold text-foreground">{filteredOrders.length}</span> đơn hàng
          </div>
        </div>

        {/* Kanban Board 4 cột */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Cột 1: Mới / Chờ duyệt */}
          <div className="flex flex-col rounded-xl border border-border bg-surface-raised/40 p-3">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="font-bold text-xs uppercase text-text-main">1. Mới tiếp nhận</span>
              </div>
              <Badge tone="neutral" className="text-[10px]">{colNew.length}</Badge>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colNew.map((ord) => (
                <OrderCard key={ord.id} order={ord} onSelect={() => setSelectedOrderId(ord.id)} />
              ))}
            </div>
          </div>

          {/* Cột 2: Đang cắm hoa */}
          <div className="flex flex-col rounded-xl border border-border bg-surface-raised/40 p-3">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span className="font-bold text-xs uppercase text-text-main">2. Đang cắm hoa</span>
              </div>
              <Badge tone="neutral" className="text-[10px]">{colArranging.length}</Badge>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colArranging.map((ord) => (
                <OrderCard key={ord.id} order={ord} onSelect={() => setSelectedOrderId(ord.id)} />
              ))}
            </div>
          </div>

          {/* Cột 3: Đang giao hàng */}
          <div className="flex flex-col rounded-xl border border-border bg-surface-raised/40 p-3">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="font-bold text-xs uppercase text-text-main">3. Vận chuyển</span>
              </div>
              <Badge tone="neutral" className="text-[10px]">{colDelivery.length}</Badge>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colDelivery.map((ord) => (
                <OrderCard key={ord.id} order={ord} onSelect={() => setSelectedOrderId(ord.id)} />
              ))}
            </div>
          </div>

          {/* Cột 4: Hoàn tất */}
          <div className="flex flex-col rounded-xl border border-border bg-surface-raised/40 p-3">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="font-bold text-xs uppercase text-text-main">4. Hoàn tất / Đã giao</span>
              </div>
              <Badge tone="neutral" className="text-[10px]">{colCompleted.length}</Badge>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colCompleted.map((ord) => (
                <OrderCard key={ord.id} order={ord} onSelect={() => setSelectedOrderId(ord.id)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal tạo đơn hàng */}
      <CreateOrderModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={loadOrders}
      />

      {/* Modal chi tiết đơn hàng & SLA */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onUpdated={loadOrders}
      />
    </div>
  )
}

function OrderCard({ order, onSelect }: { order: OrderItem; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-lg border border-border bg-surface p-3 transition-all hover:border-primary hover:shadow-md space-y-2 text-xs"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-primary">{order.code}</span>
        <span className="text-[10px] text-text-muted">
          {new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div>
        <div className="font-bold text-foreground">
          {order.deliveryAddress?.recipientName ?? "Khách lẻ"}
        </div>
        <div className="text-text-muted truncate text-[11px]">
          {order.deliveryAddress?.street ?? "Nhận tại tiệm"}
        </div>
      </div>

      {order.items && order.items[0] && (
        <div className="text-[11px] text-text-muted bg-surface-raised px-2 py-1 rounded">
          🌸 {order.items[0].description} {order.items.length > 1 ? `(+${order.items.length - 1} món)` : ""}
        </div>
      )}

      {order.cardMessage && (
        <div className="truncate text-[10.5px] italic text-amber-700">
          💌 {order.cardMessage}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border/50 pt-2">
        <span className="font-bold text-red-600">
          {order.totalVnd.toLocaleString("vi-VN")} đ
        </span>
        <span className="text-[10px] text-primary flex items-center gap-1 font-semibold">
          <Eye className="h-3 w-3" /> Chi tiết
        </span>
      </div>
    </div>
  )
}
