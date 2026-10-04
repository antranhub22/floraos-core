"use client"

import React from "react"
import {
  ExternalLink,
  Eye,
  FileEdit,
  CreditCard,
  CheckCircle2,
  Flower2,
  Camera,
  Truck,
  PartyPopper,
  MessageSquare,
} from "lucide-react"
import type { TrackingPipelineStepId, TrackingStepState } from "@/modules/greeting-card/domain/tracking-pipeline-types"

interface TrackingStepperViewProps {
  steps: TrackingStepState[]
  currentStepId: TrackingPipelineStepId
  onSelectStepNote?: (stepId: TrackingPipelineStepId) => void
}

function getStepIcon(stepId: TrackingPipelineStepId, size = 14) {
  switch (stepId) {
    case "STEP_1_OPENED":
      return <ExternalLink size={size} />
    case "STEP_2_CHOOSING":
      return <Eye size={size} />
    case "STEP_3_FILLING_FORM":
      return <FileEdit size={size} />
    case "STEP_4_PAYMENT_PENDING":
      return <CreditCard size={size} />
    case "STEP_5_PAYMENT_CONFIRMED":
      return <CheckCircle2 size={size} />
    case "STEP_6_ARRANGING":
      return <Flower2 size={size} />
    case "STEP_7_READY_QC":
      return <Camera size={size} />
    case "STEP_8_DELIVERING":
      return <Truck size={size} />
    case "STEP_9_COMPLETED":
      return <PartyPopper size={size} />
  }
}

export function TrackingStepperView({
  steps,
  currentStepId,
  onSelectStepNote,
}: TrackingStepperViewProps) {
  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex items-center min-w-[760px] relative">
        {steps.map((step, idx) => {
          const isCompleted = step.status === "completed"
          const isCurrent = step.status === "current"
          const isPending = step.status === "pending"
          const isLast = idx === steps.length - 1

          return (
            <React.Fragment key={step.id}>
              {/* Step Item */}
              <div className="flex flex-col items-center relative group flex-1">
                {/* Node Button */}
                <button
                  type="button"
                  onClick={() => onSelectStepNote?.(step.id)}
                  title={`${step.title} (${step.roleResponsible}) — Nhấp để xem/thêm ghi chú nội bộ`}
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-success text-white shadow-xs hover:scale-105"
                      : isCurrent
                      ? "bg-primary text-white ring-4 ring-primary/20 shadow-sm animate-pulse"
                      : "bg-surface border border-border text-text-muted hover:border-primary/50"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : getStepIcon(step.id, 16)}

                  {/* Badge số tin nhắn nội bộ gắn với bước này */}
                  {step.noteCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-warning text-foreground text-caption font-extrabold flex items-center justify-center shadow-xs">
                      {step.noteCount}
                    </span>
                  )}
                </button>

                {/* Step Info */}
                <div className="flex flex-col items-center text-center mt-2 px-1 max-w-[90px]">
                  <span
                    className={`text-caption font-bold leading-tight line-clamp-1 ${
                      isCurrent
                        ? "text-primary underline decoration-primary underline-offset-2"
                        : isCompleted
                        ? "text-foreground"
                        : "text-text-muted"
                    }`}
                  >
                    {step.shortTitle}
                  </span>
                  <span className="text-caption text-text-muted mt-0.5 line-clamp-1">
                    {step.roleResponsible.split("/")[0]}
                  </span>

                  {/* Gợi ý mở note */}
                  <button
                    type="button"
                    onClick={() => onSelectStepNote?.(step.id)}
                    className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-0.5 text-caption text-primary hover:underline"
                  >
                    <MessageSquare size={10} />
                    <span>Lưu ý</span>
                  </button>
                </div>
              </div>

              {/* Connector line between steps */}
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 mx-1 mb-8 transition-colors ${
                    isCompleted ? "bg-success" : "bg-border"
                  }`}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
