"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Cpu, Cloud, Zap } from "lucide-react"
import { optimizationPriceKey } from "@/modules/media/domain/optimization-rules"
import { costCreditForFeature } from "@/modules/usage/domain/pricing"

export interface EnhancerProviderOption {
  id: string
  name: string
  desc: string
  badge: string
  tone: "accent" | "neutral" | "success" | "warning" | "danger"
  icon: React.ElementType
}

/**
 * Chỉ những bộ máy worker `media.optimize` thật sự có — khớp
 * `OPTIMIZE_ENHANCER_PROVIDERS` (`src/modules/media/domain/optimization-rules.ts`),
 * route từ chối mã khác. Gemini/Replicate gỡ 25/09/2026: ở worker còn là stub
 * luôn lùi PIL. Nhà cung cấp lỗi thì worker lùi về Studio và ghi lý do.
 */
export const ENHANCER_PROVIDERS: EnhancerProviderOption[] = [
  {
    id: "auto",
    name: "Theo thứ tự ưu tiên của tiệm",
    desc: "Thử lần lượt các nhà cung cấp theo thứ tự trong Cài đặt → Nhà cung cấp AI; bên lỗi thì chuyển bên kế tiếp, hết bên mới dùng Studio cục bộ và hoàn phần chênh.",
    badge: "Khuyên dùng",
    tone: "success",
    icon: Sparkles,
  },
  {
    id: "photoroom",
    name: "Photoroom AI (Chuẩn E-commerce Quốc tế)",
    desc: "Photoroom tách nền, đặt lên phông studio trắng, đổ bóng và chỉnh sáng AI, tăng nét. Không xoá watermark — cần xoá thì dùng Studio AI Pipeline.",
    badge: "Thương mại",
    tone: "success",
    icon: Sparkles,
  },
  {
    id: "fal_flux",
    name: "Fal.ai Product Shot (Studio cao cấp)",
    desc: "fal.ai tách nền (BiRefNet), dựng phông studio và hoà sáng (BRIA Product Shot), tăng nét 2x (Real-ESRGAN). Không xoá watermark.",
    badge: "Cao cấp",
    tone: "accent",
    icon: Zap,
  },
  {
    id: "imagen",
    name: "Google Gemini Image",
    desc: "Gemini dựng phông studio và chỉnh sáng theo mô tả; bó hoa được FloraOS đo lại. Không xoá watermark.",
    badge: "Cloud AI",
    tone: "accent",
    icon: Cloud,
  },
  {
    id: "studio",
    name: "Studio cục bộ (dự phòng)",
    desc: "Chạy trên máy chủ FloraOS: tách nền, xoá watermark, ghép phông Studio. Chất lượng thấp hơn nhà cung cấp — dùng khi cần xoá watermark hoặc tiết kiệm.",
    badge: "Dự phòng",
    tone: "accent",
    icon: Sparkles,
  },
  {
    id: "openai",
    name: "OpenAI Image AI (Cloud)",
    desc: "Thế hệ nền qua OpenAI DALL-E. Phù hợp tạo bối cảnh mở rộng nhưng có thể sinh mảng màu nhân tạo.",
    badge: "Cloud AI",
    tone: "neutral",
    icon: Cloud,
  },
  {
    id: "local",
    name: "Real-ESRGAN / PIL Lanczos (Local)",
    desc: "Xử lý trực tiếp trên máy chủ cục bộ, không gọi nhà cung cấp bên ngoài và không cần internet.",
    badge: "Nội bộ 0đ",
    tone: "neutral",
    icon: Cpu,
  },
]

export interface EnhancerProviderSelectorProps {
  value: string
  onChange: (providerId: string) => void
  disabled?: boolean
}

export function EnhancerProviderSelector({
  value,
  onChange,
  disabled = false,
}: EnhancerProviderSelectorProps) {
  return (
    <div className="w-full flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={14} className="text-primary" />
          <span>Phương thức & Nhà cung cấp AI (Provider)</span>
        </div>
        <span className="text-[11px] text-text-muted">
          Mặc định: <strong className="text-primary font-semibold">Theo thứ tự ưu tiên của tiệm</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ENHANCER_PROVIDERS.map((provider) => {
          const isSelected = value === provider.id
          const Icon = provider.icon

          return (
            <label
              key={provider.id}
              onClick={() => !disabled && onChange(provider.id)}
              className={`relative flex flex-col justify-between p-3 rounded-xl border-2 transition cursor-pointer select-none ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border bg-surface hover:border-text-muted/40"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="radio"
                    name="enhancer-provider-radio"
                    checked={isSelected}
                    disabled={disabled}
                    onChange={() => onChange(provider.id)}
                    className="accent-primary h-3.5 w-3.5 flex-shrink-0"
                  />
                  <Icon size={16} className={isSelected ? "text-primary flex-shrink-0" : "text-text-muted flex-shrink-0"} />
                  <span className="text-[13px] font-bold text-text truncate">
                    {provider.name}
                  </span>
                </div>
                <Badge tone={provider.tone} className="flex-shrink-0 text-[10px] px-2 py-0.5">
                  {provider.badge}
                </Badge>
              </div>

              <div className="text-[11px] leading-relaxed text-text-muted mt-2 pl-5.5">
                {provider.desc}
              </div>
              <div className="text-[11px] font-semibold text-text mt-1 pl-5.5">
                {costCreditForFeature(optimizationPriceKey({ enhancer_provider: provider.id }))} credit/lượt
                {optimizationPriceKey({ enhancer_provider: provider.id }) === "media.optimize.cloud" &&
                  " · nhà cung cấp lỗi thì hoàn phần chênh"}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
