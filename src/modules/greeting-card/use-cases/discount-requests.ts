import { conflict, notFound, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { getCurrentOrganization } from "@/modules/organization/use-cases/get-current-organization"
import { DiscountRepository } from "../infra/discount-repository"
import { GreetingMessageRepository } from "../infra/greeting-message-repository"
import { discountError, discountVndOf, parseMaxDiscountPercent, type DiscountAsk } from "../domain/discount-request"
import { roleOf } from "../domain/internal-message"
import { visibleTarget } from "./internal-messages"

async function maxPercent(ctx: TenantContext) {
  return parseMaxDiscountPercent((await getCurrentOrganization(ctx))?.settings)
}

/** Sale xin giảm giá cho một đơn đã đặt — gửi thẳng Điều hành, mỗi đơn một yêu cầu chờ duyệt. */
export async function requestDiscount(
  ctx: TenantContext,
  input: { orderId: string; ask: DiscountAsk; reason: string },
  repo = new DiscountRepository(),
) {
  const reason = input.reason.trim()
  if (reason.length < 3) throw validationFailed({ reason: "Ghi lý do xin giảm (ít nhất 3 ký tự)" })
  await visibleTarget(ctx, { orderId: input.orderId }, new GreetingMessageRepository())
  const order = await repo.orderBase(ctx, input.orderId)
  if (!order) throw notFound()
  if (order.status === "CANCELLED") throw conflict("Đơn đã huỷ")
  const error = discountError(input.ask, order.baseTotalVnd, await maxPercent(ctx))
  if (error) throw validationFailed({ discount: error })
  if ((await repo.listPending(ctx)).some((r) => r.order_id === order.id)) throw conflict("Đơn này đang có một yêu cầu giảm giá chờ duyệt")

  const created = await repo.createRequest(ctx, {
    orderId: order.id, senderRole: roleOf(ctx.capabilities) ?? "SALE", reason,
    payload: { status: "PENDING", baseTotalVnd: order.baseTotalVnd, requestedVnd: discountVndOf(input.ask, order.baseTotalVnd), ...input.ask },
  })
  return { id: created.id, createdAt: created.created_at.toISOString() }
}

/**
 * Điều hành duyệt (giữ mức xin hoặc sửa mức — vẫn trong trần) hoặc từ chối, kèm ghi chú.
 * Duyệt thì giá chốt của đơn cập nhật ngay; người xin nhận kết quả trong Hộp việc.
 */
export async function decideDiscount(
  ctx: TenantContext,
  input: { requestId: string; approve: boolean; ask?: DiscountAsk | undefined; note: string },
  repo = new DiscountRepository(),
) {
  const note = input.note.trim()
  if (!input.approve && note.length < 3) throw validationFailed({ note: "Ghi lý do từ chối để sale báo lại khách" })
  const pending = (await repo.listPending(ctx)).find((r) => r.id === input.requestId)
  if (!pending?.order_id) throw (await new GreetingMessageRepository().findById(ctx, input.requestId)) ? conflict("Yêu cầu này đã được xử lý") : notFound()
  const order = await repo.orderBase(ctx, pending.order_id)
  if (!order) throw notFound()

  const requested = pending.payload as unknown as DiscountAsk
  const ask: DiscountAsk = input.ask ?? (typeof requested.percent === "number" ? { percent: requested.percent } : { amountVnd: requested.amountVnd })
  if (input.approve) {
    const error = discountError(ask, order.baseTotalVnd, await maxPercent(ctx))
    if (error) throw validationFailed({ discount: error })
  }
  return repo.decide(ctx, {
    requestId: input.requestId, approve: input.approve, approvedVnd: input.approve ? discountVndOf(ask, order.baseTotalVnd) : 0,
    approvedPercent: ask.percent, note,
  })
}
