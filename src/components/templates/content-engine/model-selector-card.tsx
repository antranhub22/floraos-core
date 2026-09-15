"use client"

import React from "react"
import { Cpu, Sparkles, Zap, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

export type AIContentProvider = "ollama" | "openai" | "gemini"

export interface AIModelOption {
  id: AIContentProvider
  name: string
  subtitle: string
  desc: string
  badge: string
  badgeTone: "success" | "accent" | "neutral"
  icon: React.ElementType
  latency: string
  cost: string
  highlight?: boolean
}

export const AI_CONTENT_MODELS: AIModelOption[] = [
  {
    id: "ollama",
    name: "Qwen 2.5 7B",
    subtitle: "Local Metal GPU (Apple M3)",
    desc: "Chạy hoàn toàn trên máy chủ nội bộ. Không tốn phí API token, dữ liệu bảo mật 100%, độc lập không cần internet.",
    badge: "Khuyên dùng · 0đ",
    badgeTone: "success",
    icon: Cpu,
    latency: "~4-8 giây",
    cost: "Miễn phí (0đ)",
    highlight: true,
  },
  {
    id: "openai",
    name: "OpenAI GPT-4o",
    subtitle: "Cloud API (OpenAI)",
    desc: "Mô hình ngôn ngữ hàng đầu thế giới. Văn phong sắc sảo, câu từ đắt giá, phù hợp chiến dịch truyền thông lớn và sự kiện cao cấp.",
    badge: "Cloud Cao cấp",
    badgeTone: "accent",
    icon: Sparkles,
    latency: "~3-5 giây",
    cost: "Theo OpenAI Token",
  },
  {
    id: "gemini",
    name: "Google Gemini Flash",
    subtitle: "Cloud API (Google AI Studio)",
    desc: "Công nghệ tiên tiến từ Google DeepMind. Tốc độ phản hồi cực nhanh, bắt trend tốt, kho từ vựng phong phú và tự nhiên.",
    badge: "Siêu tốc độ",
    badgeTone: "neutral",
    icon: Zap,
    latency: "~1-2 giây",
    cost: "Theo Google Cloud",
  },
]

export interface ModelSelectorCardProps {
  selectedProvider: AIContentProvider
  onSelectProvider: (provider: AIContentProvider) => void
  disabled?: boolean
  selectedChannelsCount?: number
  onGenerate?: () => void
}

/**
 * ModelSelectorCard - Thẻ lựa chọn Model AI sinh nội dung tiếp thị M07
 */
export function ModelSelectorCard({
  selectedProvider,
  onSelectProvider,
  disabled = false,
  selectedChannelsCount,
  onGenerate,
}: ModelSelectorCardProps) {
  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-text-muted">
            Bước 4: Chọn Cỗ máy AI (Model Engine)
          </div>
          <div className="text-[16px] font-extrabold text-text flex items-center gap-2">
            <span>Lựa chọn Model sinh nội dung tiếp thị</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
        </div>

        <div className="text-xs text-text-muted">
          Đang sử dụng:{" "}
          <strong className="text-primary font-bold">
            {AI_CONTENT_MODELS.find((m) => m.id === selectedProvider)?.name || selectedProvider}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {AI_CONTENT_MODELS.map((model) => {
          const isSelected = model.id === selectedProvider
          const Icon = model.icon

          return (
            <div
              key={model.id}
              onClick={() => !disabled && onSelectProvider(model.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 select-none relative ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                  : "border-border hover:border-text-muted bg-background opacity-85 hover:opacity-100"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* Header của Model Card */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      isSelected ? "bg-primary text-white" : "bg-muted text-text-muted"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-black text-text truncate">
                      {model.name}
                    </div>
                    <div className="text-[10.5px] text-text-muted truncate font-medium">
                      {model.subtitle}
                    </div>
                  </div>
                </div>

                <Badge tone={model.badgeTone} className="text-[10px] px-2 py-0.5 flex-shrink-0">
                  {model.badge}
                </Badge>
              </div>

              {/* Mô tả tính năng */}
              <p className="text-[11.5px] text-text-muted leading-relaxed line-clamp-3">
                {model.desc}
              </p>

              {/* Footer: Tốc độ & Chi phí */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                <span className="text-text-muted">
                  ⚡ <strong className="font-semibold text-text">{model.latency}</strong>
                </span>
                <span className={`font-bold ${isSelected ? "text-primary" : "text-text-muted"}`}>
                  {model.cost}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Thanh chốt hạ hành động sinh bài */}
      {onGenerate && (
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-text-muted">
            {(selectedChannelsCount ?? 0) === 0 ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                ⚠️ Vui lòng chọn ít nhất 1 kênh mạng xã hội ở Bước 3 để sinh bài viết.
              </span>
            ) : (
              <span>
                💡 Sẽ sử dụng <strong>{AI_CONTENT_MODELS.find((m) => m.id === selectedProvider)?.name}</strong> để tạo bài viết cho{" "}
                <strong>{selectedChannelsCount} kênh</strong> đã chọn.
              </span>
            )}
          </div>

          <Button
            size="default"
            onClick={onGenerate}
            disabled={disabled || (selectedChannelsCount ?? 0) === 0}
            className="w-full sm:w-auto gap-2 font-bold px-7 shadow-md whitespace-nowrap"
          >
            <Sparkles size={16} />
            {(selectedChannelsCount ?? 0) === 0
              ? "Chưa chọn kênh nào"
              : `Sinh bài bằng ${AI_CONTENT_MODELS.find((m) => m.id === selectedProvider)?.name}`}
          </Button>
        </div>
      )}
    </Card>
  )
}
