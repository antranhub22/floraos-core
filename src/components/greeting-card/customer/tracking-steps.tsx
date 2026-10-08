"use client"

import React from "react"
import { BadgeCheck, Clock, Flower2, Gift, Truck } from "lucide-react"
import { TRACKING_STEP_COUNT } from "@/modules/greeting-card/domain/greeting-card-rules"

const STEPS = [
  { label: "Tiếp nhận", icon: Clock },
  { label: "Xác nhận", icon: BadgeCheck },
  { label: "Cắm hoa", icon: Gift },
  { label: "Đang giao", icon: Truck },
  { label: "Hoàn tất", icon: Flower2 },
] as const

function clock(iso: string): string {
  const dt = new Date(iso)
  return Number.isNaN(dt.getTime()) ? "" : `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
}

/**
 * Dải 5 bước trên trang theo dõi (Spec #12): Tiếp nhận hiện giờ thực tế; Cắm hoa và Đang giao
 * hiện khoảng thời gian dự kiến theo lịch giao.
 */
export function TrackingSteps({
  stepIndex,
  createdAt,
  timeline,
}: {
  /** 1–5; -1 = đơn đã huỷ (không bước nào sáng) */
  stepIndex: number
  createdAt: string
  timeline?: { arranging?: { displayRange: string }; delivering?: { displayRange: string } } | null | undefined
}) {
  // "17:30 - 19:30" → "17:30–19:30": gọn để nằm trên một dòng trong cột hẹp
  const range = (r: string | undefined) => (r ?? "").replace(/\s*-\s*/g, "–")
  const timeLabels = [clock(createdAt), "", range(timeline?.arranging?.displayRange), range(timeline?.delivering?.displayRange), ""]
  return (
    <ol className="grid grid-cols-5 gap-1 sm:gap-2 mt-2">
      {STEPS.map((s, idx) => {
        const Icon = s.icon
        const step = idx + 1
        const isCompleted = stepIndex > step || stepIndex === TRACKING_STEP_COUNT
        const isCurrent = stepIndex === step && stepIndex !== TRACKING_STEP_COUNT
        return (
          <li key={s.label} className="flex flex-col items-center gap-1 text-center" aria-current={isCurrent ? "step" : undefined}>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isCompleted
                  ? "bg-success text-white"
                  : isCurrent
                  ? "bg-primary text-white shadow-sm ring-4 ring-primary/20"
                  : "bg-surface-muted text-text-muted border border-border"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
            </div>
            <span className={`text-caption font-bold leading-tight whitespace-nowrap ${isCurrent ? "text-primary" : isCompleted ? "text-success" : "text-text-muted"}`}>
              {s.label}
            </span>
            {timeLabels[idx] && <span className="text-caption font-medium text-text-muted leading-tight tracking-tight whitespace-nowrap">{timeLabels[idx]}</span>}
          </li>
        )
      })}
    </ol>
  )
}
