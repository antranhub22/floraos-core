/**
 * Domain Types for Brochure Order & Session Tracking Pipeline.
 * Pure TypeScript — No Prisma or external infrastructure imports.
 */

export type TrackingPipelineStepId =
  | "STEP_1_OPENED"
  | "STEP_2_CHOOSING"
  | "STEP_3_FILLING_FORM"
  | "STEP_4_PAYMENT_PENDING"
  | "STEP_5_PAYMENT_CONFIRMED"
  | "STEP_6_ARRANGING"
  | "STEP_7_READY_QC"
  | "STEP_8_DELIVERING"
  | "STEP_9_COMPLETED"

export type InternalNoteRole = "ADMIN" | "SALE" | "COORDINATOR" | "FLORIST"

export interface StepDefinition {
  id: TrackingPipelineStepId
  title: string
  shortTitle: string
  roleResponsible: string
  orderIndex: number
}

export const PIPELINE_STEPS: StepDefinition[] = [
  {
    id: "STEP_1_OPENED",
    title: "Khách mở link chào",
    shortTitle: "Mở link",
    roleResponsible: "Khách hàng / Sale",
    orderIndex: 1,
  },
  {
    id: "STEP_2_CHOOSING",
    title: "Đang lướt chọn mẫu hoa",
    shortTitle: "Chọn mẫu",
    roleResponsible: "Khách hàng / Sale",
    orderIndex: 2,
  },
  {
    id: "STEP_3_FILLING_FORM",
    title: "Đang nhập Form Đặt ngay",
    shortTitle: "Nhập Form",
    roleResponsible: "Khách hàng / Sale",
    orderIndex: 3,
  },
  {
    id: "STEP_4_PAYMENT_PENDING",
    title: "Đã gửi đơn & Báo chuyển khoản",
    shortTitle: "Đã thanh toán",
    roleResponsible: "Khách hàng",
    orderIndex: 4,
  },
  {
    id: "STEP_5_PAYMENT_CONFIRMED",
    title: "Xác nhận tiền về tài khoản",
    shortTitle: "Xác nhận TT",
    roleResponsible: "Điều hành / Kế toán",
    orderIndex: 5,
  },
  {
    id: "STEP_6_ARRANGING",
    title: "Xưởng đang cắm hoa",
    shortTitle: "Đang cắm hoa",
    roleResponsible: "Điều phối / Thợ hoa",
    orderIndex: 6,
  },
  {
    id: "STEP_7_READY_QC",
    title: "Hoa hoàn thiện & Duyệt mẫu",
    shortTitle: "Đã cắm xong",
    roleResponsible: "Thợ hoa / Điều phối",
    orderIndex: 7,
  },
  {
    id: "STEP_8_DELIVERING",
    title: "Đang giao hoa đến người nhận",
    shortTitle: "Đang giao",
    roleResponsible: "Shipper / Điều phối",
    orderIndex: 8,
  },
  {
    id: "STEP_9_COMPLETED",
    title: "Giao thành công & Hoàn tất",
    shortTitle: "Hoàn tất",
    roleResponsible: "Shipper / Toàn bộ",
    orderIndex: 9,
  },
]

export const ROLE_LABELS: Record<InternalNoteRole, string> = {
  ADMIN: "Chủ tiệm / Điều hành",
  SALE: "Tư vấn Sale",
  COORDINATOR: "Điều phối xưởng",
  FLORIST: "Thợ cắm hoa",
}

export interface InternalNoteMessage {
  id: string
  orderId?: string | null | undefined
  sessionId?: string | null | undefined
  stepKey: TrackingPipelineStepId | "GENERAL"
  stepTitle: string
  role: InternalNoteRole
  roleLabel: string
  senderName: string
  content: string
  createdAt: string
}

export interface TrackingStepState {
  id: TrackingPipelineStepId
  title: string
  shortTitle: string
  roleResponsible: string
  orderIndex: number
  status: "completed" | "current" | "pending"
  completedAt?: string | null | undefined
  noteCount: number
}

export interface TrackingPipelineItem {
  id: string
  type: "ORDER" | "SESSION"
  orderId?: string | null | undefined
  sessionId: string
  orderCode?: string | null | undefined
  sendCode: string
  catalogName: string
  customerName: string
  customerPhone: string
  recipientName?: string | null | undefined
  recipientPhone?: string | null | undefined
  deliveryAddress?: string | null | undefined
  deliveryDate?: string | null | undefined
  deliveryTimeSlot?: string | null | undefined
  /** Khu vực giao khách chọn (theo bảng phí giao của tiệm) */
  deliveryZone?: string | null | undefined
  /** Sale phụ trách = người tạo/gửi link; link dùng chung → "Link dùng chung" */
  saleName: string
  cardMessage?: string | null | undefined
  productName: string
  productPrice: number
  productImageUrl?: string | null | undefined
  totalVnd: number
  paidVnd: number
  balanceVnd: number
  currentStepId: TrackingPipelineStepId
  currentStepTitle: string
  steps: TrackingStepState[]
  notes: InternalNoteMessage[]
  lastActiveAt: string
  createdAt: string
}
