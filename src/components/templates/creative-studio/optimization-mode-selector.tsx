"use client"

import React from "react"
import {
  Wand2,
  Sliders,
  Check,
  AlertCircle,
  Zap,
  SunMedium,
  Eraser,
  Layers,
  Maximize2,
  Type,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  OPTIMIZATION_CAPABILITIES,
  isCapabilitySupported,
  type OptimizationCapability,
} from "@/modules/media/domain/optimization-capabilities"

export interface OptimizationModeSelectorProps {
  mode: "auto" | "custom"
  onModeChange: (mode: "auto" | "custom") => void
  selectedCapabilities: string[]
  onCapabilitiesChange: (caps: string[]) => void
  selectedProvider: string
}

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  SunMedium,
  Eraser,
  Layers,
  Maximize2,
  Type,
}

export const OptimizationModeSelector: React.FC<OptimizationModeSelectorProps> = ({
  mode,
  onModeChange,
  selectedCapabilities,
  onCapabilitiesChange,
  selectedProvider,
}) => {
  const toggleCapability = (capId: string, supported: boolean) => {
    if (!supported) return
    if (selectedCapabilities.includes(capId)) {
      onCapabilitiesChange(selectedCapabilities.filter((id) => id !== capId))
    } else {
      onCapabilitiesChange([...selectedCapabilities, capId])
    }
  }

  const selectAllSupported = () => {
    const supportedIds = OPTIMIZATION_CAPABILITIES.filter((c) =>
      isCapabilitySupported(c, selectedProvider)
    ).map((c) => c.id)
    onCapabilitiesChange(supportedIds)
  }

  const clearAll = () => {
    onCapabilitiesChange([])
  }

  return (
    <div className="w-full flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-bold text-text flex items-center gap-1.5">
          <Sparkles size={15} className="text-primary" />
          Chế độ tối ưu hóa ảnh M04a:
        </label>
        <span className="text-[11px] text-text-muted">
          {mode === "auto" ? "AI tự động cấu hình chuẩn Marketing" : `${selectedCapabilities.length} năng lực đã chọn`}
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onModeChange("auto")}
          className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
            mode === "auto"
              ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
              : "border-border bg-surface hover:bg-surface-alt/60"
          }`}
        >
          <div
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
              mode === "auto" ? "bg-primary text-white" : "bg-surface-alt text-text-muted"
            }`}
          >
            <Wand2 size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-text">1. Tự động hoàn toàn</span>
              <Badge tone="accent" className="text-[10px] px-1.5 py-0">Khuyên dùng</Badge>
            </div>
            <p className="text-[11.5px] text-text-muted mt-0.5 leading-relaxed">
              1-Click Studio: Tự động tách nền studio, xóa watermark, cân bằng sáng và tăng nét cánh hoa đạt chuẩn bán hàng.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("custom")}
          className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
            mode === "custom"
              ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
              : "border-border bg-surface hover:bg-surface-alt/60"
          }`}
        >
          <div
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
              mode === "custom" ? "bg-primary text-white" : "bg-surface-alt text-text-muted"
            }`}
          >
            <Sliders size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-text">2. Tùy chọn độc lập</span>
              <Badge tone="neutral" className="text-[10px] px-1.5 py-0">Chuyên sâu</Badge>
            </div>
            <p className="text-[11.5px] text-text-muted mt-0.5 leading-relaxed">
              Tùy biến từng tác vụ: Chỉ chọn các năng lực bạn muốn hệ thống can thiệp trên ảnh (chỉ xóa watermark, v.v.).
            </p>
          </div>
        </button>
      </div>

      {/* Content for Auto Mode */}
      {mode === "auto" && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check size={14} strokeWidth={2.5} />
            </div>
            <span>
              Gói trọn gói bao gồm: <strong>Tách nền Studio</strong> • <strong>Xóa Watermark</strong> •{" "}
              <strong>Cân bằng sáng</strong> • <strong>Siêu phân giải</strong> • <strong>4 tỷ lệ chuẩn</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Content for Custom Mode */}
      {mode === "custom" && (
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11.5px] font-medium text-text-muted">
              Chọn các tác vụ bạn muốn thực thi:
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={selectAllSupported}
                className="text-primary hover:underline font-medium"
              >
                Chọn tất cả khả dụng
              </button>
              <span className="text-border">•</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-text-muted hover:text-text"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {OPTIMIZATION_CAPABILITIES.map((cap) => {
              const supported = isCapabilitySupported(cap, selectedProvider)
              const isSelected = selectedCapabilities.includes(cap.id) && supported
              const IconComp = ICON_MAP[cap.iconName] || Sparkles

              return (
                <div
                  key={cap.id}
                  onClick={() => toggleCapability(cap.id, supported)}
                  className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
                    !supported
                      ? "opacity-60 bg-surface-alt/40 border-dashed border-border cursor-not-allowed select-none"
                      : isSelected
                      ? "border-primary bg-primary/[0.04] shadow-2xs cursor-pointer hover:border-primary/80"
                      : "border-border bg-surface hover:bg-surface-alt/50 cursor-pointer"
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!supported}
                      onChange={() => toggleCapability(cap.id, supported)}
                      className="h-4 w-4 rounded accent-primary border-border cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[12.5px] font-bold ${supported ? "text-text" : "text-text-muted"}`}>
                        {cap.name}
                      </span>
                      {!supported && (
                        <Badge tone="warning" className="text-[9.5px] px-1 py-0 gap-1 flex items-center">
                          <AlertCircle size={10} /> Cần Cloud AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                      {cap.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${
                      !supported
                        ? "bg-surface-alt text-text-muted/60"
                        : isSelected
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-alt text-text-muted"
                    }`}
                  >
                    <IconComp size={15} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
