"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, RefreshCw, Eye, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OrderGuidanceCard } from "@/components/templates/orders/order-guidance-card"
import { CreateOrderModal } from "@/components/orders/create-order-modal"
import { OrderDetailModal } from "@/components/orders/order-detail-modal"
import { ChatOrderCheckoutModal } from "@/components/chat/chat-order-checkout-modal"
import { EmptyState } from "@/components/ui/empty-state"

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

type MobileFilter = "all" | "new" | "arranging" | "delivery" | "completed"

export default function DonHangPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [mobileTab, setMobileTab] = useState<MobileFilter>("all")

  function loadOrders() {
    setLoading(true)
    fetch("/api/v1/orders")
      .then((r) => r.json())
      .then((res) => {
        if (res.orders) setOrders(res.orders)
      })
      .catch(() => {
        // Im lặng fallback về danh sách rỗng khi lỗi mạng
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
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

  const mobileOrders =
    mobileTab === "new"
      ? colNew
      : mobileTab === "arranging"
      ? colArranging
      : mobileTab === "delivery"
      ? colDelivery
      : mobileTab === "completed"
      ? colCompleted
      : filteredOrders

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* 1. Header chuẩn FloraOS */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 py-4">
        <div>
          <div className="text-caption font-bold uppercase tracking-wider text-text-muted">
            Điều phối sản xuất & giao hàng
          </div>
          <h1 className="text-title font-extrabold text-foreground">Đơn Hàng & Vận Hành Xưởng Hoa</h1>
        </div>

        {/* Top-Right Action Header: 1 primary + 2 secondary/ghost */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 font-semibold">
            <Plus size={16} /> Tạo đơn mới
          </Button>
          <Button variant="outline" size="sm" onClick={() => setChatModalOpen(true)} className="flex items-center gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/5">
            <MessageSquarePlus size={14} /> Tạo từ chat
          </Button>
          <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading} className="hidden sm:inline-flex items-center gap-1.5">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="hidden sm:inline-flex items-center gap-1.5">
            <ArrowLeft size={14} /> Trang chủ
          </Button>
        </div>
      </header>

      {/* 2. Nội dung chính cuộn dọc */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <OrderGuidanceCard />

        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Tìm theo mã đơn, người nhận, SĐT..."
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-caption text-text-muted">
            Tổng cộng: <span className="font-bold text-foreground">{filteredOrders.length}</span> đơn hàng
          </div>
        </div>

        {/* Bộ lọc trạng thái trên Mobile (< lg) */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-1 text-caption">
          {[
            { id: "all" as const, label: "Tất cả", count: filteredOrders.length },
            { id: "new" as const, label: "Mới", count: colNew.length },
            { id: "arranging" as const, label: "Đang cắm", count: colArranging.length },
            { id: "delivery" as const, label: "Vận chuyển", count: colDelivery.length },
            { id: "completed" as const, label: "Hoàn tất", count: colCompleted.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className={`flex min-h-11 items-center gap-1.5 rounded-full px-3.5 py-1 font-semibold whitespace-nowrap transition-colors ${
                mobileTab === tab.id
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-text-muted hover:bg-surface-alt"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-caption rounded-full px-1.5 py-0.2 ${
                mobileTab === tab.id ? "bg-white/20 text-white" : "bg-surface-alt text-text"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Chế độ danh sách đơn trên Mobile (< lg) */}
        <div className="flex flex-col gap-3 lg:hidden">
          {mobileOrders.length === 0 ? (
            <EmptyState
              title="Không có đơn hàng nào"
              reason="Chưa có đơn hàng nào ở trạng thái này hoặc không khớp với từ khoá tìm kiếm."
              action={{
                label: "Tạo đơn mới",
                onClick: () => setCreateOpen(true),
              }}
            />
          ) : (
            mobileOrders.map((ord) => (
              <OrderCard key={ord.id} order={ord} onSelect={() => setSelectedOrderId(ord.id)} />
            ))
          )}
        </div>

        {/* Chế độ Kanban Board 4 cột trên Desktop (lg+) */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-4">
          {/* Cột 1: Mới / Chờ duyệt */}
          <div className="flex flex-col rounded-xl border border-border bg-surface-alt/40 p-3">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-info" aria-hidden="true" />
                <span className="font-bold text-caption uppercase text-text">1. Mới tiếp nhận</span>
              </div>
              <Badge tone="neutral" className="text-caption font-bold">{colNew.length}</Badge>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colNew.map((ord) => (
                <OrderCard key={ord.id} order={ord} onSelect={() => setSelectedOrderId(ord.id)} />
              ))}
            </div>
          </div>

          {/* Cột 2: Đang cắm hoa */}
          <div className="flex flex-col rounded-xl border border-border bg-surface-alt/40 p-3">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                <span className="font-bold text-caption uppercase text-text">2. Đang cắm hoa</span>
              </div>
              <Badge tone="neutral" className="text-caption font-bold">{colArranging.length}</Badge>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colArranging.map((ord) => (
                <OrderCard key={ord.id} order={ord} onSelect={() => setSelectedOrderId(ord.id)} />
              ))}
            </div>
          </div>

          {/* Cột 3: Đang giao hàng */}
          <div className="flex flex-col rounded-xl border border-border bg-surface-alt/40 p-3">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-warning" aria-hidden="true" />
                <span className="font-bold text-caption uppercase text-text">3. Vận chuyển</span>
              </div>
              <Badge tone="neutral" className="text-caption font-bold">{colDelivery.length}</Badge>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colDelivery.map((ord) => (
                <OrderCard key={ord.id} order={ord} onSelect={() => setSelectedOrderId(ord.id)} />
              ))}
            </div>
          </div>

          {/* Cột 4: Hoàn tất */}
          <div className="flex flex-col rounded-xl border border-border bg-surface-alt/40 p-3">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
                <span className="font-bold text-caption uppercase text-text">4. Hoàn tất / Đã giao</span>
              </div>
              <Badge tone="neutral" className="text-caption font-bold">{colCompleted.length}</Badge>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colCompleted.map((ord) => (
                <OrderCard key={ord.id} order={ord} onSelect={() => setSelectedOrderId(ord.id)} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <CreateOrderModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={loadOrders}
      />

      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onUpdated={loadOrders}
      />

      <ChatOrderCheckoutModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        initialDraft={{
          recipientName: null,
          recipientPhone: null,
          deliveryAddress: null,
          deliveryTime: null,
          occasion: null,
          cardMessage: null,
          flowerStyleOrTone: null,
          budgetVnd: null,
        }}
        onOrderCreated={() => {
          loadOrders()
        }}
      />
    </div>
  )
}

function OrderCard({ order, onSelect }: { order: OrderItem; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left cursor-pointer rounded-xl border border-border bg-surface p-3 transition-all hover:border-primary hover:shadow-sm space-y-2 text-body-sm focus-visible:outline-2 focus-visible:outline-primary min-h-11"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-primary">{order.code}</span>
        <span className="text-caption text-text-muted">
          {new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div>
        <div className="font-bold text-text">
          {order.deliveryAddress?.recipientName ?? "Khách lẻ"}
        </div>
        <div className="text-text-muted truncate text-caption">
          {order.deliveryAddress?.street ?? "Nhận tại tiệm"}
        </div>
      </div>

      {order.items && order.items[0] && (
        <div className="text-caption text-text-muted bg-surface-alt px-2 py-1 rounded-lg">
          🌸 {order.items[0].description} {order.items.length > 1 ? `(+${order.items.length - 1} món)` : ""}
        </div>
      )}

      {order.cardMessage && (
        <div className="truncate text-caption italic text-warning">
          💌 {order.cardMessage}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-2">
        <span className="font-bold text-primary">
          {order.totalVnd.toLocaleString("vi-VN")} đ
        </span>
        <span className="text-caption text-primary flex items-center gap-1 font-semibold">
          <Eye size={13} aria-hidden="true" /> Chi tiết
        </span>
      </div>
    </button>
  )
}
