import { notFound, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { GreetingMessageRepository, type ThreadTarget } from "../infra/greeting-message-repository"
import {
  MAX_MESSAGE_LENGTH, MESSAGE_ROLE_LABEL, recipientLabel, resolveRecipient, roleOf, isAddressedTo,
  type MessageRole, type RecipientChoice,
} from "../domain/internal-message"
import { PIPELINE_STEPS } from "../domain/tracking-pipeline-types"
import { resolveSaleScope } from "./order-scope"

export interface ThreadRef {
  orderId?: string | undefined
  sessionId?: string | undefined
}

export interface ThreadMessageView {
  id: string
  stepKey: string
  stepTitle: string
  senderName: string
  senderRoleLabel: string
  toLabel: string | null
  body: string
  createdAt: string
  mine: boolean
  /** Gửi cho tôi và tôi chưa đọc. */
  unread: boolean
  /** Ghi chú kiểu cũ (không có người nhận, không trả lời được). */
  legacy: boolean
}

const stepTitle = (key: string) => PIPELINE_STEPS.find((s) => s.id === key)?.shortTitle ?? "Chung"

/** Đơn/link phải thuộc tổ chức và nằm trong phạm vi xem của người dùng (sale "chỉ khách của mình"). */
async function visibleTarget(ctx: TenantContext, ref: ThreadRef, repo: GreetingMessageRepository): Promise<ThreadTarget> {
  const target = await repo.findTarget(ctx, ref)
  if (!target) throw notFound()
  const scope = await resolveSaleScope(ctx)
  if (scope && target.saleId !== scope) throw notFound()
  return target
}

export async function getThread(ctx: TenantContext, ref: ThreadRef, repo = new GreetingMessageRepository()) {
  const target = await visibleTarget(ctx, ref, repo)
  const [messages, legacy, members] = await Promise.all([repo.listThread(ctx, target), repo.listLegacyNotes(ctx, target), repo.activeMembers(ctx)])
  const nameOf = new Map(members.map((m) => [m.userId, m.name]))
  const me = { userId: ctx.userId, role: roleOf(ctx.capabilities) }
  const views: ThreadMessageView[] = [
    ...legacy.map((n) => ({
      id: n.id, stepKey: n.stepKey, stepTitle: stepTitle(n.stepKey),
      senderName: n.senderName ?? (n.senderId ? nameOf.get(n.senderId) : null) ?? "Nhân viên",
      senderRoleLabel: n.role === "ADMIN" ? "Điều hành" : n.role === "COORDINATOR" || n.role === "FLORIST" ? "Điều phối" : "Sale",
      toLabel: null, body: n.body, createdAt: n.createdAt.toISOString(), mine: n.senderId === ctx.userId, unread: false, legacy: true,
    })),
    ...messages.map((m) => ({
      id: m.id, stepKey: m.stepKey, stepTitle: stepTitle(m.stepKey),
      senderName: nameOf.get(m.senderId) ?? "Nhân viên đã rời",
      senderRoleLabel: MESSAGE_ROLE_LABEL[m.senderRole as MessageRole] ?? "Nhân viên",
      toLabel: recipientLabel({ toRole: m.toRole, toUserName: m.toUserId ? nameOf.get(m.toUserId) ?? "Nhân viên" : null }),
      body: m.body, createdAt: m.createdAt.toISOString(), mine: m.senderId === ctx.userId,
      unread: !m.readByMe && isAddressedTo(m, me), legacy: false,
    })),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return { label: target.label, ownerSaleName: target.saleId && target.saleId !== "public" ? nameOf.get(target.saleId) ?? null : null, messages: views }
}

export async function sendMessage(
  ctx: TenantContext,
  input: ThreadRef & { stepKey: string; to: RecipientChoice; body: string; replyToId?: string | undefined },
  repo = new GreetingMessageRepository(),
) {
  const body = input.body.trim()
  if (!body || body.length > MAX_MESSAGE_LENGTH) throw validationFailed({ body: `Nội dung từ 1 đến ${MAX_MESSAGE_LENGTH} ký tự` })
  const target = await visibleTarget(ctx, input, repo)

  let recipient = resolveRecipient(input.to, target.saleId)
  if (input.replyToId) {
    // Trả lời luôn về đúng người đã nhắn, trong đúng đơn đó
    const original = await repo.findById(ctx, input.replyToId)
    const sameThread = original && ((target.orderId && original.orderId === target.orderId) || (target.sessionId && original.sessionId === target.sessionId))
    if (!original || !sameThread) throw notFound()
    recipient = { toRole: null, toUserId: original.senderId === ctx.userId ? original.toUserId : original.senderId }
    if (!recipient.toUserId) recipient = { toRole: original.toRole as MessageRole | null, toUserId: null }
  }
  if (recipient.toUserId) {
    const members = await repo.activeMembers(ctx)
    if (!members.some((m) => m.userId === recipient.toUserId)) throw notFound()
  }
  if (!recipient.toRole && !recipient.toUserId) throw validationFailed({ to: "Chọn người nhận" })

  const msg = await repo.create(ctx, {
    target, stepKey: input.stepKey, senderRole: roleOf(ctx.capabilities) ?? "SALE",
    toRole: recipient.toRole, toUserId: recipient.toUserId, body, replyToId: input.replyToId ?? null,
  })
  return { id: msg.id, createdAt: msg.createdAt.toISOString() }
}

export async function markMessagesRead(ctx: TenantContext, messageIds: string[], repo = new GreetingMessageRepository()) {
  return { marked: await repo.markRead(ctx, messageIds) }
}

/** Lựa chọn "Gửi cho": 3 vai + từng thành viên (trừ chính mình). */
export async function listRecipients(ctx: TenantContext, repo = new GreetingMessageRepository()) {
  const members = (await repo.activeMembers(ctx)).filter((m) => m.userId !== ctx.userId).sort((a, b) => a.name.localeCompare(b.name, "vi"))
  return {
    roles: (Object.keys(MESSAGE_ROLE_LABEL) as MessageRole[]).map((role) => ({ role, label: MESSAGE_ROLE_LABEL[role] })),
    members,
  }
}
