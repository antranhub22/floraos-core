"use client"

import React, { useState } from "react"
import { RefreshCw, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApi } from "@/components/greeting-card/greeting-api"
import { TrackingOrderCard } from "./tracking-order-card"
import { TrackingInternalChatDrawer } from "./tracking-internal-chat-drawer"
import { TrackingReport } from "./tracking-report"
import { TRACKING_CATEGORIES, distinct, filterTracking, inCategory, type TrackingCategory } from "@/modules/greeting-card/domain/tracking-filters"
import type { TrackingPipelineItem, TrackingPipelineStepId } from "@/modules/greeting-card/domain/tracking-pipeline-types"

const SELECT = "h-10 rounded-xl border border-border bg-surface px-3 text-body-sm text-foreground"

/** Tab Theo dõi tiến độ: toàn bộ đơn của mọi sale, mọi kênh — chỉ xem; đơn kẹt lên đầu. */
export function BrochureOrderTrackingTab() {
  // Tự làm mới mỗi 30 giây — bước đổi là thấy ngay
  const pipeline = useApi<{ data: TrackingPipelineItem[] }>("/api/v1/greeting-card/tracking-pipeline", { refreshInterval: 30_000 })
  const items = pipeline.data?.data ?? []
  const [category, setCategory] = useState<TrackingCategory>("ALL")
  const [saleName, setSaleName] = useState<string | null>(null)
  const [channel, setChannel] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [notesFor, setNotesFor] = useState<{ item: TrackingPipelineItem; stepId: TrackingPipelineStepId | "GENERAL" } | null>(null)

  const q = query.trim().toLowerCase()
  const shown = filterTracking(items, { category, saleName, channel }).filter((i) =>
    !q || [i.orderCode, i.sendCode, i.customerName, i.customerPhone, i.productName].some((v) => v?.toLowerCase().includes(q))
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title font-extrabold text-foreground">Tiến độ toàn tiệm</h2>
          <p className="mt-1 text-body-sm text-text-muted">Mọi đơn của mọi sale và kênh, cập nhật từng bước. Đơn quá thời gian chuẩn được đưa lên đầu.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void pipeline.mutate()} className="h-9 gap-1.5 text-caption">
          <RefreshCw size={14} className={pipeline.isValidating ? "animate-spin" : ""} aria-hidden="true" /> Làm mới
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo bước">
        {TRACKING_CATEGORIES.map((c) => {
          const count = items.filter((i) => inCategory(i, c.id)).length
          const active = category === c.id
          const alarm = c.id === "STUCK" && count > 0
          return (
            <button key={c.id} type="button" aria-pressed={active} onClick={() => setCategory(c.id)}
              className={`h-9 rounded-xl border px-3 text-caption font-bold ${
                active ? "border-primary bg-primary text-white" : alarm ? "border-danger/40 bg-danger-bg text-danger" : "border-border bg-surface text-text-muted hover:text-foreground"
              }`}>
              {c.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select aria-label="Lọc theo sale" value={saleName ?? ""} onChange={(e) => setSaleName(e.target.value || null)} className={SELECT}>
          <option value="">Tất cả sale</option>
          {distinct(items.map((i) => i.saleName)).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select aria-label="Lọc theo kênh" value={channel ?? ""} onChange={(e) => setChannel(e.target.value || null)} className={SELECT}>
          <option value="">Tất cả kênh</option>
          {distinct(items.map((i) => i.channel)).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <input type="search" aria-label="Tìm đơn" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Mã đơn, tên khách, số điện thoại, tên mẫu..."
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-body-sm text-foreground placeholder:text-text-muted" />
        </div>
      </div>

      <TrackingReport items={shown} />

      {pipeline.error ? (
        <p role="alert" className="rounded-xl bg-danger-bg p-4 text-body-sm text-danger">{(pipeline.error as Error).message}</p>
      ) : pipeline.isLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-muted" />)}</div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-12 text-center">
          <Sparkles size={36} className="mb-2 text-primary/40" aria-hidden="true" />
          <p className="text-body font-bold text-foreground">Không có đơn nào khớp bộ lọc</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((item) => (
            <TrackingOrderCard key={item.id} item={item} onOpenNotes={(itm, stepId) => setNotesFor({ item: itm, stepId: stepId ?? "GENERAL" })} />
          ))}
        </div>
      )}

      {notesFor && (
        <TrackingInternalChatDrawer item={notesFor.item} initialStepId={notesFor.stepId} onClose={() => setNotesFor(null)} onNoteAdded={() => void pipeline.mutate()} />
      )}
    </div>
  )
}
