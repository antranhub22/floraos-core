"use client"

import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function FlowTopBar({
  title,
  step,
  totalSteps,
  onBack,
}: {
  title: string
  step: number
  totalSteps: number
  onBack?: () => void
}) {
  return (
    <div className="flex flex-shrink-0 flex-col border-b border-border bg-surface">
      <div className="flex items-center gap-2.5 p-2.5">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text hover:bg-surface-alt disabled:opacity-0"
          aria-label="Quay lại"
        >
          <ArrowLeft size={19} strokeWidth={2} />
        </button>
        <div className="text-base font-bold">{title}</div>
      </div>
      <div className="flex gap-1.5 px-[18px] pb-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 rounded-full", i < step ? "bg-primary" : "bg-border")}
          />
        ))}
      </div>
    </div>
  )
}
