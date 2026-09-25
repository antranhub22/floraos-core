/**
 * Luật chuyển bước điều phối (Chức năng 12) — thuần, không import Prisma.
 *
 * Trước 25/09 luật này nằm trong component giao diện (`getNextAdvancedOrder`)
 * và máy chủ nhận MỌI chuỗi `stage`: nhảy thẳng INTAKE → COMPLETED được, bỏ
 * qua QC và POD được. Nay máy chủ là nơi duy nhất quyết định, và mỗi bước
 * "đóng cửa" đòi bằng chứng tương ứng đã nằm trong CSDL:
 *
 *   ASSIGNING → IN_PRODUCTION   cần đối tác đã phân công
 *   QUALITY_CHECK → DISPATCHING cần lượt QC gần nhất = PASSED
 *   DISPATCHING → DELIVERED     cần POD (ảnh hoặc tên người ký nhận)
 *   DELIVERED → COMPLETED       cần không còn sự cố mở
 *   EXCEPTION → (bước cũ)       cần không còn sự cố mở, chỉ về đúng `resume_stage`
 */

import type { DeliveryStatus, OrderStatus, ProductionStatus } from "@/modules/orders/domain/order-types"
import type { CoordinatorStage } from "./coordinator-types"
import { mapStageToOrderAxes, type MappedOrderAxes } from "./state-mapper"

export const COORDINATOR_STAGES: readonly CoordinatorStage[] = [
  "INTAKE",
  "VALIDATING",
  "PLANNING",
  "ASSIGNING",
  "IN_PRODUCTION",
  "QUALITY_CHECK",
  "DISPATCHING",
  "DELIVERED",
  "COMPLETED",
  "EXCEPTION",
  "CANCELLED",
]

/** Bước kết thúc — không chuyển đi đâu nữa. */
export const TERMINAL_STAGES: readonly CoordinatorStage[] = ["COMPLETED", "CANCELLED"]

const FORWARD: Record<CoordinatorStage, readonly CoordinatorStage[]> = {
  INTAKE: ["VALIDATING", "PLANNING"],
  VALIDATING: ["PLANNING", "INTAKE"],
  PLANNING: ["ASSIGNING"],
  ASSIGNING: ["IN_PRODUCTION", "PLANNING"],
  IN_PRODUCTION: ["QUALITY_CHECK"],
  // QC không đạt → trả về xưởng làm lại.
  QUALITY_CHECK: ["DISPATCHING", "IN_PRODUCTION"],
  DISPATCHING: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  // Lối ra khỏi EXCEPTION là `resume_stage`, xử lý riêng bên dưới.
  EXCEPTION: [],
  CANCELLED: [],
}

/** Sự thật đọc từ CSDL, dùng làm bằng chứng cho bước "đóng cửa". */
export interface StageTransitionFacts {
  partnerAssigned: boolean
  latestQcStatus: "PENDING" | "PASSED" | "REJECTED" | "REWORK_REQUESTED" | null
  podCaptured: boolean
  openExceptionCount: number
  resumeStage: CoordinatorStage | null
}

export type TransitionCheck = { ok: true } | { ok: false; reason: string }

export function isCoordinatorStage(value: unknown): value is CoordinatorStage {
  return typeof value === "string" && (COORDINATOR_STAGES as readonly string[]).includes(value)
}

export function checkStageTransition(
  from: CoordinatorStage,
  to: CoordinatorStage,
  facts: StageTransitionFacts
): TransitionCheck {
  if (from === to) return { ok: false, reason: `Đơn đã ở bước ${to}.` }
  if (TERMINAL_STAGES.includes(from)) {
    return { ok: false, reason: `Đơn đã kết thúc (${from}), không chuyển bước được nữa.` }
  }

  // Huỷ và mở sự cố đi qua endpoint riêng (lý do bắt buộc), không qua đây.
  if (to === "CANCELLED") return { ok: false, reason: "Huỷ đơn dùng POST /coordinator/orders/:id/cancel." }
  if (to === "EXCEPTION") return { ok: false, reason: "Mở sự cố dùng POST /coordinator/orders/:id/exceptions." }

  if (from === "EXCEPTION") {
    if (facts.openExceptionCount > 0) {
      return { ok: false, reason: `Còn ${facts.openExceptionCount} sự cố chưa xử lý.` }
    }
    if (facts.resumeStage && to !== facts.resumeStage) {
      return { ok: false, reason: `Sau sự cố chỉ quay về được bước ${facts.resumeStage}.` }
    }
    return { ok: true }
  }

  const allowed = FORWARD[from]
  if (!allowed.includes(to)) {
    return {
      ok: false,
      reason: `Không chuyển được từ ${from} sang ${to}. Bước kế tiếp hợp lệ: ${allowed.join(", ") || "không có"}.`,
    }
  }

  if (to === "IN_PRODUCTION" && from === "ASSIGNING" && !facts.partnerAssigned) {
    return { ok: false, reason: "Chưa phân công đối tác/thợ cắm cho đơn." }
  }
  if (to === "DISPATCHING" && facts.latestQcStatus !== "PASSED") {
    return { ok: false, reason: "Đơn chưa có lượt QC đạt — không được giao." }
  }
  if (to === "DELIVERED" && !facts.podCaptured) {
    return { ok: false, reason: "Thiếu bằng chứng giao hàng (POD)." }
  }
  if (to === "COMPLETED" && facts.openExceptionCount > 0) {
    return { ok: false, reason: `Còn ${facts.openExceptionCount} sự cố chưa xử lý — chưa đóng đơn được.` }
  }
  return { ok: true }
}

/**
 * Ba trục của `orders` sau khi chuyển bước. EXCEPTION giữ nguyên ba trục (sự
 * cố lúc đang giao không được kéo `delivery_status` về PENDING); CANCELLED
 * chỉ đổi trục đơn — hai trục kia là lịch sử thật, không xoá.
 */
export function axesAfterTransition(to: CoordinatorStage, current: MappedOrderAxes): MappedOrderAxes {
  if (to === "EXCEPTION") return current
  if (to === "CANCELLED") return { ...current, status: "CANCELLED" }
  return mapStageToOrderAxes(to)
}

/** Những trục đổi giá trị — để ghi `order_events` (M10 đo SLA từ chuỗi này). */
export function changedAxes(
  before: MappedOrderAxes,
  after: MappedOrderAxes
): Array<{ axis: "order" | "production" | "delivery"; from: string; to: string }> {
  const out: Array<{ axis: "order" | "production" | "delivery"; from: string; to: string }> = []
  if (before.status !== after.status) out.push({ axis: "order", from: before.status, to: after.status })
  if (before.productionStatus !== after.productionStatus) {
    out.push({ axis: "production", from: before.productionStatus, to: after.productionStatus })
  }
  if (before.deliveryStatus !== after.deliveryStatus) {
    out.push({ axis: "delivery", from: before.deliveryStatus, to: after.deliveryStatus })
  }
  return out
}

export type { OrderStatus, ProductionStatus, DeliveryStatus }
