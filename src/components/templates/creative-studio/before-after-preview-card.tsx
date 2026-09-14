"use client"

import React, { useState } from "react"
import { Download, SlidersHorizontal, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface BeforeAfterPreviewCardProps {
  originalImageUrl: string
  enhancedImageUrl: string
  aspectRatio?: "1:1" | "4:5" | "9:16"
  title?: string
  presetName?: string
  onDownload?: () => void
  onApplyVariant?: () => void
}

/**
 * BeforeAfterPreviewCard (Thẻ so sánh ảnh gốc & tối ưu studio M04a)
 */
export function BeforeAfterPreviewCard({
  originalImageUrl,
  enhancedImageUrl,
  aspectRatio = "1:1",
  title = "So sánh hoàn thiện Studio",
  presetName = "Phòng khách tối giản",
  onDownload,
  onApplyVariant,
}: BeforeAfterPreviewCardProps) {
  const [activeTab, setActiveTab] = useState<"enhanced" | "original">("enhanced")

  return (
    <Card className="overflow-hidden border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M04a Studio Preview</div>
          <div className="text-[16px] font-extrabold text-text">{title}</div>
        </div>
        <Badge tone="success" className="gap-1">
          <Sparkles size={12} />
          {presetName}
        </Badge>
      </div>

      <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-xl border border-border bg-slate-900/5">
        <img
          src={activeTab === "enhanced" ? enhancedImageUrl : originalImageUrl}
          alt={activeTab === "enhanced" ? "Ảnh AI Studio" : "Ảnh gốc chụp xưởng"}
          className="h-full w-full object-cover transition-all duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-1 rounded-lg bg-black/60 p-1 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveTab("enhanced")}
            className={`rounded px-2.5 py-1 text-xs font-bold transition ${
              activeTab === "enhanced"
                ? "bg-primary text-white"
                : "text-white/70 hover:text-white"
            }`}
          >
            Đã tối ưu AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("original")}
            className={`rounded px-2.5 py-1 text-xs font-bold transition ${
              activeTab === "original"
                ? "bg-white/20 text-white"
                : "text-white/70 hover:text-white"
            }`}
          >
            Ảnh gốc
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-xs text-text-muted">Tỷ lệ: {aspectRatio} • Chuẩn HD</div>
        <div className="flex items-center gap-2">
          {onApplyVariant && (
            <Button variant="secondary" size="sm" onClick={onApplyVariant} className="gap-1.5">
              <SlidersHorizontal size={14} />
              Đổi bối cảnh
            </Button>
          )}
          {onDownload && (
            <Button size="sm" onClick={onDownload} className="gap-1.5">
              <Download size={14} />
              Tải ảnh
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
