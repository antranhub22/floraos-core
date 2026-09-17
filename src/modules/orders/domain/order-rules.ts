/**
 * Pure domain rules for M10 — Orders & Operations.
 * Zero Prisma imports, pure business invariants testable in-memory.
 */

import type {
  OrderStatus,
  ProductionStatus,
  DeliveryStatus,
  OrderItemInput,
  OrderEventRecord,
  OrderSlaCalculation,
} from "./order-types"

const VALID_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["DELIVERED", "COMPLETED", "CANCELLED"],
  DELIVERED: ["COMPLETED", "PROCESSING"], // có thể trả về nếu có sự cố
  COMPLETED: [],
  CANCELLED: [],
}

const VALID_PRODUCTION_TRANSITIONS: Record<ProductionStatus, readonly ProductionStatus[]> = {
  WAITING: ["ASSIGNED", "ARRANGING"],
  ASSIGNED: ["ARRANGING", "WAITING"],
  ARRANGING: ["QUALITY_CHECK", "READY", "ASSIGNED"],
  QUALITY_CHECK: ["READY", "ARRANGING"],
  READY: ["ARRANGING"],
}

const VALID_DELIVERY_TRANSITIONS: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  PENDING: ["DISPATCHED", "DELIVERING"],
  DISPATCHED: ["DELIVERING", "PENDING"],
  DELIVERING: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: ["DELIVERING", "PENDING"],
}

/** Kiểm tra luồng trạng thái đơn hàng */
export function validateOrderStatusTransition(
  current: OrderStatus,
  next: OrderStatus
): { valid: boolean; reason?: string } {
  if (current === next) return { valid: true }
  const allowed = VALID_ORDER_TRANSITIONS[current] ?? []
  if (!allowed.includes(next)) {
    return {
      valid: false,
      reason: `Không thể chuyển trạng thái đơn hàng từ "${current}" sang "${next}". Trạng thái cho phép: ${allowed.join(", ") || "Không (đã kết thúc)"}.`,
    }
  }
  return { valid: true }
}

/** Kiểm tra luồng trạng thái sản xuất / cắm hoa */
export function validateProductionStatusTransition(
  current: ProductionStatus,
  next: ProductionStatus
): { valid: boolean; reason?: string } {
  if (current === next) return { valid: true }
  const allowed = VALID_PRODUCTION_TRANSITIONS[current] ?? []
  if (!allowed.includes(next)) {
    return {
      valid: false,
      reason: `Không thể chuyển trạng thái cắm hoa từ "${current}" sang "${next}". Trạng thái cho phép: ${allowed.join(", ")}.`,
    }
  }
  return { valid: true }
}

/** Kiểm tra luồng trạng thái giao hàng */
export function validateDeliveryStatusTransition(
  current: DeliveryStatus,
  next: DeliveryStatus
): { valid: boolean; reason?: string } {
  if (current === next) return { valid: true }
  const allowed = VALID_DELIVERY_TRANSITIONS[current] ?? []
  if (!allowed.includes(next)) {
    return {
      valid: false,
      reason: `Không thể chuyển trạng thái giao hàng từ "${current}" sang "${next}". Trạng thái cho phép: ${allowed.join(", ")}.`,
    }
  }
  return { valid: true }
}

/** Tính tổng tiền đơn hàng từ danh sách items */
export function calculateOrderTotal(items: readonly OrderItemInput[]): number {
  if (!items || items.length === 0) return 0
  return items.reduce((sum, item) => {
    const qty = Math.max(1, Math.floor(item.quantity))
    const price = Math.max(0, item.unitPriceVnd)
    return sum + qty * price
  }, 0)
}

/**
 * Đo lường SLA từ chuỗi order_events (đặc tả 07 mục 12).
 * Không đọc cột cứng trên orders: chuỗi sự kiện là nguồn duy nhất đo SLA.
 */
export function calculateOrderSla(
  events: readonly OrderEventRecord[],
  slaTargetMinutes = 180
): OrderSlaCalculation {
  if (!events || events.length === 0) {
    return {
      totalDurationMinutes: 0,
      isSlaMet: true,
      slaTargetMinutes,
    }
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const firstEventTime = new Date(sorted[0]!.createdAt).getTime()
  const completedOrDeliveredEvent = sorted.find(
    (e) => (e.axis === "order" && (e.toValue === "COMPLETED" || e.toValue === "DELIVERED")) ||
           (e.axis === "delivery" && e.toValue === "DELIVERED")
  )

  const endTime = completedOrDeliveredEvent
    ? new Date(completedOrDeliveredEvent.createdAt).getTime()
    : Date.now()

  const totalDurationMinutes = Math.max(0, Math.round((endTime - firstEventTime) / (1000 * 60)))

  // Đo thời gian sản xuất (từ lúc ASSIGNED/ARRANGING đến lúc READY)
  let prodStart: number | null = null
  let prodEnd: number | null = null

  for (const ev of sorted) {
    if (ev.axis === "production") {
      if (ev.toValue === "ARRANGING" && prodStart === null) {
        prodStart = new Date(ev.createdAt).getTime()
      }
      if (ev.toValue === "READY") {
        prodEnd = new Date(ev.createdAt).getTime()
      }
    }
  }

  const productionDurationMinutes =
    prodStart !== null && prodEnd !== null
      ? Math.max(0, Math.round((prodEnd - prodStart) / (1000 * 60)))
      : undefined

  return {
    totalDurationMinutes,
    productionDurationMinutes,
    isSlaMet: totalDurationMinutes <= slaTargetMinutes,
    slaTargetMinutes,
  }
}

/**
 * Sinh mã đơn hàng chuẩn FloraOS dạng `DH-YYMMDD-XXXX`
 */
export function generateOrderCode(seqNumber: number, date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const suffix = String(seqNumber).padStart(4, "0")
  return `DH${yy}${mm}${dd}-${suffix}`
}
