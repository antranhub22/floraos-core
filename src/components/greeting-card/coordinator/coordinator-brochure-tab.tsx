"use client"

import React, { useState } from "react"
import { RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CoordinatorActionModal } from "./coordinator-action-modal"
import { CoordinatorOrderCard, type BrochureOrder, type ModalState } from "./coordinator-order-card"
import { CoordinatorKanbanView } from "./coordinator-kanban-view"
import { useApi } from "@/components/greeting-card/greeting-api"
import { parsePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import { useNow, useWorklist } from "@/components/greeting-card/work/use-worklist"
import { WORK_BUCKET_LABEL, workBucket, type WorkBucket } from "@/modules/greeting-card/domain/worklist"
import { BrochureOrderDetailModal } from "@/components/greeting-card/brochure-order-detail-modal"

// Điều phối chỉ lo đơn đã đặt: không có nhóm "Đang chờ khách"
const BUCKETS: WorkBucket[] = ["ACTION", "IN_PROGRESS", "DONE"]

/** Ngày theo giờ Việt Nam (YYYY-MM-DD), lệch `addDays` ngày. */
function vnDate(addDays = 0): string {
  return new Date(Date.now() + addDays * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })
}

export function CoordinatorBrochureTab() {
  // Bảng việc: MỌI đơn còn việc (không cắt trang), máy chủ đã xếp theo ngày + giờ giao gần nhất
  const [day, setDay] = useState<string>("")
  const board = useApi<{ data: BrochureOrder[]; truncated: boolean }>(`/api/v1/greeting-card/coordinator-board${day ? `?date=${day}` : ""}`, { refreshInterval: 30_000 })
  const orders = board.data?.data ?? []
  const loading = board.isLoading
  const loadOrders = () => void board.mutate()
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const policy = parsePaymentPolicy(org.data?.settings)
  const [modal, setModal] = useState<ModalState>({ type: "none" })
  const openModal = (m: ModalState) => setModal(m)
  const [bucket, setBucket] = useState<WorkBucket | null>(null)
  const [viewMode, setViewMode] = useState<"kanban" | "grid">("kanban")
  const work = useWorklist()
  const now = useNow()
  const workOf = new Map(work.items.filter((i) => i.orderId).map((i) => [i.orderId as string, i]))
  const bucketOf = (o: BrochureOrder): WorkBucket => {
    const w = workOf.get(o.id)
    const b = w ? workBucket(w, "COORDINATOR") : "IN_PROGRESS"
    return b === "WAITING_CUSTOMER" ? "IN_PROGRESS" : b
  }
  const counts = Object.fromEntries(BUCKETS.map((b) => [b, orders.filter((o) => bucketOf(o) === b).length])) as Record<WorkBucket, number>
  // Giữ thứ tự giờ giao của máy chủ; mặc định ẩn đơn đã xong
  const shown = orders.filter((o) => (bucket ? bucketOf(o) === bucket : bucketOf(o) !== "DONE"))
  const dayChips: Array<{ id: string; label: string }> = [
    { id: "", label: "Mọi ngày" },
    { id: vnDate(0), label: "Hôm nay" },
    { id: vnDate(1), label: "Ngày mai" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-title font-extrabold text-foreground">Việc của Điều phối</h2>
          <p className="text-body-sm text-text-muted mt-1">
            Đơn xếp theo ngày và giờ giao gần nhất. Mỗi tác vụ cập nhật bước của đơn — khách tự thấy trên link theo dõi.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => { loadOrders(); void work.refresh() }} className="gap-1.5 text-caption h-9">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Làm mới</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc việc">
          {BUCKETS.map((b) => (
            <button key={b} type="button" aria-pressed={bucket === b} onClick={() => setBucket(bucket === b ? null : b)}
              className={`h-9 rounded-xl border px-3 text-caption font-bold ${
                bucket === b ? "border-primary bg-primary text-white" : b === "ACTION" && counts.ACTION > 0 ? "border-danger/40 bg-danger-bg text-danger" : "border-border text-text-muted hover:bg-surface-muted"
              }`}>
              {WORK_BUCKET_LABEL[b]} ({counts[b]})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ngày giao">
          {dayChips.map((c) => (
            <button key={c.label} type="button" aria-pressed={day === c.id} onClick={() => setDay(c.id)}
              className={`h-9 rounded-xl border px-3 text-caption font-bold ${day === c.id ? "border-primary bg-primary text-white" : "border-border text-text-muted hover:bg-surface-muted"}`}>
              {c.label}
            </button>
          ))}
          <input type="date" aria-label="Chọn ngày giao" value={day} onChange={(e) => setDay(e.target.value)}
            className="h-9 rounded-xl border border-border bg-surface px-2 text-caption text-foreground" />
        </div>

        {/* View Mode Toggle (Spec #14) */}
        <div className="flex items-center rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-1 text-caption font-bold rounded-lg transition-colors ${
              viewMode === "kanban" ? "bg-primary text-white" : "text-text-muted hover:text-foreground"
            }`}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1 text-caption font-bold rounded-lg transition-colors ${
              viewMode === "grid" ? "bg-primary text-white" : "text-text-muted hover:text-foreground"
            }`}
          >
            Lưới thẻ
          </button>
        </div>
      </div>

      {/* Orders View */}
      {shown.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center text-text-muted flex flex-col items-center">
          <Sparkles size={36} className="text-primary/40 mb-2" />
          <p className="text-body font-bold text-foreground">{bucket ? "Không có đơn nào trong mục này" : "Chưa có đơn nào cần làm"}</p>
          <p className="text-caption text-text-muted mt-1">
            Khi khách đặt hoa qua Thẻ chào, đơn sẽ hiển thị ngay tại đây.
          </p>
        </div>
      ) : viewMode === "kanban" ? (
        <CoordinatorKanbanView
          orders={shown}
          policy={policy}
          onOpen={openModal}
          workOf={workOf}
          now={now}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shown.map((order) => (
            <CoordinatorOrderCard key={order.id} order={order} policy={policy} onOpen={openModal} work={workOf.get(order.id)} now={now} />
          ))}
        </div>
      )}
      {board.data?.truncated && (
        <p role="status" className="text-center text-caption text-warning">Có quá nhiều đơn — chọn một ngày giao để xem đủ.</p>
      )}
      {board.error && <p role="alert" className="text-center text-caption text-danger">{board.error.message}</p>}

      {/* Modal overlay */}
      {modal.type === "detail" && (
        <BrochureOrderDetailModal
          target={{
            orderId: modal.order.id,
            orderCode: modal.order.code,
            sendCode: modal.order.greeting_sessions[0]?.send_code,
            customerName: modal.order.delivery_address?.recipientName,
            recipientName: modal.order.delivery_address?.recipientName,
            recipientPhone: modal.order.delivery_address?.phone,
            deliveryAddress: modal.order.delivery_address?.street || [modal.order.delivery_address?.street, modal.order.delivery_address?.notes].filter(Boolean).join(" · "),
            deliveryDate: modal.order.delivery_window?.date,
            deliveryTimeSlot: modal.order.delivery_window?.timeSlot,
            cardMessage: modal.order.card_message,
            productName: modal.order.greeting_sessions[0]?.product_snapshot?.name || modal.order.items[0]?.description || "Hoa tươi theo mẫu",
            productImageUrl: modal.order.greeting_sessions[0]?.product_snapshot?.imageUrl,
            totalVnd: modal.order.total_vnd,
            paidVnd: modal.order.paid_vnd,
            balanceVnd: Math.max(0, modal.order.total_vnd - modal.order.paid_vnd),
            status: modal.order.status,
            createdAt: modal.order.created_at,
          }}
          onClose={() => setModal({ type: "none" })}
        />
      )}
      {modal.type !== "none" && modal.type !== "detail" && (
        <CoordinatorActionModal
          key={`${modal.type}:${modal.orderId}`}
          modal={modal}
          onClose={() => setModal({ type: "none" })}
          onDone={() => {
            setModal({ type: "none" })
            loadOrders()
            void work.refresh()
          }}
        />
      )}
    </div>
  )
}
