"use client"

import React from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export interface NextActionItem {
  id: string
  label: string
  description?: string
  onClick: () => void
  isPrimary?: boolean
}

interface NextActionsProps {
  title?: string
  subtitle?: string
  actions: NextActionItem[]
}

export function NextActions({
  title = "Việc bạn có thể làm tiếp theo",
  subtitle = "Hành trình trước đã hoàn thành. Hãy chọn bước tiếp để duy trì mạch công việc",
  actions,
}: NextActionsProps) {
  if (!actions || actions.length === 0) return null

  return (
    <div className="w-full p-4 sm:p-5 rounded-xl border border-border bg-surface shadow-xs space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success-bg text-success mt-0.5">
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-title-sm font-bold text-text">
            {title}
          </h3>
          <p className="text-body-sm text-text-muted mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
        {actions.map((act) => (
          <button
            key={act.id}
            type="button"
            onClick={act.onClick}
            className={`flex flex-col text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
              act.isPrimary
                ? "bg-selected text-primary border-primary hover:bg-surface-alt font-semibold"
                : "bg-surface border-border text-text hover:bg-surface-alt hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-body-sm font-bold">
                {act.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-primary ml-2 flex-shrink-0" aria-hidden="true" />
            </div>
            {act.description && (
              <span className="text-caption text-text-muted mt-1 leading-snug">
                {act.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
