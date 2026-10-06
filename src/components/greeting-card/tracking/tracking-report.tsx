"use client"

import React, { useState } from "react"
import { BarChart3, ChevronDown } from "lucide-react"
import { SalesFunnelStats } from "@/components/greeting-card/sales/sales-funnel-stats"
import { ChannelFunnelStats } from "@/components/greeting-card/sales/channel-funnel-stats"
import type { TrackingPipelineItem } from "@/modules/greeting-card/domain/tracking-pipeline-types"

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`

/** Báo cáo (thu gọn mặc định): phễu theo sale, theo kênh và bảng đơn đang lọc kèm thông tin khách. */
export function TrackingReport({ items }: { items: TrackingPipelineItem[] }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left text-body font-extrabold text-foreground hover:bg-surface-muted">
        <span className="flex items-center gap-2"><BarChart3 size={18} className="text-primary" aria-hidden="true" /> Báo cáo: theo sale, theo kênh và danh sách đơn</span>
        <ChevronDown size={18} aria-hidden="true" className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <div className="flex flex-col gap-4 border-t border-border p-4">
          <SalesFunnelStats />
          <ChannelFunnelStats />
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-body-sm">
              <caption className="p-3 text-left text-body font-extrabold text-foreground">Đơn đang hiển thị ({items.length})</caption>
              <thead className="border-y border-border bg-surface-muted text-caption uppercase text-text-muted">
                <tr>
                  <th className="px-3 py-2">Mã</th><th className="px-3 py-2">Khách</th><th className="px-3 py-2">Điện thoại</th>
                  <th className="px-3 py-2">Sale</th><th className="px-3 py-2">Kênh</th><th className="px-3 py-2">Mẫu</th>
                  <th className="px-3 py-2 text-right">Tổng</th><th className="px-3 py-2">Bước</th><th className="px-3 py-2">Giao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((i) => (
                  <tr key={i.id} className={i.stuck ? "bg-danger-bg/40" : ""}>
                    <td className="px-3 py-2 font-mono text-caption">{i.orderCode ?? i.sendCode}</td>
                    <td className="px-3 py-2 font-semibold text-foreground">{i.customerName}</td>
                    <td className="px-3 py-2">{i.customerPhone || "—"}</td>
                    <td className="px-3 py-2">{i.saleName}</td>
                    <td className="px-3 py-2">{i.channel}</td>
                    <td className="px-3 py-2">{i.productName}</td>
                    <td className="px-3 py-2 text-right">{i.totalVnd > 0 ? vnd(i.totalVnd) : "—"}</td>
                    <td className="px-3 py-2">{i.currentStepTitle}{i.stuck ? " · kẹt" : ""}</td>
                    <td className="px-3 py-2">{[i.deliveryDate, i.deliveryTimeSlot].filter(Boolean).join(" · ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
