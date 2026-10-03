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
  price: number
  imageUrl: string | null
  description?: string | null | undefined
  meaning?: string | null | undefined
  occasion?: string | null | undefined
  style?: string | null | undefined
  flowersSummary?: string | null | undefined
  sortOrder: number
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
