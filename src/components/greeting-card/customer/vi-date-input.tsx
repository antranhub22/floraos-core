"use client"

import React from "react"
import { CalendarDays } from "lucide-react"
import { viDeliveryDate } from "@/modules/greeting-card/domain/delivery-schedule"

/**
 * Ô chọn ngày hiện kiểu Việt Nam ("Thứ Sáu, 16/10/2026"). Ô `type="date"` của trình duyệt hiện theo
 * ngôn ngữ máy khách ("16 Oct 2026") và không đổi được — giữ nó (trong suốt, phủ lên trên) để vẫn mở
 * bảng lịch của máy, chữ hiển thị nằm bên dưới.
 */
export function ViDateInput({
  id,
  value,
  onChange,
  min,
  max,
  required,
  className,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  min?: string | undefined
  max?: string | undefined
  required?: boolean | undefined
  className: string
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="date"
        required={required}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // Máy tính: bấm vào bất kỳ đâu trên ô cũng mở lịch (không chỉ biểu tượng)
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.()
          } catch {
            /* trình duyệt không hỗ trợ — vẫn chọn được bằng biểu tượng */
          }
        }}
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />
      <div
        aria-hidden="true"
        className={`${className} flex items-center justify-between gap-2 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20`}
      >
        <span className={value ? "truncate" : "truncate text-body text-text-muted/70"}>{value ? viDeliveryDate(value) : "Chọn ngày"}</span>
        <CalendarDays size={18} className="shrink-0 text-text-muted" />
      </div>
    </div>
  )
}
