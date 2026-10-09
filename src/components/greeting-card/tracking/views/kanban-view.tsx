"use client"

import React from "react"
import { useApi } from "@/components/greeting-card/greeting-api"
import { formatMinutes } from "@/modules/greeting-card/domain/step-sla"
import type { KanbanColumn, TrackingViewItem } from "@/modules/greeting-card/domain/tracking-views"
import { SlaBadge, ViewState, codeOf, vnd, responsibleEmployee, StaffNametagGroup } from "./tracking-bits"

/** Kanban 9 bước: máy chủ nhóm sẵn, mỗi cột chỉ gửi 20 thẻ gấp nhất (đếm vẫn đủ). */
export function KanbanView({ qs, onOpen }: { qs: string; onOpen: (i: TrackingViewItem) => void }) {
  const res = useApi<{ data: { columns: KanbanColumn[]; total: number } }>(`/api/v1/greeting-card/tracking?view=kanban&limit=20&${qs}`, { refreshInterval: 30_000 })
  const cols = res.data?.data.columns ?? []
  return (
    <ViewState loading={res.isLoading} error={res.error} empty={!!res.data && res.data.data.total === 0}>
      <div className="flex gap-3 overflow-x-auto pb-2" aria-label="Kanban theo bước">
        {cols.map((c) => (
          <section key={c.stepId} aria-label={c.title} className="flex w-64 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-surface-alt p-2">
            <header className="px-1">
              <h3 className="flex items-center justify-between text-body-sm font-extrabold text-foreground">
                <span>{c.title}</span><span className="text-text-muted">{c.count}</span>
              </h3>
              <p className="text-caption text-text-muted">
                {c.count > 0 ? `TB ${formatMinutes(c.avgAgeMinutes)} · lâu nhất ${formatMinutes(c.maxAgeMinutes)}` : "Trống"}
                {c.overdue > 0 && <span className="ml-1 font-semibold text-danger">· {c.overdue} quá hạn</span>}
                {c.dueSoon > 0 && <span className="ml-1 font-semibold text-warning">· {c.dueSoon} sắp hạn</span>}
              </p>
            </header>
            {c.items.map((i) => (
              <button key={i.id} type="button" onClick={() => onOpen(i)} data-focus-key={i.orderId ?? i.sessionId}
                className={`flex flex-col gap-1.5 rounded-xl border bg-surface p-2.5 text-left text-caption hover:border-primary ${i.sla.state === "OVERDUE" ? "border-danger/50" : "border-border"}`}>
                <div className="flex items-start justify-between gap-1 w-full">
                  <span className="font-bold text-foreground truncate">{i.customerName}</span>
                  <span className="font-mono text-caption text-text-muted shrink-0">{codeOf(i)}</span>
                </div>
                <StaffNametagGroup item={i} />
                <span className="text-text-muted">{i.productName} · {vnd(i.totalVnd)}</span>
                <SlaBadge item={i} />
              </button>
            ))}
            {c.hasMore && <p className="px-1 text-caption text-text-muted">Còn {c.count - c.items.length} — xem ở Danh sách</p>}
          </section>
        ))}
      </div>
    </ViewState>
  )
}
