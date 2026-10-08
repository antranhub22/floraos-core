/**
 * Đề xuất Hủy đơn & Hoàn tiền theo Thẻ chào (Task #1).
 * Luồng: Sale / Điều phối đề xuất -> Điều hành duyệt (APPROVE / REJECT) -> Cập nhật Đơn / Sổ thu.
 * Pure TypeScript — không phụ thuộc DB hay Prisma.
 */

export type CancellationType = "CANCEL_ONLY" | "FULL_REFUND" | "PARTIAL_REFUND"
export type CancellationStatus = "PENDING" | "APPROVED" | "REJECTED"

export const CANCELLATION_TYPE_LABEL: Record<CancellationType, string> = {
  CANCEL_ONLY: "Hủy đơn (không hoàn tiền)",
  FULL_REFUND: "Hủy đơn & Hoàn tiền toàn phần",
  PARTIAL_REFUND: "Hoàn tiền một phần",
}

export interface CancellationProposal {
  type: CancellationType
  reason: string
  refundAmountVnd: number
  note?: string | undefined
}

export interface CancellationPayload extends CancellationProposal {
  status: CancellationStatus
  orderId: string
  orderCode: string
  totalVnd: number
  paidVnd: number
  proposedBy: string
  proposedAt: string
  decidedBy?: string | undefined
  decidedAt?: string | undefined
  decidedNote?: string | undefined
  actualRefundVnd?: number | undefined
}

/**
 * Kiểm tra tính hợp lệ của đề xuất hủy / hoàn tiền.
 * Trả về chuỗi lỗi tiếng Việt nếu không hợp lệ, hoặc null nếu hợp lệ.
 */
export function validateCancellationProposal(
  proposal: CancellationProposal,
  order: { status: string; totalVnd: number; paidVnd: number }
): string | null {
  if (order.status === "CANCELLED") {
    return "Đơn hàng này đã bị hủy trước đó."
  }
  if (!proposal.reason || proposal.reason.trim().length < 3) {
    return "Vui lòng nhập lý do hủy/hoàn tiền chi tiết (tối thiểu 3 ký tự)."
  }

  const refund = Math.max(0, Math.round(proposal.refundAmountVnd || 0))

  if (proposal.type === "FULL_REFUND") {
    if (order.paidVnd <= 0) {
      return "Đơn hàng chưa thu tiền, không thể hoàn tiền toàn phần (chọn Hủy đơn)."
    }
  }

  if (proposal.type === "PARTIAL_REFUND") {
    if (order.paidVnd <= 0) {
      return "Đơn hàng chưa có khoản thu nào để hoàn tiền."
    }
    if (refund <= 0) {
      return "Số tiền hoàn một phần phải lớn hơn 0đ."
    }
    if (refund >= order.paidVnd) {
      return `Số tiền hoàn một phần phải nhỏ hơn tổng số tiền đã thu (${order.paidVnd.toLocaleString("vi-VN")}đ). Nếu hoàn toàn bộ, hãy chọn Hoàn tiền toàn phần.`
    }
  }

  if (refund > order.paidVnd) {
    return `Số tiền hoàn không được vượt quá số tiền khách đã trả (${order.paidVnd.toLocaleString("vi-VN")}đ).`
  }

  return null
}
