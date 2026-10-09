"use client"

import React from "react"
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"
import { COMING_SOON_LABEL } from "@/lib/feature-lock"
import type { JourneyDefinition } from "@/modules/journey/domain/journey-model"

interface FeaturedSpotlightCardProps {
  journey: JourneyDefinition
  onSelect: (journey: JourneyDefinition) => void
  disabled?: boolean
}

export function FeaturedSpotlightCard({
  journey,
  onSelect,
  disabled = false,
}: FeaturedSpotlightCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(journey)}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      title={disabled ? COMING_SOON_LABEL : undefined}
      className={`group relative w-full text-left p-5 sm:p-6 md:p-7 rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-surface-alt border-border"
          : "bg-surface border-primary/30 hover:border-primary hover:shadow-xl hover:-translate-y-0.5"
      }`}
    >
      {/* Lớp nền tinh tế và ánh sáng viền */}
      <div
        className="absolute inset-0 bg-selected/30 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-selected/60 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Khối nội dung chính bên trái */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-bg text-warning-text border border-warning text-caption font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{journey.badgeText || "Tính năng trọng tâm"}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-bg text-success text-caption font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span>Sẵn sàng phục vụ</span>
            </span>
          </div>

          <div>
            <h2 className="text-display md:text-display-lg font-extrabold text-text group-hover:text-primary transition-colors tracking-tight">
              {journey.goal}
            </h2>
            <p className="text-body text-text-muted mt-1.5 leading-relaxed max-w-2xl">
              {journey.description}
            </p>
          </div>

          {/* Ba điểm nổi bật của quy trình */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="flex items-center gap-2 text-body-sm font-medium text-text">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>Gửi link chọn mẫu qua Zalo</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm font-medium text-text">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>Khách tự chọn & gửi lời chúc</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm font-medium text-text">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>Tự động nhận đơn & điều phối</span>
            </div>
          </div>
        </div>

        {/* Khối Call-To-Action bên phải */}
        <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
          <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary group-hover:bg-primary-dark text-surface text-body-sm font-bold shadow-md group-hover:shadow-lg transition-all duration-200">
            <span>{disabled ? COMING_SOON_LABEL : "Mở Thẻ Chào & Tạo Link"}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </div>
          <span className="text-caption font-medium text-text-muted">
            Khuyên dùng mỗi ngày cho tiệm
          </span>
        </div>
      </div>
    </button>
  )
}
