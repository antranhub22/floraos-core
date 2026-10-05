/**
 * Domain Types for Greeting Card / Swipe Brochure Module (Thẻ Chào / Brochure).
 * Pure TypeScript — No Prisma or external infrastructure imports.
 */

export type GreetingCatalogType = "STANDARD" | "CLIENT"

export type GreetingSessionStatus =
  | "CREATED"
  | "OPENED"
  | "BROWSING"
  | "SELECTED"
  | "ORDER_SUBMITTED"
  | "PAYMENT_REPORTED"
  | "COMPLETED"

export type GreetingJourneyEventType =
  | "OPEN"
  | "SWIPE_NEXT"
  | "SWIPE_PREV"
  | "SELECT_PRODUCT"
  | "OPEN_ORDER_FORM"
  | "SUBMIT_ORDER"
  | "CLICK_PAID"
  | "TRACK_VIEW"
  | "ADMIN_CONFIRMED_PAYMENT"
  | "INTERNAL_NOTE"

export interface ProductSnapshot {
  id: string
  code: string
  name: string
  price: number
  imageUrl: string | null
  description?: string | null | undefined
  flowersSummary?: string | null | undefined
  selectedAt: string
}

export interface GreetingCatalogProduct {
  id: string
  code: string
  name: string
  /** `null` = chưa có giá trong Product Master → hiển thị "Giá liên hệ", không cho đặt online. */
  price: number | null
  imageUrl: string | null
  description?: string | null | undefined
  meaning?: string | null | undefined
  occasion?: string | null | undefined
  style?: string | null | undefined
  flowersSummary?: string | null | undefined
  sortOrder: number
  /** Các size/biến thể bán online (đã có giá); rỗng = chỉ bán bản gốc. */
  variants?: Array<{ id: string; name: string; priceVnd: number }> | undefined
}

export interface GreetingCatalogRecord {
  id: string
  organizationId: string
  code: string
  name: string
  type: GreetingCatalogType
  description?: string | null | undefined
  filters?: Record<string, unknown> | null | undefined
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
  itemsCount?: number | undefined
}

export interface GreetingSessionRecord {
  id: string
  organizationId: string
  catalogId: string
  sendCode: string
  saleId: string
  customerName?: string | null | undefined
  customerPhone?: string | null | undefined
  status: GreetingSessionStatus
  selectedProductId?: string | null | undefined
  productSnapshot?: ProductSnapshot | null | undefined
  orderId?: string | null | undefined
  openedAt?: Date | null | undefined
  selectedAt?: Date | null | undefined
  lastActiveAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface CustomerOrderSubmitInput {
  customerName: string
  customerPhone: string
  recipientName: string
  recipientPhone: string
  deliveryDate: string // YYYY-MM-DD
  deliveryTimeSlot?: string | undefined
  deliveryAddress: string
  cardMessage?: string | undefined
  senderNote?: string | undefined
  /** Lựa chọn mua — server tính lại giá từ các lựa chọn này, không nhận giá từ client. */
  variantId?: string | undefined
  quantity?: number | undefined
  shippingZoneId?: string | undefined
  voucherCode?: string | undefined
}

export interface BrochureOrderSummary {
  orderId: string
  orderCode: string
  sendCode: string
  customerName: string
  customerPhone: string
  recipientName: string
  deliveryDate: string
  deliveryAddress: string
  productSnapshot: ProductSnapshot
  totalVnd: number
  paidVnd: number
  balanceVnd: number
  status: string
  productionStatus: string
  deliveryStatus: string
  paymentReportedAt?: string | null | undefined
  finishedImageUrl?: string | null | undefined
  createdAt: string
}

/** Thông tin chuyển khoản hiển thị cho khách — luôn dựng ở server từ cài đặt của tiệm. */
export interface BrochurePaymentInstructions {
  qrUrl: string
  bankName: string
  accountNo: string
  accountName: string
  amount: number
  transferMemo: string
}

/** Phần phiên trả ra trang công khai — KHÔNG chứa SĐT khách, id tổ chức, id sale. */
export interface PublicBrochureSessionView {
  sendCode: string
  status: GreetingSessionStatus
  customerName: string | null
  selectedProductId: string | null
  productSnapshot: ProductSnapshot | null
}
