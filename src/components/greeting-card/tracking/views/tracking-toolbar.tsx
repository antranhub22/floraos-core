"use client"

import React, { useEffect, useState } from "react"
import { Bookmark, Search, Trash2 } from "lucide-react"
import { useApi } from "@/components/greeting-card/greeting-api"
import { useSession } from "@/lib/session"
import { TRACKING_CATEGORIES } from "@/modules/greeting-card/domain/tracking-filters"
import {
  VIEW_TABS, loadSavedViews, presetViews, storeSavedViews,
  type SavedView, type TrackingViewState,
} from "./tracking-view-state"

const SELECT = "h-10 rounded-xl border border-border bg-surface px-3 text-body-sm text-foreground"

interface Props {
  state: TrackingViewState
  onChange: (patch: Partial<TrackingViewState>) => void
  onApplyView: (v: SavedView) => void
}

/** Chuyển view + bộ lọc dùng chung: đổi view giữ nguyên bộ lọc và phạm vi. */
export function TrackingToolbar({ state, onChange, onApplyView }: Props) {
  const { organization } = useSession()
  const orgId = organization?.id
  const recipients = useApi<{ data: { members: Array<{ userId: string; name: string }> } }>("/api/v1/greeting-card/messages/recipients")
  const members = recipients.data?.data.members ?? []
  const [saved, setSaved] = useState<SavedView[]>(() => loadSavedViews(orgId))

  useEffect(() => {
    setSaved(loadSavedViews(orgId))
  }, [orgId])

  function saveCurrent() {
    const name = window.prompt("Tên view (vd. Đơn của Sale Lan)")?.trim()
    if (!name) return
    const next = [...saved, { id: `u-${Date.now().toString(36)}`, name: name.slice(0, 60), state: { ...state } }]
    setSaved(next)
    storeSavedViews(next, orgId)
  }
  function remove(id: string) {
    const next = saved.filter((v) => v.id !== id)
    setSaved(next)
    storeSavedViews(next, orgId)
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Cách xem" className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface-alt p-1">
        {VIEW_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={state.view === t.id} onClick={() => onChange({ view: t.id })}
            className={`min-h-9 rounded-lg px-3 text-body-sm font-semibold ${state.view === t.id ? "bg-surface text-primary shadow-xs" : "text-text-muted hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-label="View đã lưu">
        <Bookmark size={16} className="text-text-muted" aria-hidden="true" />
        {[...presetViews(), ...saved].map((v) => (
          <span key={v.id} className="inline-flex items-center rounded-full border border-border bg-surface">
            <button type="button" onClick={() => onApplyView(v)} className="min-h-9 px-3 text-caption font-semibold text-foreground hover:text-primary">{v.name}</button>
            {v.id.startsWith("u-") && (
              <button type="button" aria-label={`Xoá view ${v.name}`} onClick={() => remove(v.id)} className="min-h-9 pr-2 text-text-muted hover:text-danger">
                <Trash2 size={14} aria-hidden="true" />
              </button>
            )}
          </span>
        ))}
        <button type="button" onClick={saveCurrent} className="min-h-9 rounded-full border border-dashed border-primary px-3 text-caption font-semibold text-primary">
          + Lưu view hiện tại
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <input type="search" aria-label="Tìm đơn" value={state.q} onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Mã đơn, tên khách, số điện thoại, tên mẫu..."
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-body-sm text-foreground placeholder:text-text-muted" />
        </div>
        <select aria-label="Nhóm bước" value={state.category} onChange={(e) => onChange({ category: e.target.value as TrackingViewState["category"] })} className={SELECT}>
          <option value="">Mọi bước</option>
          {TRACKING_CATEGORIES.filter((c) => c.id !== "ALL").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select aria-label="Sale phụ trách" value={state.saleId} onChange={(e) => onChange({ saleId: e.target.value })} className={SELECT}>
          <option value="">Mọi sale</option>
          {members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
        </select>
        <select aria-label="Thời gian chuẩn" value={state.sla} onChange={(e) => onChange({ sla: e.target.value as TrackingViewState["sla"] })} className={SELECT}>
          <option value="">Mọi trạng thái thời gian</option>
          <option value="ATTENTION">Quá hoặc sắp quá hạn</option>
          <option value="OVERDUE">Quá thời gian chuẩn</option>
          <option value="DUE_SOON">Sắp quá hạn</option>
          <option value="ON_TRACK">Đúng tiến độ</option>
        </select>
        <select aria-label="Loại" value={state.type} onChange={(e) => onChange({ type: e.target.value as TrackingViewState["type"] })} className={SELECT}>
          <option value="">Đơn và link</option>
          <option value="ORDER">Chỉ đơn đã đặt</option>
          <option value="SESSION">Chỉ link chờ khách</option>
        </select>
        <label className="flex items-center gap-2 text-caption text-text-muted">
          Giao từ
          <input type="date" value={state.deliveryFrom} onChange={(e) => onChange({ deliveryFrom: e.target.value })} className={`${SELECT} flex-1`} />
        </label>
        <label className="flex items-center gap-2 text-caption text-text-muted">
          đến
          <input type="date" value={state.deliveryTo} onChange={(e) => onChange({ deliveryTo: e.target.value })} className={`${SELECT} flex-1`} />
        </label>
      </div>
    </div>
  )
}
