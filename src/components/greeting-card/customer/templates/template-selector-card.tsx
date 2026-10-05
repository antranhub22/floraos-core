"use client"

import React, { useState } from "react"
import {
  Check, Layers, LayoutGrid, Smartphone,
  BookOpen, Play, Zap, Palette, ZoomIn, Film, Heart,
  Leaf, Store, Sun, Camera, Home, PenTool, Sparkles, Eye,
} from "lucide-react"
import {
  GreetingTemplateId,
  GREETING_TEMPLATE_LIST,
} from "@/modules/greeting-card/domain/greeting-template-registry"
import { StylePreviewThumb } from "./template-style-preview-thumb"
import { TemplatePreviewModal } from "./template-preview-modal"

import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"

interface TemplateSelectorCardProps {
  selectedTemplateId: GreetingTemplateId
  onSelectTemplate: (templateId: GreetingTemplateId) => void
  catalogId?: string | undefined
  previewProducts?: GreetingCatalogProduct[] | undefined
}

function getIcon(id: GreetingTemplateId) {
  if (id === "editorial-luxury" || id === "enterprise-luxury") return <Sparkles size={15} />
  if (id === "minimal-clean" || id === "swipe-classic") return <Smartphone size={15} />
  if (id === "cinematic-dark") return <Film size={15} />
  if (id === "romantic-pastel") return <Heart size={15} />
  if (id === "botanical-frame") return <Leaf size={15} />
  if (id === "glassmorphism") return <Layers size={15} />
  if (id === "real-life-shop") return <Store size={15} />
  if (id === "real-life-daylight") return <Sun size={15} />
  if (id === "real-life-in-store") return <Store size={15} />
  if (id === "real-life-handheld") return <Camera size={15} />
  if (id === "lifestyle-context") return <Home size={15} />
  if (id === "mixed-media") return <PenTool size={15} />
  if (id === "lookbook-grid") return <LayoutGrid size={15} />
  if (id === "editorial-story") return <BookOpen size={15} />
  if (id === "video-reels") return <Play size={15} />
  if (id === "occasion-budget-quiz") return <Zap size={15} />
  if (id === "event-moodboard") return <Palette size={15} />
  return <ZoomIn size={15} />
}

// Map styleNumber → badge accent color (matching style identity)
const STYLE_ACCENT: Record<string, string> = {
  "01": "#c8a87a",
  "02": "#555",
  "03": "#c8a050",
  "04": "#d81b60",
  "05": "#5c7a3e",
  "06": "#5090e8",
  "07": "#e8a030",
  "08": "#8a7060",
  "09": "#e09820",
  "10": "#aaa",
  "11": "#7a6040",
  "12": "#c0b080",
}

export function TemplateSelectorCard({
  selectedTemplateId,
  onSelectTemplate,
  catalogId,
  previewProducts,
}: TemplateSelectorCardProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "swipe-style" | "interactive-deck">("all")
  const [previewTemplate, setPreviewTemplate] = useState<{
    id: GreetingTemplateId
    styleNumber?: string | undefined
    name: string
    subtitle?: string | undefined
  } | null>(null)

  const swipeStyles = GREETING_TEMPLATE_LIST.filter((t) => t.category === "swipe-style" && t.styleNumber)
  const auxDecks = GREETING_TEMPLATE_LIST.filter((t) => t.category !== "swipe-style" || !t.styleNumber)
  const allList = GREETING_TEMPLATE_LIST

  const displayedSwipe = activeFilter !== "interactive-deck" ? swipeStyles : []
  const displayedAux = activeFilter !== "swipe-style" ? auxDecks : []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="text-body-sm font-extrabold text-foreground flex items-center gap-1.5">
            <Layers size={15} className="text-primary" />
            <span>Chọn Template Trải Nghiệm ({allList.length} mẫu)</span>
          </label>
          <p className="text-caption text-text-muted mt-0.5">
            12 phong cách vuốt thẻ độc bản · Bấm &quot;Xem thử&quot; để trải nghiệm trước hoặc bấm chọn mẫu
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-surface-muted rounded-xl self-start sm:self-auto shrink-0">
          {([
            ["all", "Tất cả"],
            ["swipe-style", "12 Vuốt Thẻ"],
            ["interactive-deck", "Bổ Trợ"],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setActiveFilter(val)}
              className={`px-2.5 py-1 rounded-lg text-caption font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeFilter === val
                  ? "bg-surface text-foreground shadow-2xs"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION A: 12 Swipe Styles ── */}
      {displayedSwipe.length > 0 && (
        <div className="space-y-2">
          {activeFilter === "all" && (
            <p className="text-caption font-bold text-text-muted uppercase tracking-wider px-0.5">
              12 Phong Cách Vuốt Thẻ
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {displayedSwipe.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id
              const accent = STYLE_ACCENT[tpl.styleNumber ?? ""] ?? "#888"

              return (
                <div
                  key={tpl.id}
                  className={`relative rounded-2xl border text-left transition-all duration-200 overflow-hidden group flex flex-col ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 shadow-sm"
                      : "border-border bg-surface hover:border-primary/40 hover:shadow-sm"
                  }`}
                >
                  {/* Style number badge */}
                  <div
                    className="absolute top-2 left-2 z-10 text-caption font-bold font-mono px-1.5 py-0.5 rounded-md pointer-events-none"
                    style={{
                      background: isSelected ? accent : "rgba(0,0,0,0.55)",
                      color: "#fff",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    #{tpl.styleNumber}
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-xs pointer-events-none">
                      <Check size={11} className="text-white" />
                    </div>
                  )}

                  {/* Preview thumbnail – StylePreviewThumb is absolute+inset-0 so it
                      must be a direct child of a `position:relative` container */}
                  <div className="w-full aspect-[3/4] relative overflow-hidden rounded-t-2xl bg-surface-muted">
                    {tpl.styleNumber ? (
                      <StylePreviewThumb styleNumber={tpl.styleNumber} fillParent />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-text-muted opacity-40">{getIcon(tpl.id)}</span>
                      </div>
                    )}
                    {/* Subtle bottom gradient only behind text for legibility, keeping 75% of thumbnail crystal clear */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                    {/* Prominent Eye Preview Button on the card */}
                    <div className="absolute inset-0 flex items-center justify-center p-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewTemplate({
                            id: tpl.id,
                            styleNumber: tpl.styleNumber,
                            name: tpl.name,
                            subtitle: tpl.subtitle,
                          })
                        }}
                        className="px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-caption font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer transition-transform hover:scale-105"
                      >
                        <Eye size={13} className="text-primary" />
                        <span>Xem thử</span>
                      </button>
                    </div>

                    {/* Name overlay at bottom of thumbnail */}
                    <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-6 pointer-events-none">
                      <p className="text-caption font-bold leading-tight drop-shadow-sm" style={{ color: "#fff" }}>
                        {tpl.name}
                      </p>
                      <p className="text-caption leading-tight mt-0.5 drop-shadow-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                        {tpl.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Bottom action bar */}
                  <div className="p-1.5 bg-surface border-t border-border flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewTemplate({
                          id: tpl.id,
                          styleNumber: tpl.styleNumber,
                          name: tpl.name,
                          subtitle: tpl.subtitle,
                        })
                      }
                      title="Xem trước mẫu"
                      className="px-2 py-1 rounded-lg text-caption font-semibold text-text-muted hover:text-foreground hover:bg-surface-muted transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span className="hidden xs:inline">Xem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTemplate(tpl.id)}
                      className={`flex-1 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-surface-muted hover:bg-primary/10 text-foreground hover:text-primary"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check size={11} className="text-white" />
                          <span>Đang chọn</span>
                        </>
                      ) : (
                        <span>Chọn mẫu</span>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SECTION B: Auxiliary / Exploratory Decks ── */}
      {displayedAux.length > 0 && (
        <div className="space-y-2">
          {activeFilter === "all" && (
            <p className="text-caption font-bold text-text-muted uppercase tracking-wider px-0.5 pt-1">
              Chế Độ Xem Bổ Trợ
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {displayedAux.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id
              return (
                <div
                  key={tpl.id}
                  className={`relative rounded-xl border p-2.5 text-left transition-all duration-150 flex items-center gap-2.5 ${
                    isSelected
                      ? "border-primary bg-selected/50 ring-2 ring-primary/15"
                      : "border-border bg-surface hover:border-border-focus hover:shadow-xs"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-primary/15 text-primary" : "bg-surface-muted text-text-muted"
                    }`}
                  >
                    {getIcon(tpl.id)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-body-sm font-bold text-foreground truncate">{tpl.name}</h4>
                      {isSelected && <Check size={12} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-caption text-text-muted truncate">{tpl.subtitle}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewTemplate({
                          id: tpl.id,
                          name: tpl.name,
                          subtitle: tpl.subtitle,
                        })
                      }
                      title="Xem trước"
                      className="p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-muted cursor-pointer transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTemplate(tpl.id)}
                      className={`text-caption font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-surface-muted hover:bg-primary/10 text-text-muted hover:text-primary"
                      }`}
                    >
                      {isSelected ? "Đang chọn" : "Chọn"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewTemplate && (
        <TemplatePreviewModal
          templateId={previewTemplate.id}
          styleNumber={previewTemplate.styleNumber}
          templateName={previewTemplate.name}
          templateSubtitle={previewTemplate.subtitle}
          catalogId={catalogId}
          previewProducts={previewProducts}
          onClose={() => setPreviewTemplate(null)}
          onSelect={onSelectTemplate}
          isSelected={selectedTemplateId === previewTemplate.id}
        />
      )}
    </div>
  )
}
