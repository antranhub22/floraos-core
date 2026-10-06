"use client"

import React from "react"
import { formatMinutes } from "@/modules/greeting-card/domain/step-sla"
import type { SlaInfo, TrackingViewItem } from "@/modules/greeting-card/domain/tracking-views"

export const vnd = (n: number) => (n > 0 ? `${n.toLocaleString("vi-VN")} đ` : "Chờ báo giá")
export const codeOf = (i: TrackingViewItem) => (i.orderCode ? `Đơn ${i.orderCode}` : `Link ${i.sendCode}`)

const SLA_STYLE: Record<SlaInfo["state"], { label: string; cls: string }> = {
  OVERDUE: { label: "Quá hạn", cls: "bg-danger-bg text-danger" },
  DUE_SOON: { label: "Sắp quá hạn", cls: "bg-warning-bg text-warning" },
  ON_TRACK: { label: "Đúng tiến độ", cls: "bg-success-bg text-success" },
  NONE: { label: "Không tính giờ", cls: "bg-surface-muted text-text-muted" },
}

/** Nhãn thời gian chuẩn: trạng thái + đã ở bước bao lâu / chuẩn bao lâu. */
export function SlaBadge({ item, compact = false }: { item: TrackingViewItem; compact?: boolean }) {
  const s = SLA_STYLE[item.sla.state]
  const detail = item.sla.state === "OVERDUE" && item.stuck
    ? `quá ${formatMinutes(item.stuck.overdueMinutes)}`
    : item.sla.minutes !== null ? `${formatMinutes(item.sla.ageMinutes)} / ${formatMinutes(item.sla.minutes)}` : formatMinutes(item.sla.ageMinutes)
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold ${s.cls}`}>
      {s.label}{compact ? "" : ` · ${detail}`}
    </span>
  )
}

export function ViewState({ loading, error, empty, children }: { loading: boolean; error: unknown; empty: boolean; children: React.ReactNode }) {
  if (error) return <p role="alert" className="rounded-xl bg-danger-bg p-4 text-body-sm text-danger">{(error as Error).message}</p>
  if (loading) return <div className="flex flex-col gap-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-muted" />)}</div>
  if (empty) return <p className="rounded-2xl border border-border bg-surface p-8 text-center text-body-sm text-text-muted">Không có đơn hoặc link nào khớp bộ lọc.</p>
  return <>{children}</>
}
