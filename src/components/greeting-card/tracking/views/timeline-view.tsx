"use client"

import React from "react"
import { usePagedList, useApi } from "@/components/greeting-card/greeting-api"
import { formatMinutes } from "@/modules/greeting-card/domain/step-sla"
import type { StepSegment, TimelineEvent } from "@/modules/greeting-card/domain/tracking-timeline"
import type { TrackingViewItem } from "@/modules/greeting-card/domain/tracking-views"
import { ListView } from "./list-view"
import { codeOf } from "./tracking-bits"
import type { TrackingViewState } from "./tracking-view-state"

const when = (s: string) => new Date(s).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })

/** Dòng thời gian: chọn một đơn/link ở danh sách → từng bước đã qua so với thời gian chuẩn + mọi sự kiện. */
export function TimelineView({ qs, state, onChange, selected, onSelect, onMessage }: {
  qs: string; state: TrackingViewState; onChange: (p: Partial<TrackingViewState>) => void
  selected: TrackingViewItem | null; onSelect: (i: TrackingViewItem | null) => void; onMessage: (i: TrackingViewItem) => void
}) {
  if (!selected) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-body-sm text-text-muted">Chọn một đơn hoặc link để xem toàn bộ hành trình.</p>
        <ListView qs={qs} state={state} onChange={onChange} onOpen={onSelect} />
      </div>
    )
  }
  const ref = selected.orderId ? `orderId=${selected.orderId}` : `sessionId=${selected.sessionId}`
  return <TimelineDetail refQs={ref} item={selected} onBack={() => onSelect(null)} onMessage={() => onMessage(selected)} />
}

function TimelineDetail({ refQs, item, onBack, onMessage }: { refQs: string; item: TrackingViewItem; onBack: () => void; onMessage: () => void }) {
  const url = `/api/v1/greeting-card/tracking/timeline?${refQs}`
  const head = useApi<{ data: { segments: StepSegment[] } }>(`${url}&limit=1`)
  const events = usePagedList<TimelineEvent>(url, 50)
  const segments = head.data?.data.segments ?? []
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="min-h-11 text-body-sm font-semibold text-primary">← Chọn đơn khác</button>
        <button type="button" onClick={onMessage} className="min-h-11 rounded-xl border border-border px-3 text-body-sm font-semibold">Ghi chú / nhắn</button>
      </div>
      <h3 className="text-body font-extrabold text-foreground">{item.customerName} · {codeOf(item)}</h3>
      {head.error ? <p role="alert" className="text-body-sm text-danger">{(head.error as Error).message}</p> : (
        <ol className="flex flex-col gap-2" aria-label="Các bước đã qua">
          {segments.map((s) => (
            <li key={s.stepId} className={`rounded-xl border p-3 text-body-sm ${s.overMinutes > 0 ? "border-danger/50 bg-danger-bg/40" : "border-border bg-surface"}`}>
              <p className="font-bold text-foreground">{s.title}</p>
              <p className="text-caption text-text-muted">
                Vào {when(s.enteredAt)} · {s.leftAt ? `ở ${formatMinutes(s.durationMinutes)}` : `đang ở ${formatMinutes(s.durationMinutes)}`}
                {s.slaMinutes !== null && ` · chuẩn ${formatMinutes(s.slaMinutes)}`}
                {s.overMinutes > 0 && <span className="font-semibold text-danger"> · vượt {formatMinutes(s.overMinutes)}</span>}
              </p>
            </li>
          ))}
        </ol>
      )}
      <section aria-label="Sự kiện" className="flex flex-col gap-1">
        <h4 className="text-body-sm font-extrabold text-foreground">Sự kiện</h4>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {events.items.map((e, n) => (
            <li key={`${e.at}-${n}`} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-body-sm">
              <span>{e.label}{e.note ? ` · ${e.note}` : ""}</span>
              <span className="text-caption text-text-muted">{when(e.at)}</span>
            </li>
          ))}
        </ul>
        {events.hasMore && (
          <button type="button" onClick={() => void events.loadMore()} className="min-h-11 rounded-xl border border-border bg-surface text-body-sm font-semibold">
            {events.isLoadingMore ? "Đang tải..." : "Tải thêm"}
          </button>
        )}
      </section>
    </div>
  )
}
