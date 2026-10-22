import { coordinatorActionBlocker, type CoordinatorAction } from "./brochure-commerce-rules"
import { paymentGateBlocker, type BrochurePaymentPolicy } from "./brochure-payment-policy"
import { photoApprovalBlockerAt, type PhotoApprovalState } from "./photo-approval"

export interface CoordinatorOrderFacts {
  status: string
  productionStatus: string
  deliveryStatus: string
  totalVnd: number
  paidVnd: number
  photoApproval?: Pick<PhotoApprovalState, "status" | "uploadedAt" | "countdownMinutes" | "autoApprove"> | null | undefined
}

/**
 * Lý do chặn từng tác vụ Điều phối — CÙNG một hàm cho máy chủ (`loadForAction`), Lưới thẻ và Kanban
 * (PO 17/10/2026), để hai giao diện không lệch nhau và không lệch máy chủ. `policy` phải là chính sách
 * hiệu lực (`effectivePaymentPolicy`): cờ ảnh/thu đủ đã lấy theo Quy trình vận hành.
 */
export function coordinatorBlockerOf(
  o: CoordinatorOrderFacts,
  policy: BrochurePaymentPolicy,
  opts: { isUrgent: boolean; nowMs: number },
): (action: CoordinatorAction) => string | null {
  const state = { status: o.status, productionStatus: o.productionStatus, deliveryStatus: o.deliveryStatus }
  return (action) =>
    coordinatorActionBlocker(action, state, { skipPhoto: policy.requireProductPhotoQC === false })
    ?? paymentGateBlocker(action, policy, { totalVnd: o.totalVnd, paidVnd: o.paidVnd }, { isUrgent: opts.isUrgent })
    ?? (action === "dispatch-shipping" ? photoApprovalBlockerAt(o.photoApproval, opts.nowMs) : null)
}

/** Nhãn nút giao: "Giao lại" sau lần giao không thành công; "Chờ TT lần 2" khi đơn cọc bị chặn vì tiền. */
export function dispatchActionLabel(o: CoordinatorOrderFacts, policy: BrochurePaymentPolicy, isUrgent: boolean): string {
  if (o.deliveryStatus === "FAILED") return "Giao lại"
  const deposit = o.paidVnd > 0 && o.paidVnd < o.totalVnd
  if (deposit && paymentGateBlocker("dispatch-shipping", policy, { totalVnd: o.totalVnd, paidVnd: o.paidVnd }, { isUrgent })) return "Chờ TT lần 2"
  return "Giao Ship"
}

/**
 * Nút trên thẻ đơn ở tab Điều phối (Lưới thẻ và Kanban) — chỉ hiện việc làm được ở bước hiện tại (PO 16/10/2026).
 * Trước đây thẻ nào cũng hiện đủ các nút và làm mờ nút sai bước. Ngoại lệ: hoa đã cắm xong mà còn
 * chờ (thanh toán lần 2, khách duyệt ảnh) → vẫn hiện "Giao Ship" ở dạng mờ kèm lý do, vì đó là việc kế tiếp.
 * Pure TypeScript — máy chủ vẫn kiểm từng tác vụ.
 */
export const COORDINATOR_CARD_ACTIONS: readonly CoordinatorAction[] = [
  "assign-florist", "product-photo", "dispatch-shipping", "recipient-photo", "delivery-failed",
]

export interface CardActionView {
  action: CoordinatorAction
  /** `null` = bấm được; có lý do = hiện mờ kèm lý do */
  blocker: string | null
}

export function visibleCoordinatorActions(
  blockerOf: (action: CoordinatorAction) => string | null,
  s: { status: string; productionStatus: string; deliveryStatus: string },
): CardActionView[] {
  const shipped = s.deliveryStatus === "DISPATCHED" || s.deliveryStatus === "DELIVERING"
  const finished = s.status === "CANCELLED" || s.status === "COMPLETED" || s.deliveryStatus === "DELIVERED"
  const readyToShip = !finished && !shipped && (s.productionStatus === "READY" || s.productionStatus === "DONE")
  return COORDINATOR_CARD_ACTIONS.flatMap((action): CardActionView[] => {
    const blocker = blockerOf(action)
    if (blocker === null) return [{ action, blocker }]
    if (action === "dispatch-shipping" && readyToShip) return [{ action, blocker }]
    return []
  })
}

/** Lý do khi thẻ không còn nút nào (vd. đơn chưa thu tiền mà tiệm yêu cầu thu trước khi cắm). */
export function noActionReason(blockerOf: (action: CoordinatorAction) => string | null): string {
  return blockerOf("assign-florist") ?? blockerOf("dispatch-shipping") ?? "Chưa có việc cho Điều phối ở bước này"
}
