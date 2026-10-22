/**
 * Kiểu dữ liệu của Hộp việc — tách khỏi `inbox.ts` để giữ tệp quy tắc dưới 350 dòng.
 * Pure TypeScript.
 */
import type { StuckInfo } from "./step-sla"
import type { TrackingPipelineStepId } from "./tracking-pipeline-types"
import type { ChangeItem } from "./order-change-request"
import type { DismissalInfo } from "./dismissal-policy"

/** Tab nơi xử lý việc đó trên trang Thẻ chào. */
export type InboxTab = "payment" | "sales" | "coordinator" | "tracking"

export type InboxActionKind =
  | "STUCK"
  | "CONFIRM_PAYMENT"
  | "QUOTE"
  | "ASSIGN"
  | "UNMATCHED_PAYMENTS"
  | "DISCOUNT"
  | "CHANGE_REQUEST"
  | "REDELIVER"
  | "CANCELLATION_REQUEST"
  | "REMIND_BALANCE_PAYMENT"
  | "WAITING_SECOND_PAYMENT"
  | "COLLECT_POST_DELIVERY_BALANCE"
  | "FOLLOW_UP_LEAD"
  | "REMIND_DEPOSIT"
  | "CLAIM_ORDER"
  | "SEND_PHOTO_QC"
  | "DELIVERY_FAILED_SALE_CONTACT"
  | "CHECK_ARRANGING_PROGRESS"
  | "QC_INSPECTION"
  | "ASSIGN_SHIPPER"
  | "CANCELLATION_FOLLOW_UP"
  | "CANCELLED_REPORTED_PAYMENT"
  | "DISMISSAL_REQUEST"
  | "CANCELLED_NOTIFY_CUSTOMER"

export interface InboxAction {
  id: string
  kind: InboxActionKind
  title: string
  detail: string
  orderId: string | null
  sessionId: string | null
  customerName: string | null
  imageUrl: string | null
  tab: InboxTab
  /** Càng lớn càng gấp — kẹt quá lâu lên đầu. */
  urgency: number
  /** Chỉ với DISCOUNT: để Điều hành duyệt/từ chối ngay trong Hộp việc. */
  discount?: {
    requestId: string
    requester: string
    reason: string
    baseTotalVnd: number
    requestedVnd: number
    percent: number | null
    maxPercent: number
  } | undefined
  /** Chỉ với CANCELLATION_FOLLOW_UP: đơn hệ thống tự huỷ, Điều hành xác nhận đã hoàn tiền / liên hệ khách. */
  followUp?: { requestId: string; refundDueVnd: number; reason: string } | undefined
  /** Chỉ với CANCELLED_REPORTED_PAYMENT: đơn đã huỷ, khách đã báo chuyển khoản — kiểm sao kê rồi chốt. */
  reportedPayment?: { orderId: string; expectedVnd: number; proofUrl: string | null } | undefined
  /** Chỉ với CHANGE_REQUEST: khách xin đổi gì — duyệt/từ chối ngay trong Hộp việc. */
  change?: {
    requestId: string
    changes: ChangeItem[]
    note: string | null
    expectedFeeDeltaVnd: number
    requestedAt: string
  } | undefined
  /** Chỉ với DISMISSAL_REQUEST: đề xuất bỏ hiển thị đơn/link — Điều hành duyệt/từ chối ngay. */
  dismissalRequest?: { targetId: string; type: "ORDER" | "SESSION"; proposedAt: string } | undefined
  /** Chỉ với CANCELLED_NOTIFY_CUSTOMER: hạn báo khách (ISO) — Sale bấm "Đã báo khách" khi xong. */
  customerNotice?: { orderId: string; deadline: string } | undefined
}

export interface PipelineLike {
  id: string
  type: "ORDER" | "SESSION"
  orderId?: string | null | undefined
  sessionId: string
  orderCode?: string | null | undefined
  sendCode: string
  customerName: string
  productName: string
  productImageUrl?: string | null | undefined
  totalVnd: number
  paidVnd?: number | undefined
  balanceVnd?: number | undefined
  currentStepId: TrackingPipelineStepId
  currentStepTitle: string
  /** Trạng thái đơn (CONFIRMED, PROCESSING…) — để biết Điều phối đã nhận đơn chưa. */
  orderStatus?: string | null | undefined
  productionStatus?: string | null | undefined
  deliveryStatus?: string | null | undefined
  stepStartedAt: string
  stuck: StuckInfo | null
  saleId: string | null
  coordinatorId?: string | null | undefined
  /** Lần giao gần nhất không thành công — chờ Điều phối giao lại */
  deliveryFailed?: boolean | undefined
  sessionStatus?: string | null | undefined
  customerReportedPaid?: boolean | undefined
  /** Ảnh bill chuyển khoản lần 1 khách đã gửi. */
  paymentProofUrl?: string | null | undefined
  /** Đơn đã huỷ / đã bỏ hiển thị — không còn việc thu tiền, cắm, giao */
  isCancelled?: boolean | undefined
  /** Đề xuất bỏ hiển thị (đang chờ duyệt / đã duyệt / bị từ chối). */
  dismissal?: DismissalInfo | undefined
}
