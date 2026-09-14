"use client"

import React, { useState, useEffect } from "react"
import { Download, SlidersHorizontal, Sparkles, Camera, Coffee, Image as ImageIcon, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface BeforeAfterPreviewCardProps {
  originalImageUrl?: string | null | undefined
  enhancedImageUrl?: string | null | undefined
  variantUrls?: {
    studio?: string | null
    lifestyle?: string | null
    bokeh?: string | null
  } | undefined
  variantRatioUrls?: Record<string, Record<string, string>> | undefined
  aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9" | undefined
  availableRatios?: string[] | undefined
  onRatioChange?: ((ratio: "1:1" | "4:5" | "9:16" | "16:9") => void) | undefined
  title?: string | undefined
  presetName?: string | undefined
  presetTone?: "success" | "warning" | "danger" | "neutral" | undefined
  isRejected?: boolean | undefined
  onDownload?: (() => void) | undefined
  onApplyVariant?: (() => void) | undefined
  onSelectVariant?: ((variant: "studio" | "lifestyle" | "bokeh") => void) | undefined
}

export type PreviewMode = "studio" | "lifestyle" | "bokeh" | "original"

/**
 * BeforeAfterPreviewCard (Thẻ so sánh ảnh gốc & trực quan 3 phương án tối ưu M04a)
 */
export function BeforeAfterPreviewCard({
  originalImageUrl,
  enhancedImageUrl,
  variantUrls,
  variantRatioUrls,
  aspectRatio = "1:1",
  availableRatios = ["1:1", "4:5", "9:16", "16:9"],
  onRatioChange,
  title = "So sánh hoàn thiện Studio",
  presetName = "Identity Guard Đạt chuẩn",
  presetTone,
  isRejected = false,
  onDownload,
  onApplyVariant,
  onSelectVariant,
}: BeforeAfterPreviewCardProps) {
  const hasVariants = Boolean(
    variantUrls && (variantUrls.studio || variantUrls.lifestyle || variantUrls.bokeh)
  )

  const [activeMode, setActiveMode] = useState<PreviewMode>(
    isRejected ? "original" : "studio"
  )

  useEffect(() => {
    if (isRejected) {
      setActiveMode("original")
    } else if (hasVariants) {
      setActiveMode("studio")
    }
  }, [isRejected, hasVariants])

  // Xác định URL ảnh tương ứng với chế độ và tỷ lệ đang chọn
  const getCurrentImage = () => {
    if (activeMode === "original") {
      return originalImageUrl
    }
    // Ưu tiên cao nhất: Bản Smart Reframe chuẩn theo biến thể & tỷ lệ (P1, P2, P3)
    if (variantRatioUrls?.[activeMode]?.[aspectRatio]) {
      return variantRatioUrls[activeMode][aspectRatio]
    }
    if (activeMode === "studio") {
      return variantUrls?.studio || enhancedImageUrl
    }
    if (activeMode === "lifestyle") {
      return variantUrls?.lifestyle || originalImageUrl
    }
    if (activeMode === "bokeh") {
      return variantUrls?.bokeh || enhancedImageUrl
    }
    return enhancedImageUrl || originalImageUrl
  }

  const currentImage = getCurrentImage()
  const badgeTone = presetTone || (isRejected ? "danger" : "success")

  const ratioContainerStyle = {
    "1:1": "aspect-[1/1] max-w-md",
    "4:5": "aspect-[4/5] max-w-[360px]",
    "9:16": "aspect-[9/16] max-w-[280px]",
    "16:9": "aspect-[16/9] max-w-xl",
  }[aspectRatio] || "aspect-[1/1] max-w-md"

  // Mô tả nhanh từng phương án để người dùng dễ quan sát bằng mắt
  const VARIANT_DESCRIPTIONS: Record<PreviewMode, { title: string; desc: string; icon: React.ElementType }> = {
    studio: {
      title: "P.Án 1: Studio Cao Cấp",
      desc: "Light Wrap 3px tràn sáng viền hoa, làm mềm viền quang học 1.2px và đổ bóng tiếp xúc 2 tầng.",
      icon: Sparkles,
    },
    lifestyle: {
      title: "P.Án 2: Ảnh Mộc Chân Thực",
      desc: "Giữ 100% rèm cửa và ánh sáng phòng gốc, xóa sạch 100% con dấu và chữ ký. Tự nhiên tuyệt đối.",
      icon: Camera,
    },
    bokeh: {
      title: "P.Án 3: Không Gian Bokeh",
      desc: "Xóa phông tiệm hoa f/1.8 với đốm sáng bokeh ấm áp, ánh sáng xiên nghệ thuật.",
      icon: Coffee,
    },
    original: {
      title: "Ảnh Gốc Chụp Xưởng",
      desc: "Ảnh ban đầu chưa qua xử lý, còn nguyên tem nhãn, hotline và chữ ký.",
      icon: ImageIcon,
    },
  }

  const currentVariantInfo = VARIANT_DESCRIPTIONS[activeMode]
  const VariantIcon = currentVariantInfo.icon

  return (
    <Card className="overflow-hidden border border-border bg-card p-5 shadow-sm flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M04a Studio Preview</div>
          <div className="text-[16px] font-extrabold text-text">{title}</div>
        </div>
        <Badge tone={badgeTone} className="gap-1">
          <Sparkles size={12} />
          {presetName}
        </Badge>
      </div>

      {/* Thanh chọn trực quan 4 Tab so sánh bằng mắt - Luôn hiển thị đầy đủ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-border">
        <button
          type="button"
          onClick={() => {
            setActiveMode("studio")
            onSelectVariant?.("studio")
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
            activeMode === "studio"
              ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 shadow"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Sparkles size={13} className="text-red-500" />
          ✨ P1: Studio
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveMode("lifestyle")
            onSelectVariant?.("lifestyle")
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
            activeMode === "lifestyle"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 shadow"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Camera size={13} className="text-emerald-500" />
          🌿 P2: Ảnh Mộc
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveMode("bokeh")
            onSelectVariant?.("bokeh")
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
            activeMode === "bokeh"
              ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 shadow"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Coffee size={13} className="text-amber-500" />
          ☕ P3: Bokeh
        </button>
        <button
          type="button"
          onClick={() => setActiveMode("original")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
            activeMode === "original"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <ImageIcon size={13} className="text-slate-500" />
          📷 Ảnh Gốc
        </button>
      </div>

      {/* Chú giải nhanh phương án đang xem */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-xs">
        <VariantIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
        <span className="font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">
          {currentVariantInfo.title}:
        </span>
        <span className="text-slate-600 dark:text-slate-400 leading-tight">
          {currentVariantInfo.desc}
        </span>
      </div>

      {/* Vùng hiển thị ảnh */}
      <div className={`relative ${ratioContainerStyle} w-full mx-auto overflow-hidden rounded-xl border border-border bg-slate-900/5 flex items-center justify-center transition-all duration-300 shadow-inner`}>
        {currentImage ? (
          <img
            key={`${activeMode}-${aspectRatio}-${currentImage}`}
            src={currentImage}
            alt={currentVariantInfo.title}
            className={`h-full w-full ${activeMode === "original" ? "object-contain bg-slate-950/10" : "object-cover"} transition-all duration-300`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-text-muted">
            {isRejected ? (
              <>
                <Sparkles size={32} className="text-danger opacity-60" />
                <span className="text-xs font-bold text-danger">Ảnh AI bị từ chối — Chuyển sang xem "Ảnh gốc"</span>
              </>
            ) : (
              <>
                <Sparkles size={32} className="opacity-40" />
                <span className="text-xs">Đang nạp ảnh xem trước...</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Selector tỷ lệ Smart Reframe nếu có */}
      {availableRatios.length > 0 && onRatioChange && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="text-xs font-medium text-text-muted">Tỷ lệ:</span>
          <div className="flex gap-1">
            {(["1:1", "4:5", "9:16", "16:9"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRatioChange(r)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                  aspectRatio === r
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-text-muted hover:border-text-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-xs text-text-muted">
          Đang xem: <strong className="text-text font-semibold">{currentVariantInfo.title}</strong> • Tỷ lệ: {aspectRatio}
        </div>
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
              Tải ảnh ({aspectRatio})
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

