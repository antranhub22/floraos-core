/**
 * Việc bổ sung cho Hộp việc ngoài các bước của bảng theo dõi (PO 17/10/2026):
 * - Điều hành duyệt/từ chối đề xuất bỏ hiển thị ngay trong Hộp việc (trước đây chỉ thấy trên thẻ Kanban).
 * - Sale phụ trách báo khách khi đơn khách đã đặt bị nhân viên/Điều phối huỷ — có hạn 2 tiếng, bấm "Đã báo khách".
 * Pure TypeScript — không phụ thuộc DB hay Prisma.
 */
import type { InboxAction, PipelineLike } from "./inbox-types"
import { dismissalOf, remainingDismissalMs } from "./dismissal-policy"
import { CUSTOMER_CONTACT_WINDOW_MS, vnDeadlineLabel } from "./customer-cancellation-notice"

type Loose = Record<string, unknown>
const obj = (v: unknown): Loose => (v && typeof v === "object" && !Array.isArray(v) ? (v as Loose) : {})

/** Đề xuất bỏ hiển thị đang chờ duyệt → việc của người có quyền duyệt (R6). */
export function dismissalRequestActions(items: readonly PipelineLike[], now: Date): InboxAction[] {
  const out: InboxAction[] = []
  for (const i of items) {
    const d = i.dismissal
    if (d?.status !== "PENDING" || i.isCancelled) continue
    const minutesLeft = Math.ceil(remainingDismissalMs(d.proposedAt, now.getTime()) / 60_000)
    out.push({
      id: `dismissal:${i.id}`, kind: "DISMISSAL_REQUEST",
      title: i.type === "ORDER" ? "Đề xuất bỏ hiển thị đơn — chờ bạn duyệt" : "Đề xuất bỏ hiển thị link — chờ bạn duyệt",
      detail: `${i.orderCode ? `Đơn ${i.orderCode}` : `Link ${i.sendCode}`} · ${d.proposedByName ?? "Nhân viên"}: ${d.reason} · ${
        minutesLeft > 0 ? `tự duyệt sau ${minutesLeft} phút nếu không ai xử lý` : "sắp được tự duyệt"}`,
      orderId: i.orderId ?? null, sessionId: i.sessionId || null, customerName: i.customerName, imageUrl: i.productImageUrl ?? null,
      tab: "tracking", urgency: 2400,
      dismissalRequest: { targetId: i.type === "ORDER" ? (i.orderId ?? i.id) : i.sessionId, type: i.type, proposedAt: d.proposedAt },
    })
  }
  return out
}

/** Người thao tác của bộ quét tự duyệt đề xuất huỷ của Điều phối — vẫn là huỷ do tiệm, Sale phải báo khách. */
export const COORDINATOR_CANCEL_SWEEP_ACTOR = "system:cancellation-timeout"
/** Chỉ nhắc đơn huỷ trong 7 ngày gần nhất. */
export const CUSTOMER_NOTICE_LOOKBACK_MS = 7 * 86_400_000

export interface SaleNotified { by: string; at: string }

/** Dấu "Sale đã báo khách" lưu trong `orders.pricing_rule_ref.saleNotifiedCustomer`. */
export function saleNotifiedOf(pricingRuleRef: unknown): SaleNotified | null {
  const v = obj(obj(pricingRuleRef).saleNotifiedCustomer)
  return typeof v.by === "string" && typeof v.at === "string" ? { by: v.by, at: v.at } : null
}

export interface CancelledOrderFacts {
  /** Lúc ghi sự kiện huỷ gần nhất (order_events to_value CANCELLED). */
  cancelledAt: Date | null
  /** Người huỷ của sự kiện đó; `system:*` = hệ thống. */
  cancelledBy: string | null
  pricingRuleRef: unknown
}

/**
 * Đơn khách đã đặt bị huỷ bởi nhân viên (sổ thu, duyệt đề xuất của Sale/Điều phối) hoặc bộ quét tự duyệt đề xuất
 * huỷ của Điều phối → Sale phải báo khách. KHÔNG nhắc: hệ thống tự huỷ vì quá hạn thanh toán/giữ chỗ (khách chưa trả),
 * đơn bỏ hiển thị (khách đổi ý/khảo giá), đơn đã báo khách, đơn huỷ quá 7 ngày.
 */
export function needsSaleCustomerNotice(f: CancelledOrderFacts, now: Date): boolean {
  if (!f.cancelledAt || now.getTime() - f.cancelledAt.getTime() > CUSTOMER_NOTICE_LOOKBACK_MS) return false
  if (!f.cancelledBy || (f.cancelledBy.startsWith("system:") && f.cancelledBy !== COORDINATOR_CANCEL_SWEEP_ACTOR)) return false
  const ref = obj(f.pricingRuleRef)
  if (Object.keys(obj(ref.paymentFailed)).length > 0) return false
  if (dismissalOf(ref.dismissal)?.status === "APPROVED") return false
  return saleNotifiedOf(ref) === null
}

/** Việc "Báo khách: đơn đã bị huỷ" của Sale phụ trách — quá hạn 2 tiếng thì gấp như việc kẹt. */
export function cancelledNotifyAction(
  r: { orderId: string; code: string; sessionId: string | null; customerName: string; cancelledAt: Date },
  now: Date,
): InboxAction {
  const deadline = new Date(r.cancelledAt.getTime() + CUSTOMER_CONTACT_WINDOW_MS)
  const overdueMinutes = Math.floor((now.getTime() - deadline.getTime()) / 60_000)
  const label = vnDeadlineLabel(deadline.toISOString())
  return {
    id: `cancelled-notify:${r.orderId}`, kind: "CANCELLED_NOTIFY_CUSTOMER", title: `Báo khách: đơn #${r.code} đã bị huỷ`,
    detail: overdueMinutes > 0 ? `Đã quá hạn báo khách (${label}) — gọi/nhắn khách ngay` : `Gọi/nhắn khách trước ${label}`,
    orderId: r.orderId, sessionId: r.sessionId, customerName: r.customerName, imageUrl: null, tab: "sales",
    urgency: overdueMinutes > 0 ? 1000 + overdueMinutes : 900,
    customerNotice: { orderId: r.orderId, deadline: deadline.toISOString() },
  }
}
