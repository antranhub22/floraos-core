/**
 * Thông báo huỷ đơn trên thẻ chào của khách (PO 16/10/2026).
 * Điều phối không nhận đơn / huỷ giữa chừng, Điều hành duyệt (hoặc hệ thống tự duyệt khi quá hạn)
 * → khách thấy ngay: tiệm quá tải, nhân viên liên hệ + hoàn tiền (nếu có) trong tối đa 2 tiếng.
 * Pure TypeScript — không phụ thuộc DB hay Prisma.
 */

/** Hạn tối đa nhân viên liên hệ khách (và hoàn tiền nếu có), tính từ lúc đơn được duyệt huỷ. */
export const CUSTOMER_CONTACT_WINDOW_MS = 2 * 60 * 60 * 1000

export interface CustomerCancellationNotice {
  cancelledAt: string
  /** Mốc cuối nhân viên liên hệ khách (ISO). */
  contactDeadline: string
  /** 0 = huỷ không hoàn tiền (khách chưa trả, hoặc tiệm duyệt huỷ không hoàn). */
  refundVnd: number
}

/** Một đề xuất huỷ đã lưu (tin nhắn hệ thống CANCELLATION_REQUEST). */
export interface CancellationRecord {
  senderRole: string
  payload: unknown
}

type Loose = Record<string, unknown>
const obj = (v: unknown): Loose => (v && typeof v === "object" ? (v as Loose) : {})

/**
 * Thông báo cho khách từ đề xuất huỷ của Điều phối đã được duyệt — `null` khi đơn không bị huỷ theo
 * luồng này (Sale đề xuất, bị từ chối, chỉ hoàn một phần…). Lý do nội bộ không bao giờ ra ngoài.
 */
export function customerCancellationNotice(records: readonly CancellationRecord[]): CustomerCancellationNotice | null {
  for (const r of records) {
    if (r.senderRole !== "COORDINATOR") continue
    const p = obj(r.payload)
    if (p.status !== "APPROVED" || (p.type !== "CANCEL_ONLY" && p.type !== "FULL_REFUND")) continue
    const decidedAt = typeof p.decidedAt === "string" ? new Date(p.decidedAt) : null
    if (!decidedAt || Number.isNaN(decidedAt.getTime())) continue
    const due = Number(obj(p.followUp).refundDueVnd)
    return {
      cancelledAt: decidedAt.toISOString(),
      contactDeadline: new Date(decidedAt.getTime() + CUSTOMER_CONTACT_WINDOW_MS).toISOString(),
      refundVnd: Number.isFinite(due) && due > 0 ? due : 0,
    }
  }
  return null
}
