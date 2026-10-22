/**
 * Danh mục tình huống Thẻ chào — điểm vào duy nhất (SSOT, PO 17/10/2026).
 * Gắn danh mục với mã: mỗi loại việc trong Hộp việc và mỗi bước quy trình PHẢI chỉ tới tình huống —
 * thêm loại việc/bước mới mà quên viết hướng dẫn thì không biên dịch được. Pure TypeScript.
 */
import type { InboxAction } from "../inbox"
import type { TrackingPipelineStepId } from "../tracking-pipeline-types"
import type { Situation } from "./situation-types"
import { LINK_SITUATIONS } from "./situations-link"
import { PAYMENT_SITUATIONS } from "./situations-payment"
import { PRODUCTION_SITUATIONS } from "./situations-production"
import { CANCELLATION_SITUATIONS } from "./situations-cancellation"
import { CHANGE_SITUATIONS } from "./situations-change"

const ALL = [
  ...LINK_SITUATIONS,
  ...PAYMENT_SITUATIONS,
  ...PRODUCTION_SITUATIONS,
  ...CHANGE_SITUATIONS,
  ...CANCELLATION_SITUATIONS,
] as const

export type SituationId = (typeof ALL)[number]["id"]
export const SITUATIONS: readonly Situation[] = ALL

export function situationById(id: SituationId): Situation {
  const s = SITUATIONS.find((x) => x.id === id)
  if (!s) throw new Error(`Không có tình huống ${id}`)
  return s
}

/** Việc trong Hộp việc → tình huống hướng dẫn. Thiếu loại việc nào là lỗi biên dịch. */
export const INBOX_KIND_SITUATIONS: Record<InboxAction["kind"], readonly SituationId[]> = {
  STUCK: ["STEP_STUCK"],
  CONFIRM_PAYMENT: ["FIRST_PAYMENT_REPORTED", "SECOND_PAYMENT_REPORTED", "DEPOSIT_PENDING_ADMIN_APPROVAL"],
  QUOTE: ["ORDER_AWAITING_QUOTE"],
  ASSIGN: ["ORDER_AWAITING_ACCEPT"],
  UNMATCHED_PAYMENTS: ["UNMATCHED_BANK_TRANSFER"],
  DISCOUNT: ["DISCOUNT_REQUEST_PENDING"],
  CHANGE_REQUEST: ["CUSTOMER_CHANGE_REQUEST_PENDING"],
  REDELIVER: ["DELIVERY_FAILED"],
  CANCELLATION_REQUEST: ["CANCELLATION_PROPOSAL_PENDING"],
  REMIND_BALANCE_PAYMENT: ["SECOND_PAYMENT_DUE"],
  WAITING_SECOND_PAYMENT: ["SECOND_PAYMENT_DUE"],
  COLLECT_POST_DELIVERY_BALANCE: ["POST_DELIVERY_DEBT"],
  FOLLOW_UP_LEAD: ["CUSTOMER_BROWSING"],
  REMIND_DEPOSIT: ["ORDER_PLACED_AWAITING_TRANSFER"],
  CLAIM_ORDER: ["ORDER_UNASSIGNED_SALE"],
  SEND_PHOTO_QC: ["READY_TO_DISPATCH"],
  DELIVERY_FAILED_SALE_CONTACT: ["DELIVERY_FAILED"],
  CHECK_ARRANGING_PROGRESS: ["ARRANGING_IN_PROGRESS"],
  QC_INSPECTION: ["READY_TO_DISPATCH"],
  ASSIGN_SHIPPER: ["READY_TO_DISPATCH"],
  CANCELLATION_FOLLOW_UP: ["CANCELLATION_REFUND_DUE"],
  CANCELLED_REPORTED_PAYMENT: ["CANCELLED_REPORTED_PAYMENT"],
  DISMISSAL_REQUEST: ["DISMISSAL_PENDING"],
  CANCELLED_NOTIFY_CUSTOMER: ["SALE_CANCELLATION_REMINDER"],
}

/** Bước theo dõi → các tình huống có thể gặp ở bước đó. Thiếu bước nào là lỗi biên dịch. */
export const STEP_SITUATIONS: Record<TrackingPipelineStepId, readonly SituationId[]> = {
  STEP_1_OPENED: ["LINK_CREATED_NOT_SENT", "LINK_SENT_NOT_OPENED"],
  STEP_2_CHOOSING: ["CUSTOMER_BROWSING"],
  STEP_3_FILLING_FORM: ["ORDER_PLACED_AWAITING_TRANSFER", "ORDER_AWAITING_QUOTE", "ORDER_UNASSIGNED_SALE"],
  STEP_4_PAYMENT_PENDING: ["FIRST_PAYMENT_REPORTED", "ORDER_AWAITING_ACCEPT", "COORDINATOR_DEPOSIT_APPROVAL"],
  STEP_5_PAYMENT_CONFIRMED: ["ORDER_AWAITING_ACCEPT", "ACCEPT_BLOCKED_BY_PAYMENT", "ORDER_ACCEPTED_AWAITING_FLORIST", "DEPOSIT_PENDING_ADMIN_APPROVAL"],
  STEP_6_ARRANGING: ["ARRANGING_IN_PROGRESS"],
  STEP_7_READY_QC: ["PHOTO_AWAITING_CUSTOMER_APPROVAL", "READY_TO_DISPATCH", "SECOND_PAYMENT_DUE", "SECOND_PAYMENT_REPORTED", "DELIVERY_FAILED"],
  STEP_8_DELIVERING: ["DELIVERING"],
  STEP_9_COMPLETED: ["DELIVERED_COMPLETED", "POST_DELIVERY_DEBT"],
}
