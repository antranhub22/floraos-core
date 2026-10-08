/**
 * Khung giờ giao, giờ chốt đơn và thời gian chuẩn bị cho đơn Thẻ chào. Pure TypeScript.
 * Khung 2 tiếng + "Giờ cụ thể" (khách tự nhập HH:MM); Điều hành bật/tắt từng khung trong
 * cài đặt giao hàng (`brochure_shipping.delivery_slots`, `allow_custom_time`).
 * Khách không chọn được ngày/khung giờ mà tiệm không kịp giao hoặc đã tắt.
 */

import type { ShippingConfig } from "./brochure-pricing"

const VN_OFFSET_MS = 7 * 3_600_000

export interface DeliverySlot {
  id: string
  label: string
  startHour: number
  endHour: number
}

/** Khung 2 tiếng, theo thứ tự trong ngày. `id` là khoá lưu trong cài đặt — không đổi. */
export const DELIVERY_SLOTS: readonly DeliverySlot[] = [
  { id: "08-10", label: "08:00 - 10:00", startHour: 8, endHour: 10 },
  { id: "10-12", label: "10:00 - 12:00", startHour: 10, endHour: 12 },
  { id: "12-14", label: "12:00 - 14:00", startHour: 12, endHour: 14 },
  { id: "14-16", label: "14:00 - 16:00", startHour: 14, endHour: 16 },
  { id: "16-18", label: "16:00 - 18:00", startHour: 16, endHour: 18 },
  { id: "18-20", label: "18:00 - 20:00", startHour: 18, endHour: 20 },
  { id: "20-22", label: "20:00 - 22:00", startHour: 20, endHour: 22 },
]
export const DELIVERY_SLOT_IDS = DELIVERY_SLOTS.map((s) => s.id)

/** Giờ cụ thể khách nhập được lưu thành `Giờ cụ thể: HH:MM`. */
export const CUSTOM_TIME_PREFIX = "Giờ cụ thể: "
export const CUSTOM_TIME_MIN_HOUR = 7
export const CUSTOM_TIME_MAX_HOUR = 22

type Schedule = Pick<ShippingConfig, "sameDayCutoffHour" | "prepHours" | "slotIds" | "allowCustomTime">

/** Khung giờ tiệm đang bật (chưa cấu hình → bật tất cả). */
export function enabledSlots(cfg: Schedule): DeliverySlot[] {
  if (!cfg.slotIds) return [...DELIVERY_SLOTS]
  return DELIVERY_SLOTS.filter((s) => cfg.slotIds!.includes(s.id))
}

export function customTimeAllowed(cfg: Schedule): boolean {
  return cfg.allowCustomTime !== false
}

export function customTimeLabel(hhmm: string): string {
  return `${CUSTOM_TIME_PREFIX}${hhmm}`
}

/** Giờ (thập phân) của giá trị giờ cụ thể; `null` nếu không phải/không hợp lệ. */
export function parseCustomTime(slot: string): number | null {
  if (!isCustomTimeSlot(slot)) return null
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(slot.trim().slice(CUSTOM_TIME_PREFIX.trim().length).trim())
  if (!m) return null
  const hour = Number(m[1]) + Number(m[2]) / 60
  return hour >= CUSTOM_TIME_MIN_HOUR && hour <= CUSTOM_TIME_MAX_HOUR ? hour : null
}

export function isCustomTimeSlot(slot: string | undefined | null): boolean {
  return Boolean(slot?.trim().startsWith(CUSTOM_TIME_PREFIX.trim()))
}

function vnClock(now: Date): { date: string; hour: number } {
  const vn = new Date(now.getTime() + VN_OFFSET_MS)
  return { date: vn.toISOString().slice(0, 10), hour: vn.getUTCHours() + vn.getUTCMinutes() / 60 }
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/** Giờ sớm nhất còn kịp giao trong ngày `date`; `null` = hôm nay đã qua giờ chốt; 0 = ngày tương lai. */
function readyHour(date: string, cfg: Schedule, now: Date): number | null {
  const { date: today, hour } = vnClock(now)
  if (date !== today) return 0
  if (cfg.sameDayCutoffHour != null && hour >= cfg.sameDayCutoffHour) return null
  return hour + (cfg.prepHours ?? 0)
}

/** Nhãn khung 2 tiếng còn chọn được cho ngày `date` (đã bỏ khung tiệm tắt / không kịp). */
export function availableSlots(date: string, cfg: Schedule, now: Date = new Date()): string[] {
  const ready = readyHour(date, cfg, now)
  if (ready === null) return []
  return enabledSlots(cfg).filter((s) => s.endHour > ready).map((s) => s.label)
}

/** Còn hẹn giờ cụ thể được trong ngày `date` không. */
export function customTimeAvailable(date: string, cfg: Schedule, now: Date = new Date()): boolean {
  const ready = readyHour(date, cfg, now)
  return customTimeAllowed(cfg) && ready !== null && ready <= CUSTOM_TIME_MAX_HOUR
}

/** Ngày sớm nhất còn giao được: hôm nay, hoặc ngày mai khi hôm nay hết khung giờ. */
export function earliestDeliveryDate(cfg: Schedule, now: Date = new Date()): string {
  const { date: today } = vnClock(now)
  const ok = availableSlots(today, cfg, now).length > 0 || customTimeAvailable(today, cfg, now)
  return ok ? today : nextDay(today)
}

/** Lỗi tiếng Việt khi ngày/khung giờ khách chọn không hợp lệ hoặc không kịp giao; `null` nếu hợp lệ. */
export function deliveryScheduleError(
  date: string,
  slot: string | undefined,
  cfg: Schedule,
  now: Date = new Date(),
): string | null {
  const earliest = earliestDeliveryDate(cfg, now)
  if (date < earliest) {
    return cfg.sameDayCutoffHour != null
      ? `Đã qua giờ nhận đơn giao trong ngày (${cfg.sameDayCutoffHour}h). Vui lòng chọn từ ngày mai.`
      : "Hôm nay cửa hàng không còn kịp giao. Vui lòng chọn từ ngày mai."
  }
  const value = slot?.trim()
  if (!value) return null

  if (isCustomTimeSlot(value)) {
    if (!customTimeAllowed(cfg)) return "Cửa hàng chưa nhận hẹn giờ cụ thể. Vui lòng chọn một khung giờ."
    const hour = parseCustomTime(value)
    if (hour === null) {
      return `Vui lòng nhập giờ cụ thể dạng HH:MM, từ ${pad(CUSTOM_TIME_MIN_HOUR)}:00 đến ${pad(CUSTOM_TIME_MAX_HOUR)}:00.`
    }
    const ready = readyHour(date, cfg, now)
    if (ready === null || hour < ready) return "Giờ này cửa hàng không còn kịp chuẩn bị. Vui lòng chọn giờ muộn hơn."
    return null
  }

  if (!enabledSlots(cfg).some((s) => s.label === value)) {
    return "Khung giờ này cửa hàng không nhận giao. Vui lòng chọn khung giờ khác."
  }
  if (!availableSlots(date, cfg, now).includes(value)) {
    return "Khung giờ này cửa hàng không còn kịp chuẩn bị. Vui lòng chọn khung giờ muộn hơn."
  }
  return null
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}
