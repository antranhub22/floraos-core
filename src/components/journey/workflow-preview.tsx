"use client"

import React, { useState } from "react"
import { Play, Check, ChevronRight, X } from "lucide-react"
import type { JourneyDefinition } from "@/modules/journey/domain/journey-model"

interface WorkflowPreviewProps {
  journey: JourneyDefinition
  onStartWorkflow: (excludedStepIds: string[]) => void
  onCancel: () => void
}

export function WorkflowPreview({
  journey,
  onStartWorkflow,
  onCancel,
}: WorkflowPreviewProps) {
  const [excludedStepIds, setExcludedStepIds] = useState<string[]>([])

  const toggleStep = (stepId: string, isOptional: boolean) => {
    if (!isOptional) return // Không thể bỏ chọn bước bắt buộc
    setExcludedStepIds((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    )
  }

  const handleStart = () => {
    onStartWorkflow(excludedStepIds)
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-5 sm:p-6 rounded-2xl border border-border bg-surface shadow-md space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-border">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold bg-selected text-primary mb-2">
            XEM TRƯỚC QUY TRÌNH
          </span>
          <h2 className="text-title font-extrabold text-text">
            {journey.goal}
          </h2>
          <p className="text-body-sm text-text-muted mt-1">
            {journey.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg text-text-muted hover:bg-surface-alt transition-colors cursor-pointer"
          title="Đóng xem trước"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Step Pipeline List */}
      <div className="space-y-3">
        <h3 className="text-body-sm font-bold text-text">
          Các bước trong quy trình ({journey.steps.length - excludedStepIds.length} / {journey.steps.length} bước kích hoạt)
        </h3>

        <div className="space-y-2">
          {journey.steps.map((step, idx) => {
            const isExcluded = excludedStepIds.includes(step.id)

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  isExcluded
                    ? "bg-surface-alt/60 border-border opacity-50"
                    : "bg-surface border-border hover:border-primary/40 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-selected text-primary text-caption font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-body-sm font-bold text-text">
                      {step.label}
                    </h4>
                    {step.description && (
                      <p className="text-caption text-text-muted mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {step.isOptional ? (
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id, true)}
                      className={`px-2.5 py-1 rounded-md text-caption font-semibold transition-colors cursor-pointer ${
                        isExcluded
                          ? "bg-surface-alt border border-border text-text-muted"
                          : "bg-selected text-primary border border-primary/30"
                      }`}
                    >
                      {isExcluded ? "Đã tắt" : "Tùy chọn (Bật)"}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-caption text-text-muted font-medium px-2 py-0.5 rounded bg-surface-alt">
                      <Check className="w-3 h-3 text-success" aria-hidden="true" />
                      Bắt buộc
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-body-sm font-medium text-text hover:bg-surface-alt transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={handleStart}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-surface text-body-sm font-bold hover:bg-primary-dark transition-colors shadow-xs cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" aria-hidden="true" />
          <span>Bắt đầu quy trình ngay</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
