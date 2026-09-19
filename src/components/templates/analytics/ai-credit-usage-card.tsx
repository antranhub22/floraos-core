"use client"

import React from "react"
import { Cpu, ShieldCheck, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface AiCapabilityUsage {
  name: string
  callCount: number
  costEstimate: string
  percentage: number
}

export interface AiCreditUsageCardProps {
  usedTokens: number
  totalTokens: number
  costSpent: string
  budgetLimit: string
  capabilities: AiCapabilityUsage[]
}

/**
 * AiCreditUsageCard (Thẻ giám sát hạn ngạch & chi phí AI M11)
 */
export function AiCreditUsageCard({
  usedTokens,
  totalTokens,
  costSpent,
  budgetLimit,
  capabilities,
}: AiCreditUsageCardProps) {
  const percentUsed = Math.min(100, Math.round((usedTokens / totalTokens) * 100))

  return (
    <Card className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M11 Aegis AI Governance</div>
          <div className="text-[16px] font-extrabold text-text">Giám sát hạn mức AI tháng</div>
        </div>
        <Badge tone={percentUsed > 80 ? "warning" : "success"} className="gap-1">
          <ShieldCheck size={12} />
          {percentUsed > 80 ? "Cảnh báo hạn mức" : "Hạn ngạch an toàn"}
        </Badge>
      </div>

      <div className="rounded-xl bg-surface-alt/50 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text">
            Đã dùng: {usedTokens.toLocaleString()} / {totalTokens.toLocaleString()} Credits
          </span>
          <span className="font-bold text-primary">{percentUsed}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentUsed > 80 ? "bg-warning" : "bg-primary"
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-text-muted mt-1">
          <span>Chi phí thực tế: <strong className="text-text">{costSpent}</strong></span>
          <span>Trần ngân sách: <strong className="text-text">{budgetLimit}</strong></span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold text-text">Chi tiêu theo năng lực AI:</div>
        <div className="flex flex-col gap-1.5">
          {capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-alt/40 p-2.5 text-xs"
            >
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-text-muted" />
                <span className="font-medium text-text">{cap.name}</span>
              </div>
              <div className="flex items-center gap-3 text-text-muted">
                <span>{cap.callCount} lượt gọi</span>
                <span className="font-bold text-text">{cap.costEstimate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
