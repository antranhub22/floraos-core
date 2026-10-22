import type { TenantContext } from "@/core/tenancy"
import type { MessageRole } from "../domain/internal-message"
import { claimOrderAction, type InboxAction, type PipelineLike } from "../domain/inbox"
import { cancelledNotifyAction, dismissalRequestActions } from "../domain/inbox-follow-ups"
import { canDecideDismissal } from "../domain/dismissal-policy"
import { InboxFollowUpRepository } from "../infra/inbox-follow-up-repository"
import { defaultOwnerOf } from "./share-links"
import { assertOrderInScope } from "./order-scope"

/**
 * Việc Hộp việc ngoài các bước của bảng theo dõi (PO 17/10/2026):
 * - người có quyền duyệt bỏ hiển thị (R6): đề xuất bỏ hiển thị đang chờ;
 * - Sale: đơn chưa có Sale phụ trách (cả khi Sale chỉ xem khách của mình) và đơn khách đã đặt bị huỷ cần báo khách.
 */
export async function followUpInboxActions(
  ctx: TenantContext,
  role: MessageRole,
  pipeline: readonly PipelineLike[],
  scope: string | null,
  now: Date,
  repo = new InboxFollowUpRepository(),
): Promise<InboxAction[]> {
  const out: InboxAction[] = canDecideDismissal(ctx.capabilities) ? dismissalRequestActions(pipeline, now) : []
  if (role !== "SALE") return out

  const fallbackOwner = await defaultOwnerOf(ctx.organizationId)
  // Bảng theo dõi của Sale "chỉ khách của mình" lọc mất đơn chưa ai nhận; tiệm có người phụ trách mặc định thì đơn đó đã có chủ
  if (scope && !fallbackOwner) {
    for (const row of await repo.listUnassignedOpenOrders(ctx)) out.push(claimOrderAction(row))
  }
  // Link cũ "public" thuộc người phụ trách mặc định
  const saleIds = fallbackOwner === ctx.userId ? [ctx.userId, "public"] : [ctx.userId]
  for (const row of await repo.listCancelledToNotify(ctx, saleIds, now)) out.push(cancelledNotifyAction(row, now))
  return out
}

/** Sale nhận đơn chưa có người phụ trách — không cần trong phạm vi xem (đơn chưa thuộc ai). */
export async function claimOrder(ctx: TenantContext, orderId: string, repo = new InboxFollowUpRepository()) {
  return repo.claim(ctx, orderId)
}

/** Sale xác nhận đã báo khách đơn bị huỷ — Sale "chỉ khách của mình" chỉ trên đơn của mình (404 nếu không). */
export async function markCustomerNotified(ctx: TenantContext, orderId: string, repo = new InboxFollowUpRepository()) {
  await assertOrderInScope(ctx, orderId)
  return repo.markCustomerNotified(ctx, orderId)
}
