"use client"

import React from "react"
import { TrendingUp, ArrowUpRight, DollarSign, ShoppingCart, Percent } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface KpiItem {
  label: string
  value: string
  changePercent: number
  isPositive: boolean
}

export interface KpiSummaryCardProps {
  periodLabel?: string
  revenue: KpiItem
  orders: KpiItem
  conversionRate: KpiItem
  avgOrderValue: KpiItem
}

/**
 * KpiSummaryCard (Thẻ tổng hợp chỉ số kinh doanh cửa hàng hoa M11)
 */
export function KpiSummaryCard({
  periodLabel = "30 ngày qua",
  revenue,
  orders,
  conversionRate,
  avgOrderValue,
}: KpiSummaryCardProps) {
  const metrics = [
    { ...revenue, icon: DollarSign },
    { ...orders, icon: ShoppingCart },
    { ...conversionRate, icon: Percent },
    { ...avgOrderValue, icon: TrendingUp },
  ]

  return (
    <Card className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M11 Business Performance</div>
          <div className="text-[16px] font-extrabold text-text">Chỉ số vận hành cốt lõi</div>
        </div>
        <Badge tone="neutral">{periodLabel}</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, idx) => {
          const Icon = m.icon
          return (
            <div
              key={idx}
              className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface-alt/40 p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{m.label}</span>
                <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                  <Icon size={14} />
                </div>
              </div>
              <div className="text-lg font-black text-text">{m.value}</div>
              <div
                className={`flex items-center gap-0.5 text-[11px] font-bold ${
                  m.isPositive ? "text-success" : "text-danger"
                }`}
              >
                <ArrowUpRight size={12} className={m.isPositive ? "" : "rotate-90"} />
                {m.changePercent > 0 ? `+${m.changePercent}%` : `${m.changePercent}%`} so với kỳ trước
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
