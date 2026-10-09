/**
 * Hộp việc: gom "cần làm", "tin nhắn", "cập nhật" của một người về một chỗ, theo vai.
 * Pure TypeScript — nhận dữ liệu đã đọc, không truy vấn.
 */
import type { MessageRole } from "./internal-message"
import type { StuckInfo } from "./step-sla"
import type { TrackingPipelineStepId } from "./tracking-pipeline-types"
import type { ChangeItem } from "./order-change-request"

/** Tab nơi xử lý việc đó trên trang Thẻ chào. */
export type InboxTab = "payment" | "sales" | "coordinator" | "tracking"

export interface InboxAction {
  id: string
  kind: "STUCK" | "CONFIRM_PAYMENT" | "QUOTE" | "ASSIGN" | "UNMATCHED_PAYMENTS" | "DISCOUNT" | "CHANGE_REQUEST" | "REDELIVER" | "CANCELLATION_REQUEST"
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
  /** Chỉ với CHANGE_REQUEST: khách xin đổi gì — duyệt/từ chối ngay trong Hộp việc. */
  change?: {
    requestId: string
    changes: ChangeItem[]
    note: string | null
    expectedFeeDeltaVnd: number
    requestedAt: string
  } | undefined
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
  currentStepId: TrackingPipelineStepId
  currentStepTitle: string
  stepStartedAt: string
  stuck: StuckInfo | null
  saleId: string | null
  /** Lần giao gần nhất không thành công — chờ Điều phối giao lại */
  deliveryFailed?: boolean | undefined
}

const TAB_OF_ROLE: Record<MessageRole, InboxTab> = { ADMIN: "payment", SALE: "sales", COORDINATOR: "coordinator" }
const COORDINATOR_STEPS = new Set<TrackingPipelineStepId>(["STEP_5_PAYMENT_CONFIRMED", "STEP_6_ARRANGING", "STEP_7_READY_QC", "STEP_8_DELIVERING", "STEP_9_COMPLETED"])
const code = (i: PipelineLike) => (i.orderCode ? `Đơn ${i.orderCode}` : `Link ${i.sendCode}`)

/** Việc cần làm của một vai từ quy trình theo dõi (sale: chỉ đơn của chính mình). */
export function inboxActions(items: PipelineLike[], role: MessageRole, userId: string): InboxAction[] {
  const mine = role === "SALE" ? items.filter((i) => i.saleId === userId) : items
  const out: InboxAction[] = []
  for (const i of mine) {
    const base = { orderId: i.orderId ?? null, sessionId: i.sessionId || null, customerName: i.customerName, imageUrl: i.productImageUrl ?? null }
    if (i.stuck?.owner === role) {
      out.push({ ...base, id: `stuck:${i.id}`, kind: "STUCK", title: i.stuck.message, detail: `${code(i)} · ${i.productName}`, tab: TAB_OF_ROLE[role], urgency: 1000 + i.stuck.overdueMinutes })
      continue
    }
    if (role === "ADMIN" && i.type === "ORDER" && i.totalVnd <= 0 && i.currentStepId !== "STEP_9_COMPLETED") {
      out.push({ ...base, id: `quote:${i.id}`, kind: "QUOTE", title: "Báo giá mẫu chưa niêm yết", detail: `${code(i)} · ${i.productName}`, tab: "payment", urgency: 500 })
    } else if (role === "ADMIN" && i.currentStepId === "STEP_4_PAYMENT_PENDING") {
      out.push({ ...base, id: `pay:${i.id}`, kind: "CONFIRM_PAYMENT", title: "Đối chiếu và xác nhận tiền", detail: `${code(i)} · khách báo đã chuyển`, tab: "payment", urgency: 400 })
    } else if (role === "COORDINATOR" && i.deliveryFailed) {
      out.push({ ...base, id: `redeliver:${i.id}`, kind: "REDELIVER", title: "Giao không thành công — hẹn giao lại", detail: `${code(i)} · ${i.productName}`, tab: "coordinator", urgency: 900 })
    } else if (role === "COORDINATOR" && i.currentStepId === "STEP_5_PAYMENT_CONFIRMED") {
      out.push({ ...base, id: `assign:${i.id}`, kind: "ASSIGN", title: "Phân công thợ cắm hoa", detail: `${code(i)} · ${i.productName}`, tab: "coordinator", urgency: 300 })
    }
  }
  return out.sort((a, b) => b.urgency - a.urgency)
}

/** Đơn đổi bước trong `hours` giờ gần nhất mà người này cần biết. */
export function inboxUpdates(items: PipelineLike[], role: MessageRole, userId: string, now: Date, hours = 24): PipelineLike[] {
  const since = now.getTime() - hours * 3_600_000
  const relevant = (i: PipelineLike) =>
    role === "SALE" ? i.saleId === userId : role === "COORDINATOR" ? i.type === "ORDER" && COORDINATOR_STEPS.has(i.currentStepId) : i.type === "ORDER"
  return items
    .filter((i) => relevant(i) && Date.parse(i.stepStartedAt) >= since)
    .sort((a, b) => Date.parse(b.stepStartedAt) - Date.parse(a.stepStartedAt))
    .slice(0, 20)
}
