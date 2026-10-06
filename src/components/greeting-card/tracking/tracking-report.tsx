"use client"

import React, { useState } from "react"
import { BarChart3, ChevronDown } from "lucide-react"
import { SalesFunnelStats } from "@/components/greeting-card/sales/sales-funnel-stats"
import { ChannelFunnelStats } from "@/components/greeting-card/sales/channel-funnel-stats"

/** Báo cáo toàn tiệm (thu gọn mặc định): phễu theo sale và theo kênh chia sẻ. */
export function TrackingReport() {
  const [open, setOpen] = useState(false)
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left text-body font-extrabold text-foreground hover:bg-surface-muted">
        <span className="flex items-center gap-2"><BarChart3 size={18} className="text-primary" aria-hidden="true" /> Báo cáo: theo sale và theo kênh</span>
        <ChevronDown size={18} aria-hidden="true" className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <div className="flex flex-col gap-4 border-t border-border p-4">
          <SalesFunnelStats />
          <ChannelFunnelStats />
        </div>
      )}
    </section>
  )
}
