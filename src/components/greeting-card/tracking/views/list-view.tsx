"use client"

import React from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { usePagedList } from "@/components/greeting-card/greeting-api"
import { formatMinutes } from "@/modules/greeting-card/domain/step-sla"
import type { SortField, TrackingViewItem } from "@/modules/greeting-card/domain/tracking-views"
import { LIST_COLUMNS, type ListColumn, type TrackingViewState } from "./tracking-view-state"
import { SlaBadge, ViewState, codeOf, vnd } from "./tracking-bits"

const SORTABLE: Partial<Record<ListColumn, SortField>> = { customer: "customerName", step: "step", age: "age", sla: "urgency", total: "totalVnd", delivery: "deliveryDate" }

function cell(c: ListColumn, i: TrackingViewItem): React.ReactNode {
  switch (c) {
    case "code": return codeOf(i)
    case "customer": return i.customerName
    case "sale": return i.saleName
    case "step": return i.currentStepTitle
    case "age": return formatMinutes(i.sla.ageMinutes)
    case "sla": return <SlaBadge item={i} compact />
    case "total": return vnd(i.totalVnd)
    case "delivery": return i.deliveryDate ? `${i.deliveryDate}${i.deliveryTimeSlot ? ` · ${i.deliveryTimeSlot}` : ""}` : "—"
    case "product": return i.productName
    case "channel": return i.channel
    case "phone": return i.customerPhone || "—"
  }
}

/** Danh sách: lọc, sắp xếp, phân trang ở máy chủ; chọn cột hiển thị. */
export function ListView({ qs, state, onChange, onOpen, view = "list" }: {
  qs: string; state: TrackingViewState; onChange: (p: Partial<TrackingViewState>) => void; onOpen: (i: TrackingViewItem) => void; view?: "list" | "queue"
}) {
  const list = usePagedList<TrackingViewItem>(`/api/v1/greeting-card/tracking?view=${view}&${qs}`, 25)
  const cols = LIST_COLUMNS.filter((c) => state.columns.includes(c.id))
  const toggleSort = (f: SortField) => onChange(state.sort === f ? { dir: state.dir === "asc" ? "desc" : "asc" } : { sort: f, dir: "desc" })
  return (
    <div className="flex flex-col gap-3">
      {view === "list" && (
        <details className="text-body-sm">
          <summary className="cursor-pointer font-semibold text-text-muted">Cột hiển thị</summary>
          <div className="mt-2 flex flex-wrap gap-3">
            {LIST_COLUMNS.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5">
                <input type="checkbox" checked={state.columns.includes(c.id)}
                  onChange={(e) => onChange({ columns: e.target.checked ? [...state.columns, c.id] : state.columns.filter((x) => x !== c.id) })} />
                {c.label}
              </label>
            ))}
          </div>
        </details>
      )}
      <ViewState loading={list.isLoading} error={list.error} empty={!list.isLoading && list.items.length === 0}>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-border bg-surface-muted text-caption text-text-muted">
              <tr>
                {cols.map((c) => {
                  const f = view === "list" ? SORTABLE[c.id] : undefined
                  return (
                    <th key={c.id} className="px-3 py-2" aria-sort={f && state.sort === f ? (state.dir === "asc" ? "ascending" : "descending") : undefined}>
                      {f ? (
                        <button type="button" onClick={() => toggleSort(f)} className="inline-flex items-center gap-1 font-semibold">
                          {c.label}{state.sort === f && (state.dir === "asc" ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
                        </button>
                      ) : c.label}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.items.map((i) => (
                <tr key={i.id} data-focus-key={i.orderId ?? i.sessionId} className="hover:bg-surface-muted">
                  {cols.map((c, n) => (
                    <td key={c.id} className="px-3 py-2 align-top">
                      {n === 0 ? <button type="button" onClick={() => onOpen(i)} className="text-left font-semibold text-primary hover:underline">{cell(c.id, i)}</button> : cell(c.id, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.hasMore && (
          <button type="button" onClick={() => void list.loadMore()} className="min-h-11 rounded-xl border border-border bg-surface text-body-sm font-semibold">
            {list.isLoadingMore ? "Đang tải..." : "Tải thêm"}
          </button>
        )}
      </ViewState>
    </div>
  )
}
