"use client"

import React, { useState } from "react"
import { useSWRConfig } from "swr"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApi } from "@/components/greeting-card/greeting-api"
import { MessageThread } from "@/components/greeting-card/inbox/message-thread"
import { BrochureOrderDetailModal } from "@/components/greeting-card/brochure-order-detail-modal"
import type { TrackingViewItem } from "@/modules/greeting-card/domain/tracking-views"
import { TrackingToolbar } from "./views/tracking-toolbar"
import { KanbanView } from "./views/kanban-view"
import { ListView } from "./views/list-view"
import { CalendarView } from "./views/calendar-view"
import { TimelineView } from "./views/timeline-view"
import { DashboardView } from "./views/dashboard-view"
import { codeOf } from "./views/tracking-bits"
import { DEFAULT_STATE, queryString, type SavedView, type TrackingViewState } from "./views/tracking-view-state"

/**
 * Tab Theo dõi tiến độ — nhiều cách xem trên CÙNG một tập đơn/link: Kanban, Danh sách, Lịch,
 * Timeline, Công việc, Dashboard. Bộ lọc và phạm vi dùng chung; máy chủ lọc/nhóm/phân trang.
 */
export function BrochureOrderTrackingTab() {
  const me = useApi<{ user: { id: string } }>("/api/v1/auth/me")
  const { mutate } = useSWRConfig()
  const [state, setState] = useState<TrackingViewState>(DEFAULT_STATE)
  const [selected, setSelected] = useState<TrackingViewItem | null>(null)
  const [notesFor, setNotesFor] = useState<TrackingViewItem | null>(null)
  const [detailFor, setDetailFor] = useState<TrackingViewItem | null>(null)

  const change = (patch: Partial<TrackingViewState>) => setState((s) => ({ ...s, ...patch }))
  const applyView = (v: SavedView) =>
    setState({ ...DEFAULT_STATE, columns: state.columns, ...v.state, ...(v.scope === "me" && me.data ? { saleId: me.data.user.id } : {}) })
  // Mở một đơn: sang Timeline của đúng đơn đó (giữ bộ lọc)
  const open = (i: TrackingViewItem) => { setSelected(i); change({ view: "timeline" }) }
  const refresh = () => void mutate((key) => typeof key === "string" && key.includes("/api/v1/greeting-card/tracking") || (Array.isArray(key) && String(key[0]).includes("/api/v1/greeting-card/tracking")))

  // Lịch tự chọn khoảng ngày; bộ lọc ngày giao chỉ gửi kèm khi không xem lịch
  const qs = queryString(state.view === "calendar" ? { ...state, deliveryFrom: "", deliveryTo: "" } : state)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title font-extrabold text-foreground">Tiến độ toàn tiệm</h2>
          <p className="mt-1 text-body-sm text-text-muted">Cùng một danh sách đơn, xem theo cách bạn cần. Đổi cách xem vẫn giữ bộ lọc.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={refresh} className="h-9 gap-1.5 text-caption">
          <RefreshCw size={14} aria-hidden="true" /> Làm mới
        </Button>
      </div>

      <TrackingToolbar state={state} onChange={change} onApplyView={applyView} />

      {state.view === "kanban" && <KanbanView qs={qs} onOpen={open} />}
      {state.view === "list" && <ListView qs={qs} state={state} onChange={change} onOpen={open} onDetail={(i) => setDetailFor(i)} />}
      {state.view === "queue" && <ListView qs={qs} state={state} onChange={change} onOpen={open} onDetail={(i) => setDetailFor(i)} view="queue" />}
      {state.view === "calendar" && <CalendarView qs={qs} from={state.deliveryFrom} to={state.deliveryTo} onOpen={open} />}
      {state.view === "timeline" && (
        <TimelineView
          qs={qs}
          state={state}
          onChange={change}
          selected={selected}
          onSelect={setSelected}
          onMessage={setNotesFor}
          onDetail={(i) => setDetailFor(i)}
        />
      )}
      {state.view === "dashboard" && <DashboardView qs={qs} />}

      {notesFor && (
        <MessageThread
          target={{ orderId: notesFor.orderId, sessionId: notesFor.sessionId }}
          stepKey="GENERAL"
          title={`${notesFor.customerName} · ${codeOf(notesFor)}`}
          onClose={() => setNotesFor(null)}
        />
      )}

      {detailFor && (
        <BrochureOrderDetailModal
          target={{
            orderId: detailFor.orderId,
            sessionId: detailFor.sessionId,
            orderCode: detailFor.orderCode,
            sendCode: detailFor.sendCode,
            customerName: detailFor.customerName,
            customerPhone: detailFor.customerPhone,
            recipientName: detailFor.recipientName,
            recipientPhone: detailFor.recipientPhone,
            deliveryAddress: detailFor.deliveryAddress,
            deliveryDate: detailFor.deliveryDate,
            deliveryTimeSlot: detailFor.deliveryTimeSlot,
            deliveryZone: detailFor.deliveryZone,
            cardMessage: detailFor.cardMessage,
            productName: detailFor.productName,
            productImageUrl: detailFor.productImageUrl,
            totalVnd: detailFor.totalVnd,
            paidVnd: detailFor.paidVnd,
            balanceVnd: detailFor.balanceVnd,
            saleName: detailFor.saleName,
            currentStepTitle: detailFor.currentStepTitle,
            createdAt: detailFor.createdAt,
          }}
          onClose={() => setDetailFor(null)}
          onOpenNotes={() => {
            setNotesFor(detailFor)
            setDetailFor(null)
          }}
        />
      )}
    </div>
  )
}
