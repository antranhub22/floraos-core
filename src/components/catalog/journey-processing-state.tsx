"use client"

import React from "react"
import { Loader2, CheckCircle2, Circle } from "lucide-react"

export interface ProcessingStep {
  id: string
  label: string
  status: "pending" | "running" | "done" | "skipped"
}

interface JourneyProcessingStateProps {
  title?: string
  steps: ProcessingStep[]
}

export function JourneyProcessingState({
  title = "AI đang xử lý...",
  steps,
}: JourneyProcessingStateProps) {
  const doneCount = steps.filter((s) => s.status === "done").length
  const total = steps.filter((s) => s.status !== "skipped").length
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return (
    <div className="rounded-2xl border border-primary-border bg-surface p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary-muted flex items-center justify-center shrink-0">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-body font-bold text-text">⚡ {title}</div>
          <div className="text-caption text-text-muted mt-0.5">
            Bạn có thể kiểm tra và chỉnh sửa kết quả sau khi AI hoàn thành.
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-caption text-text-muted">
          <span>Tiến độ</span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.status === "done" && (
              <CheckCircle2 className="h-4.5 w-4.5 text-success shrink-0" />
            )}
            {step.status === "running" && (
              <Loader2 className="h-4.5 w-4.5 text-primary animate-spin shrink-0" />
            )}
            {step.status === "pending" && (
              <Circle className="h-4.5 w-4.5 text-text-muted/40 shrink-0" />
            )}
            {step.status === "skipped" && (
              <Circle className="h-4.5 w-4.5 text-text-muted/20 shrink-0" />
            )}
            <span
              className={`text-body-sm ${
                step.status === "done"
                  ? "text-text font-semibold"
                  : step.status === "running"
                    ? "text-primary font-bold"
                    : step.status === "skipped"
                      ? "text-text-muted/40 line-through"
                      : "text-text-muted"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
