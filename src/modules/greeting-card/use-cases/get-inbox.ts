import type { TenantContext } from "@/core/tenancy"
import { GreetingMessageRepository } from "../infra/greeting-message-repository"
import { GreetingIntegrationRepository } from "../infra/greeting-integration-repository"
import { roleOf, MESSAGE_ROLE_LABEL, type MessageRole } from "../domain/internal-message"
import { inboxActions, inboxUpdates, type InboxAction } from "../domain/inbox"
import { getTrackingPipeline } from "./get-tracking-pipeline"
import { resolveSaleScope } from "./order-scope"

export interface InboxThread {
  key: string
  orderId: string | null
  sessionId: string | null
  title: string
  lastBody: string
  lastSender: string
  lastAt: string
  unread: number
  /** Tin chưa đọc mới nhất — để đánh dấu đã đọc khi mở. */
  unreadIds: string[]
}

/**
 * Hộp việc của người đang đăng nhập: việc cần làm (theo vai), tin nhắn gửi cho mình
 * (gom theo đơn), và đơn vừa đổi bước. Một lần gọi cho cả nút chuông lẫn bảng.
 */
export async function getInbox(ctx: TenantContext, now = new Date()) {
  const role: MessageRole = roleOf(ctx.capabilities) ?? "SALE"
  const repo = new GreetingMessageRepository()
  const [pipeline, messages, members, scope] = await Promise.all([
    getTrackingPipeline(ctx),
    repo.listAddressed(ctx, role),
    repo.activeMembers(ctx),
    resolveSaleScope(ctx),
  ])

  const actions: InboxAction[] = inboxActions(pipeline, role, ctx.userId)
  if (role === "ADMIN") {
    const unmatched = await new GreetingIntegrationRepository().listPaymentEvents(ctx, { status: "UNMATCHED", limit: 50 })
    if (unmatched.length > 0) {
      actions.unshift({
        id: "unmatched", kind: "UNMATCHED_PAYMENTS", title: `${unmatched.length >= 50 ? "50+" : unmatched.length} khoản tiền vào chưa khớp đơn`,
        detail: "Gắn từng khoản vào đúng đơn", orderId: null, sessionId: null, customerName: null, imageUrl: null, tab: "payment", urgency: 2000,
      })
    }
  }

  // Sale "chỉ khách của mình" không thấy trao đổi của đơn người khác, trừ tin gửi riêng cho mình
  const saleOf = scope ? await repo.saleOf(ctx, messages.flatMap((m) => (m.orderId ? [m.orderId] : [])), messages.flatMap((m) => (m.sessionId ? [m.sessionId] : []))) : null
  const visible = messages.filter((m) => !saleOf || m.toUserId === ctx.userId || saleOf.get(m.orderId ?? m.sessionId ?? "") === scope)
  const nameOf = new Map(members.map((m) => [m.userId, m.name]))
  const byKey = new Map(pipeline.map((p) => [p.orderId ?? p.sessionId, p]))
  const threads = new Map<string, InboxThread>()
  for (const m of visible) {
    const key = m.orderId ?? m.sessionId ?? m.id
    const item = byKey.get(key)
    const t = threads.get(key) ?? {
      key, orderId: m.orderId, sessionId: m.sessionId,
      title: item ? `${item.customerName} · ${item.orderCode ? `Đơn ${item.orderCode}` : `Link ${item.sendCode}`}` : "Trao đổi về đơn",
      lastBody: m.body, lastSender: `${nameOf.get(m.senderId) ?? "Nhân viên"} (${MESSAGE_ROLE_LABEL[m.senderRole as MessageRole] ?? "Nhân viên"})`,
      lastAt: m.createdAt.toISOString(), unread: 0, unreadIds: [],
    }
    if (!m.readByMe) {
      t.unread += 1
      t.unreadIds.push(m.id)
    }
    threads.set(key, t)
  }
  const threadList = [...threads.values()].sort((a, b) => (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0) || b.lastAt.localeCompare(a.lastAt))

  const updates = inboxUpdates(pipeline, role, ctx.userId, now).map((i) => ({
    id: i.id, orderId: i.orderId ?? null, sessionId: i.sessionId || null, customerName: i.customerName,
    title: i.currentStepTitle, code: i.orderCode ? `Đơn ${i.orderCode}` : `Link ${i.sendCode}`, at: i.stepStartedAt,
  }))
  const unreadMessages = threadList.reduce((n, t) => n + t.unread, 0)
  return { role, actions, threads: threadList.slice(0, 50), updates, counts: { actions: actions.length, unreadMessages, total: actions.length + unreadMessages } }
}
