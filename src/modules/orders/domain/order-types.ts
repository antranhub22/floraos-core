/**
 * Domain types for M10 — Orders & Operations (Đơn hàng và vận hành).
 * Pure TypeScript — No Prisma or external infrastructure imports.
 */

export type OrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PROCESSING"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"

export type ProductionStatus =
  | "WAITING"
  | "ASSIGNED"
  | "ARRANGING"
  | "QUALITY_CHECK"
  | "READY"

export type DeliveryStatus =
  | "PENDING"
  | "DISPATCHED"
  | "DELIVERING"
  | "DELIVERED"
  | "FAILED"

export type OrderEventAxis = "order" | "production" | "delivery"

export interface DeliveryWindow {
  date: string // YYYY-MM-DD
  timeSlot?: string | undefined
}

export interface StructuredAddress {
  /** Số nhà, ngõ/ngách/hẻm, tên đường, số phòng, toà nhà */
  street: string
  /** Phường, Xã, Thị trấn */
  ward: string
  /** Quận, Huyện, Thị xã, Thành phố thuộc tỉnh */
  district: string
  /** Tỉnh, Thành phố trực thuộc trung ương */
  city: string
  /** Quốc gia (mặc định "Việt Nam") */
  country?: string | undefined
  /** Địa chỉ đầy đủ tự động sinh */
  formattedAddress?: string | undefined
}

export function formatStructuredAddress(addr: StructuredAddress | string | null | undefined): string {
  if (!addr) return ""
  if (typeof addr === "string") return addr
  const parts = [addr.street, addr.ward, addr.district, addr.city, addr.country || "Việt Nam"].filter(Boolean)
  return parts.join(", ")
}

export interface DeliveryAddress {
  recipientName: string
  phone: string
  street: string
  ward?: string | undefined
  district?: string | undefined
  province?: string | undefined
  city?: string | undefined
  country?: string | undefined
  notes?: string | undefined
}

export interface OrderItemInput {
  productId?: string | null | undefined
  variantId?: string | null | undefined
  description?: string | null | undefined
  quantity: number
  unitPriceVnd: number
  /** BOM có cấu trúc (từ Product Master Index lúc chọn mẫu): sampleImageUrl, flowers (FlowerBomItem[]), wrapStyle, ribbon. Không bắt buộc — đơn nhập tay không qua Master Index sẽ không có. */
  metadata?: Record<string, unknown> | null | undefined
}

export interface OrderItemRecord {
  id: string
  organizationId: string
  orderId: string
  productId?: string | null | undefined
  variantId?: string | null | undefined
  description?: string | null | undefined
  quantity: number
  unitPriceVnd: number
  metadata?: Record<string, unknown> | null | undefined
}

export interface OrderAssignmentRecord {
  id: string
  organizationId: string
  orderId: string
  assigneeId: string
  assignedBy: string
  difficulty?: string | undefined
  assignedAt: Date
  releasedAt?: Date | null | undefined
}

export interface OrderEventRecord {
  id: string
  organizationId: string
  orderId: string
  axis: OrderEventAxis
  fromValue?: string | null | undefined
  toValue: string
  actorId?: string | null | undefined
  reason?: string | null | undefined
  createdAt: Date
}

export interface OrderRecord {
  id: string
  organizationId: string
  branchId?: string | null | undefined
  code: string
  customerId?: string | null | undefined
  status: OrderStatus
  productionStatus: ProductionStatus
  deliveryStatus: DeliveryStatus
  totalVnd: number
  pricingRuleRef?: Record<string, unknown> | null | undefined
  voucherId?: string | null | undefined
  cardMessage?: string | null | undefined
  internalNote?: string | null | undefined
  deliveryWindow?: DeliveryWindow | null | undefined
  deliveryAddress?: DeliveryAddress | null | undefined
  createdBy: string
  createdAt: Date
  updatedAt: Date
  items?: OrderItemRecord[] | undefined
  assignments?: OrderAssignmentRecord[] | undefined
  events?: OrderEventRecord[] | undefined
}

export interface CreateOrderInput {
  branchId?: string | null | undefined
  customerId?: string | null | undefined
  items: OrderItemInput[]
  pricingRuleRef?: Record<string, unknown> | null | undefined
  voucherId?: string | null | undefined
  cardMessage?: string | null | undefined
  internalNote?: string | null | undefined
  deliveryWindow?: DeliveryWindow | null | undefined
  deliveryAddress?: DeliveryAddress | null | undefined
}

export interface UpdateOrderInput {
  status?: OrderStatus | undefined
  productionStatus?: ProductionStatus | undefined
  deliveryStatus?: DeliveryStatus | undefined
  cardMessage?: string | null | undefined
  internalNote?: string | null | undefined
  deliveryWindow?: DeliveryWindow | null | undefined
  deliveryAddress?: DeliveryAddress | null | undefined
}

export interface OrderFilter {
  status?: OrderStatus | undefined
  productionStatus?: ProductionStatus | undefined
  deliveryStatus?: DeliveryStatus | undefined
  branchId?: string | undefined
  assigneeId?: string | undefined
  customerId?: string | undefined
  search?: string | undefined
  fromDate?: Date | undefined
  toDate?: Date | undefined
  limit?: number | undefined
  cursor?: string | undefined
}

export interface OrderSlaCalculation {
  totalDurationMinutes: number
  productionDurationMinutes?: number | undefined
  deliveryDurationMinutes?: number | undefined
  isSlaMet: boolean
  slaTargetMinutes: number
}
