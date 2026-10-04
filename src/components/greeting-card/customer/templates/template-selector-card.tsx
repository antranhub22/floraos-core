"use client"

import React from "react"
import {
  Check, Sparkles, Layers, LayoutGrid, Smartphone,
  BookOpen, Play, Zap, Palette, ZoomIn,
} from "lucide-react"
import {
  GreetingTemplateId,
  GREETING_TEMPLATE_LIST,
} from "@/modules/greeting-card/domain/greeting-template-registry"

interface TemplateSelectorCardProps {
  selectedTemplateId: GreetingTemplateId
  onSelectTemplate: (templateId: GreetingTemplateId) => void
}

export function TemplateSelectorCard({
  selectedTemplateId,
  onSelectTemplate,
}: TemplateSelectorCardProps) {
  function getIcon(id: GreetingTemplateId) {
    if (id === "enterprise-luxury") return <Sparkles size={18} className="text-accent" />
    if (id === "swipe-classic") return <Smartphone size={18} className="text-primary" />
    if (id === "lookbook-grid") return <LayoutGrid size={18} className="text-info" />
    if (id === "editorial-story") return <BookOpen size={18} className="text-primary" />
    if (id === "video-reels") return <Play size={18} className="text-danger" />
    if (id === "occasion-budget-quiz") return <Zap size={18} className="text-warning" />
    if (id === "event-moodboard") return <Palette size={18} className="text-accent" />
    return <ZoomIn size={18} className="text-success" />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-body-sm font-extrabold text-foreground flex items-center gap-1.5">
            <Layers size={15} className="text-primary" />
            <span>Chọn Mẫu Template Trải Nghiệm Khách Hàng ({GREETING_TEMPLATE_LIST.length} mẫu)</span>
          </label>
          <p className="text-caption text-text-muted mt-0.5">
            Chọn cách khách hàng tương tác và lướt xem bộ sưu tập hoa trên link chào
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {GREETING_TEMPLATE_LIST.map((tpl) => {
          const isSelected = selectedTemplateId === tpl.id

          return (
            <button
              type="button"
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl.id)}
              className={`relative rounded-2xl border p-4 text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? "border-primary bg-selected/60 ring-2 ring-primary/20 shadow-sm"
                  : "border-border bg-surface hover:border-border-focus hover:shadow-xs"
              }`}
            >
              <div className="w-full">
                {/* Header with Icon and Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0 shadow-2xs">
                    {getIcon(tpl.id)}
                  </div>
                  <span
                    className={`text-caption font-extrabold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-surface-muted text-text-muted"
                    }`}
                  >
                    {tpl.badge}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <h4 className="text-body-sm font-extrabold text-foreground">{tpl.name}</h4>
                <p className="text-caption text-primary font-medium mt-0.5">{tpl.subtitle}</p>
                <p className="text-caption text-text-muted mt-2 line-clamp-3 leading-relaxed">
                  {tpl.description}
                </p>

                {/* Features preview */}
                <div className="mt-3 pt-3 border-t border-border/70 space-y-1.5">
                  {tpl.features.slice(0, 3).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-caption text-text-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection Indicator button */}
              <div className="mt-4 pt-2 w-full">
                <div
                  className={`w-full py-1.5 rounded-xl text-caption font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    isSelected
                      ? "bg-primary text-white shadow-xs"
                      : "bg-surface-muted text-text-muted hover:text-foreground"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check size={14} />
                      <span>Đang chọn mẫu này</span>
                    </>
                  ) : (
                    <span>Chọn mẫu này</span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
