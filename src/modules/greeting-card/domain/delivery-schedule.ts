/**
 * Giờ chốt đơn và thời gian chuẩn bị cho đơn Thẻ chào. Pure TypeScript.
 * Khách không chọn được ngày/khung giờ mà tiệm không kịp giao.
 */

import type { ShippingConfig } from "./brochure-pricing"

const VN_OFFSET_MS = 7 * 3_600_000

/** Khung giờ giao + giờ kết thúc (giờ VN). `null` = thoả thuận riêng, luôn chọn được. */
export const DELIVERY_SLOTS: readonly { label: string; endHour: number | null }[] = [
  { label: "Buổi sáng (8h - 12h)", endHour: 12 },
  { label: "Buổi chiều (13h - 17h)", endHour: 17 },
  { label: "Buổi tối (18h - 21h)", endHour: 21 },
  { label: "Giờ cụ thể (liên hệ)", endHour: null },
]

function vnClock(now: Date): { date: string; hour: number } {
  const vn = new Date(now.getTime() + VN_OFFSET_MS)
  return { date: vn.toISOString().slice(0, 10), hour: vn.getUTCHours() + vn.getUTCMinutes() / 60 }
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

type Schedule = Pick<ShippingConfig, "sameDayCutoffHour" | "prepHours">

/** Khung giờ còn chọn được cho ngày `date` (ngày tương lai: tất cả). */
export function availableSlots(date: string, cfg: Schedule, now: Date = new Date()): string[] {
  const { date: today, hour } = vnClock(now)
  if (date !== today) return DELIVERY_SLOTS.map((s) => s.label)
  if (cfg.sameDayCutoffHour != null && hour >= cfg.sameDayCutoffHour) return []
  const ready = hour + (cfg.prepHours ?? 0)
  return DELIVERY_SLOTS.filter((s) => s.endHour === null || s.endHour > ready).map((s) => s.label)
}

/** Ngày sớm nhất còn giao được: hôm nay, hoặc ngày mai khi hôm nay hết khung giờ. */
export function earliestDeliveryDate(cfg: Schedule, now: Date = new Date()): string {
  const { date: today } = vnClock(now)
  const todaySlots = availableSlots(today, cfg, now).filter((l) => l !== DELIVERY_SLOTS[3]!.label)
  return todaySlots.length > 0 ? today : nextDay(today)
}

/** Lỗi tiếng Việt khi ngày/khung giờ khách chọn tiệm không kịp giao; `null` nếu hợp lệ. */
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
  if (slot && DELIVERY_SLOTS.some((s) => s.label === slot) && !availableSlots(date, cfg, now).includes(slot)) {
    return "Khung giờ này cửa hàng không còn kịp chuẩn bị. Vui lòng chọn khung giờ muộn hơn."
  }
  return null
}
