"use client"

import React, { useState } from "react"
import { Bell } from "lucide-react"
import { newUpdates } from "@/modules/greeting-card/domain/worklist"
import { formatMinutes } from "@/modules/greeting-card/domain/step-sla"
import type { TrackingPipelineItem } from "@/modules/greeting-card/domain/tracking-pipeline-types"

function readSeen(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * "Cập nhật mới": đơn đổi bước kể từ lần bấm "Đã xem" gần nhất (nhớ trên máy này).
 * Lần đầu mở chỉ coi 24 giờ gần nhất là mới.
 */
export function WorkUpdates({ items, storageKey, now }: { items: TrackingPipelineItem[]; storageKey: string; now: number }) {
  const [seen, setSeen] = useState<string | null>(() =>
    typeof window === "undefined" ? null : readSeen(storageKey) ?? new Date(Date.now() - 86_400_000).toISOString()
  )
  const updates = newUpdates(items, seen)

  function markSeen() {
    const iso = new Date().toISOString()
    setSeen(iso)
    try {
      window.localStorage.setItem(storageKey, iso)
    } catch {
      // trình duyệt chặn lưu — vẫn ẩn trong phiên này
    }
  }

  if (updates.length === 0) return null
  return (
    <section aria-labelledby={`${storageKey}-title`} className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 id={`${storageKey}-title`} className="flex items-center gap-2 text-body font-extrabold text-foreground">
          <Bell size={16} className="text-primary" aria-hidden="true" />
          Cập nhật mới
          <span className="rounded-full bg-primary px-2 text-caption font-bold text-white">{updates.length}</span>
        </h3>
        <button type="button" onClick={markSeen} className="h-9 rounded-lg px-3 text-caption font-bold text-primary hover:bg-primary/10">
          Đã xem
        </button>
      </div>
      <ul className="flex flex-col gap-1 text-body-sm">
        {updates.map((u) => (
          <li key={u.id} className="flex flex-wrap justify-between gap-x-3">
            <span className="text-foreground"><strong>{u.customerName}</strong> — {u.currentStepTitle}</span>
            <span className="text-caption text-text-muted">{formatMinutes(Math.max(0, Math.floor((now - Date.parse(u.stepStartedAt)) / 60_000)))} trước</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
