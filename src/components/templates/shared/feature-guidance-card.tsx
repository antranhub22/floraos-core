import * as React from "react"
import { type LucideIcon, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface GuidanceTip {
  icon?: string | LucideIcon
  text: string
}

export interface FeatureGuidanceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  badgeLabel?: string | undefined
  tag?: string | undefined
  badgeIcon?: LucideIcon | undefined
  icon?: LucideIcon | undefined
  title: string
  titleIcon?: LucideIcon | undefined
  description: string
  tips?: Array<string | GuidanceTip> | undefined
  maxWidthClassName?: string | undefined
}

/**
 * Base Feature Guidance Card Component (Họ Guidance Templates)
 *
 * Khung chuẩn hiển thị hướng dẫn thao tác cho các Tab tính năng trong FloraOS:
 * - Khung viền đứt nét màu đỏ: `border-2 border-dashed border-red-300`
 * - Nền đỏ pastel dịu mắt: `bg-red-50/70`
 * - Badge định danh chức năng: `bg-red-100 text-red-700`
 * - Tiêu đề & nội dung đỏ chuẩn tương phản cao WCAG (>7:1)
 * - Thanh gợi ý mẹo thao tác ở chân khối: `border-t border-dashed border-red-200/90`
 */
export function FeatureGuidanceCard({
  badgeLabel,
  tag,
  badgeIcon,
  icon,
  title,
  titleIcon,
  description,
  tips = [],
  maxWidthClassName = "max-w-xl",
  className,
  ...props
}: FeatureGuidanceCardProps) {
  const effectiveBadgeLabel = badgeLabel ?? tag
  const EffectiveBadgeIcon = badgeIcon ?? icon ?? Info
  const EffectiveTitleIcon = titleIcon ?? (badgeIcon ? icon : undefined)

  return (
    <div
      className={cn(
        "w-full mx-auto rounded-2xl border-2 border-dashed border-red-300 bg-red-50/70 p-4 sm:p-5 text-center transition-all shadow-xs",
        maxWidthClassName,
        className
      )}
      {...props}
    >
      {effectiveBadgeLabel && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold tracking-wider uppercase mb-2">
          {EffectiveBadgeIcon && <EffectiveBadgeIcon size={13} className="text-red-600" />}
          <span>{effectiveBadgeLabel}</span>
        </div>
      )}

      <div className="text-[16px] font-extrabold text-red-950 flex items-center justify-center gap-2">
        {EffectiveTitleIcon && <EffectiveTitleIcon size={18} className="text-red-600" />}
        <span>{title}</span>
      </div>

      <div className="mt-1.5 text-[13px] leading-relaxed text-red-800/90 max-w-lg mx-auto">
        {description}
      </div>

      {tips.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dashed border-red-200/90 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11.5px] font-medium text-red-700">
          {tips.map((tip, index) => {
            if (typeof tip === "string") {
              return (
                <span key={index} className="inline-flex items-center gap-1">
                  {tip}
                </span>
              )
            }
            const TipIcon = typeof tip.icon === "function" ? tip.icon : null
            return (
              <span key={index} className="inline-flex items-center gap-1">
                {TipIcon && <TipIcon size={12} className="text-red-600" />}
                {typeof tip.icon === "string" && <span>{tip.icon}</span>}
                <span>{tip.text}</span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
