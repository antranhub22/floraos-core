"use client"

import React from "react"
import { AlertTriangle, Clock } from "lucide-react"
import { STEP_OWNER_LABEL, formatMinutes, type StepOwner } from "@/modules/greeting-card/domain/step-sla"
import type { TrackingPipelineItem } from "@/modules/greeting-card/domain/tracking-pipeline-types"

/** Khối trạng thái đầu thẻ: bước hiện tại (to nhất), đã ở bước này bao lâu, và cảnh báo kẹt. */
export function WorkStatus({ item, me, now, code }: { item: TrackingPipelineItem; me: StepOwner; now: number; code?: React.ReactNode }) {
  const waited = Math.max(0, Math.floor((now - Date.parse(item.stepStartedAt)) / 60_000))
  const mine = item.stuck?.owner === me
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-title-sm font-extrabold ${mine ? "text-danger" : "text-primary"}`}>{item.currentStepTitle}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-caption text-text-muted">
            <Clock size={12} aria-hidden="true" /> Ở bước này {formatMinutes(waited)}
          </p>
        </div>
        {code}
      </div>
      {item.stuck && (
        <div role={mine ? "alert" : undefined}
          className={`flex items-start gap-2 rounded-xl p-2.5 text-body-sm font-semibold ${mine ? "bg-danger-bg text-danger" : "bg-warning-bg text-warning"}`}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{mine ? "Cần bạn: " : `Đang chờ ${STEP_OWNER_LABEL[item.stuck.owner]}: `}{item.stuck.message}</span>
        </div>
      )}
    </div>
  )
}
