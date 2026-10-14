"use client"

import React from "react"
import { useApi } from "@/components/greeting-card/greeting-api"
import { formatMinutes } from "@/modules/greeting-card/domain/step-sla"
import type { KanbanColumn, TrackingViewItem } from "@/modules/greeting-card/domain/tracking-views"
import { SlaBadge, ViewState, codeOf, vnd, StaffNametagGroup } from "./tracking-bits"
import { classifyOrderTimeTier, type OrderTimeTier } from "@/modules/greeting-card/domain/order-time-tier"
import { TierCollapsibleSection } from "@/components/greeting-card/coordinator/tier-collapsible-section"

/** Kanban 9 bước: phân tầng hiển thị theo thời gian để tập trung vào đơn cần xử lý ngay. */
export function KanbanView({ qs, onOpen }: { qs: string; onOpen: (i: TrackingViewItem) => void }) {
  const res = useApi<{ data: { columns: KanbanColumn[]; total: number } }>(
    `/api/v1/greeting-card/tracking?view=kanban&limit=20&${qs}`,
    { refreshInterval: 30_000 }
  )
  const cols = res.data?.data.columns ?? []

  const renderCard = (i: TrackingViewItem, tier: OrderTimeTier) => (
    <button
      key={i.id}
      type="button"
      onClick={() => onOpen(i)}
      data-focus-key={i.orderId ?? i.sessionId}
      className={`flex flex-col gap-1.5 rounded-xl border bg-surface p-2.5 text-left text-caption transition-colors hover:border-primary ${
        tier === "OVERDUE"
          ? "border-danger/60 bg-danger-bg/10"
          : tier === "URGENT"
          ? "border-warning/70 bg-warning-bg/15 shadow-xs"
          : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-1 w-full">
        <span className="font-bold text-foreground truncate">{i.customerName}</span>
        <span className="font-mono text-caption text-text-muted shrink-0">{codeOf(i)}</span>
      </div>
      <StaffNametagGroup item={i} />
      <span className="text-text-muted">{i.productName} · {vnd(i.totalVnd)}</span>
      <SlaBadge item={i} />
    </button>
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
