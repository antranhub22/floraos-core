"use client"

import React from "react"
import * as LucideIcons from "lucide-react"
import type { JourneyDefinition } from "@/modules/journey/domain/journey-model"

interface ActionCardProps {
  journey: JourneyDefinition
  onSelect: (journey: JourneyDefinition) => void
  disabled?: boolean
}

export function ActionCard({ journey, onSelect, disabled = false }: ActionCardProps) {
  // Trích xuất icon từ lucide-react an toàn
  const iconsMap = LucideIcons as unknown as Record<string, React.ElementType>
  const IconComponent = iconsMap[journey.icon] || LucideIcons.Sparkles

  const isCombo = journey.category === "COMBO"
  const isAi = journey.category === "AI_SUGGEST"

  return (
    <button
      type="button"
      onClick={() => onSelect(journey)}
      disabled={disabled}
      className={`group relative flex flex-col text-left p-4 rounded-xl border transition-all duration-200 ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-surface-alt border-border"
          : "bg-surface border-border hover:border-primary/50 hover:shadow-md cursor-pointer"
      }`}
    >
      <div className="flex items-start justify-between w-full mb-2.5">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
            isCombo
              ? "bg-selected text-primary group-hover:bg-primary group-hover:text-surface"
              : isAi
              ? "bg-info-bg text-info group-hover:bg-info group-hover:text-surface"
              : "bg-surface-alt text-primary group-hover:bg-primary group-hover:text-surface"
          }`}
        >
          <IconComponent className="w-5 h-5" aria-hidden="true" />
        </div>

        {journey.badgeText && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold ${
              isCombo
                ? "bg-warning-bg text-warning-text border border-warning"
                : isAi
                ? "bg-info-bg text-info border border-info"
                : "bg-surface-alt text-text-muted border border-border"
            }`}
          >
            {journey.badgeText}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1">
        <h3 className="text-title-sm font-bold text-text group-hover:text-primary transition-colors">
          {journey.goal}
        </h3>
        <p className="text-body-sm text-text-muted mt-1 leading-relaxed line-clamp-2">
          {journey.description}
        </p>
      </div>

      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-caption font-medium text-text-muted group-hover:text-primary">
        <span>
          {isCombo
            ? `${journey.steps.length} bước liền mạch`
            : isAi
            ? "Đề xuất thông minh"
            : "Bắt đầu ngay"}
        </span>
        <LucideIcons.ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  )
}
