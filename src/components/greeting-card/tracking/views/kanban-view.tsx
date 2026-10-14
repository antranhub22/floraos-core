"use client"

import React, { useCallback } from "react"
import { useApi } from "@/components/greeting-card/greeting-api"
import { formatMinutes } from "@/modules/greeting-card/domain/step-sla"
import type { KanbanColumn, TrackingViewItem } from "@/modules/greeting-card/domain/tracking-views"
import { ViewState } from "./tracking-bits"
import { classifyOrderTimeTier, type OrderTimeTier } from "@/modules/greeting-card/domain/order-time-tier"
import { TierCollapsibleSection } from "@/components/greeting-card/coordinator/tier-collapsible-section"
import { KanbanCard } from "./kanban-card"

interface KanbanViewProps {
  qs: string
  onOpen: (i: TrackingViewItem) => void
  canDecide?: boolean
  onDismiss?: (item: TrackingViewItem) => void
}

/** Kanban 9 bước: phân tầng hiển thị theo thời gian để tập trung vào đơn cần xử lý ngay. */
export function KanbanView({ qs, onOpen, canDecide = false, onDismiss }: KanbanViewProps) {
  const apiPath = `/api/v1/greeting-card/tracking?view=kanban&limit=20&${qs}`
  const res = useApi<{ data: { columns: KanbanColumn[]; total: number } }>(
    apiPath,
    { refreshInterval: 30_000 }
  )
  const cols = res.data?.data.columns ?? []

  const handleDecide = useCallback(async (item: TrackingViewItem, approve: boolean) => {
    try {
      await fetch("/api/v1/greeting-card/tracking/decide-dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.orderId ?? item.sessionId,
          type: item.orderId ? "ORDER" : "SESSION",
          approve,
        }),
      })
      res.mutate?.()
    } catch { /* kết nối lỗi, bỏ qua */ }
  }, [res])

  const handleRestore = useCallback(async (item: TrackingViewItem) => {
    try {
      await fetch("/api/v1/greeting-card/tracking/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.orderId ?? item.sessionId,
          type: item.orderId ? "ORDER" : "SESSION",
        }),
      })
      res.mutate?.()
    } catch { /* kết nối lỗi, bỏ qua */ }
  }, [res])

  const renderCard = (i: TrackingViewItem, tier: OrderTimeTier) => (
    <KanbanCard
      key={i.id}
      item={i}
      tier={tier}
      onOpen={onOpen}
      canDecide={canDecide}
      {...(onDismiss ? { onDismiss } : {})}
      onDecide={handleDecide}
      onRestore={handleRestore}
    />
  )

  return (
    <ViewState loading={res.isLoading} error={res.error} empty={!!res.data && res.data.data.total === 0}>
      <div className="flex gap-3 overflow-x-auto pb-2" aria-label="Kanban theo bước">
        {cols.map((c) => {
          // Phân nhóm đơn theo các tầng thời gian
          const overdueItems: TrackingViewItem[] = []
          const urgentItems: TrackingViewItem[] = []
          const currentItems: TrackingViewItem[] = []
          const futureItems: TrackingViewItem[] = []

          // Riêng bước 9 HOÀN TẤT không phân loại quá hạn
          const isDoneCol = c.stepId === "STEP_9_COMPLETED"

          for (const item of c.items) {
            if (isDoneCol) {
              currentItems.push(item)
              continue
            }
            const tier = classifyOrderTimeTier({
              deliveryDate: item.deliveryDate,
              deliveryTimeSlot: item.deliveryTimeSlot,
              isStuck: !!item.stuck,
              slaState: item.sla.state,
            })
            if (tier === "OVERDUE") overdueItems.push(item)
            else if (tier === "URGENT") urgentItems.push(item)
            else if (tier === "FUTURE") futureItems.push(item)
            else currentItems.push(item)
          }

          return (
            <section
              key={c.stepId}
              aria-label={c.title}
              className="flex w-64 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-surface-alt p-2"
            >
              <header className="px-1">
                <h3 className="flex items-center justify-between text-body-sm font-extrabold text-foreground">
                  <span>{c.title}</span>
                  <span className="text-text-muted">{c.count}</span>
                </h3>
                <p className="text-caption text-text-muted">
                  {c.count > 0 ? `TB ${formatMinutes(c.avgAgeMinutes)} · lâu nhất ${formatMinutes(c.maxAgeMinutes)}` : "Trống"}
                  {overdueItems.length > 0 && <span className="ml-1 font-semibold text-danger">· {overdueItems.length} quá hạn</span>}
                  {urgentItems.length > 0 && <span className="ml-1 font-semibold text-warning">· {urgentItems.length} sắp hạn</span>}
                </p>
              </header>

              <div className="flex flex-col gap-2 min-h-[100px]">
                {c.items.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center p-4 text-caption text-text-muted italic border border-dashed border-border/60 rounded-xl">
                    Trống
                  </div>
                ) : (
                  <>
                    {/* TẦNG 1: ĐƠN QUÁ HẠN (Mặc định THU GỌN) */}
                    {overdueItems.length > 0 && (
                      <TierCollapsibleSection type="OVERDUE" count={overdueItems.length}>
                        {overdueItems.map((i) => renderCard(i, "OVERDUE"))}
                      </TierCollapsibleSection>
                    )}

                    {/* TẦNG 2: TIÊU ĐIỂM HÀNH ĐỘNG (Sắp hạn + Trong ca) - LUÔN BUNG MỞ */}
                    {urgentItems.map((i) => renderCard(i, "URGENT"))}
                    {currentItems.map((i) => renderCard(i, "CURRENT"))}

                    {/* TẦNG 3: ĐƠN CA SAU & ĐẶT TRƯỚC - Mặc định THU GỌN */}
                    {futureItems.length > 0 && (
                      <TierCollapsibleSection type="FUTURE" count={futureItems.length}>
                        {futureItems.map((i) => renderCard(i, "FUTURE"))}
                      </TierCollapsibleSection>
                    )}
                  </>
                )}
              </div>

              {c.hasMore && <p className="px-1 text-caption text-text-muted">Còn {c.count - c.items.length} — xem ở Danh sách</p>}
            </section>
          )
        })}
      </div>
    </ViewState>
  )
}
