"use client"

import React from "react"
import type { ShippingConfig } from "@/modules/greeting-card/domain/brochure-pricing"
import {
  CUSTOM_TIME_MAX_HOUR,
  CUSTOM_TIME_MIN_HOUR,
  CUSTOM_TIME_PREFIX,
  availableSlots,
  customTimeAvailable,
  customTimeLabel,
  enabledSlots,
  isCustomTimeSlot,
} from "@/modules/greeting-card/domain/delivery-schedule"

const CUSTOM = "__custom__"
const pad = (n: number) => String(n).padStart(2, "0")

/**
 * Chọn khung giờ giao 2 tiếng (chỉ khung tiệm bật và còn kịp) hoặc "Giờ cụ thể" — khách tự nhập
 * HH:MM. Giá trị lưu: nhãn khung, hoặc `Giờ cụ thể: HH:MM`.
 */
export function DeliveryTimePicker({
  id,
  date,
  value,
  shipping,
  inputClassName,
  onChange,
}: {
  id: string
  date: string
  value: string
  shipping: ShippingConfig
  inputClassName: string
  onChange: (value: string) => void
}) {
  const slots = date ? availableSlots(date, shipping) : enabledSlots(shipping).map((s) => s.label)
  const allowCustom = date ? customTimeAvailable(date, shipping) : shipping.allowCustomTime !== false
  const custom = isCustomTimeSlot(value)
  const customTime = custom ? value.slice(CUSTOM_TIME_PREFIX.length) : ""

  return (
    <div className="flex flex-col gap-2">
      <select
        id={id}
        value={custom ? CUSTOM : slots.includes(value) ? value : ""}
        onChange={(e) => onChange(e.target.value === CUSTOM ? customTimeLabel("") : e.target.value)}
        className={inputClassName}
      >
        <option value="" disabled>
          {slots.length === 0 && !allowCustom ? "Ngày này không còn khung giờ — chọn ngày khác" : "Chọn khung giờ giao"}
        </option>
        {slots.map((slot) => (
          <option key={slot} value={slot}>{slot}</option>
        ))}
        {allowCustom && <option value={CUSTOM}>Giờ cụ thể (tự nhập)</option>}
      </select>
      {custom && (
        <label className="flex items-center gap-2 text-body-sm text-text-muted">
          <span className="shrink-0">Giao lúc</span>
          <input
            type="time"
            aria-label="Giờ giao cụ thể"
            min={`${pad(CUSTOM_TIME_MIN_HOUR)}:00`}
            max={`${pad(CUSTOM_TIME_MAX_HOUR)}:00`}
            step={900}
            value={customTime}
            onChange={(e) => onChange(customTimeLabel(e.target.value))}
            className={inputClassName}
          />
        </label>
      )}
    </div>
  )
}
