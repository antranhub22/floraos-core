"use client"

import React, { useState } from "react"
import { RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CoordinatorActionModal } from "./coordinator-action-modal"
import { CoordinatorOrderCard, type BrochureOrder, type ModalState } from "./coordinator-order-card"
import { CoordinatorKanbanView } from "./coordinator-kanban-view"
import { useApi, usePagedList } from "@/components/greeting-card/greeting-api"
import { parsePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import { useNow, useWorklist } from "@/components/greeting-card/work/use-worklist"
import { WORK_BUCKET_LABEL, sortWorklist, workBucket, type WorkBucket } from "@/modules/greeting-card/domain/worklist"

// Điều phối chỉ lo đơn đã đặt: không có nhóm "Đang chờ khách"
const BUCKETS: WorkBucket[] = ["ACTION", "IN_PROGRESS", "DONE"]

export function CoordinatorBrochureTab() {
  // Chỉ đơn chưa huỷ — bảng xưởng không cần đơn đã huỷ
  const list = usePagedList<BrochureOrder>("/api/v1/greeting-card/orders")
  const orders = list.items.filter((o) => o.status !== "CANCELLED")
  const loading = list.isLoading
  const loadOrders = () => void list.refresh()
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
  // Việc kẹt của Điều phối lên đầu, rồi đơn vừa đổi bước; mặc định ẩn đơn đã xong
  const rank = new Map(sortWorklist(work.items, "COORDINATOR").map((i, idx) => [i.orderId, idx]))
  const shown = orders
    .filter((o) => (bucket ? bucketOf(o) === bucket : bucketOf(o) !== "DONE"))
    .sort((a, b) => (rank.get(a.id) ?? 1e6) - (rank.get(b.id) ?? 1e6))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-title font-extrabold text-foreground">Việc của Điều phối</h2>
          <p className="text-body-sm text-text-muted mt-1">
            Đơn đang kẹt ở phần của bạn lên đầu. Mỗi tác vụ cập nhật bước của đơn — khách tự nhận thông báo qua link theo dõi.
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
      {list.hasMore && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" disabled={list.isLoadingMore} onClick={() => void list.loadMore()}>
            {list.isLoadingMore ? "Đang tải..." : "Tải thêm đơn"}
          </Button>
        </div>
      )}

      {/* Modal overlay */}
      {modal.type !== "none" && (
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
