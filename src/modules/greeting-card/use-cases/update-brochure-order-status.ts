import type { TenantContext } from "@/core/tenancy"
import { conflict, notFound } from "@/core/http/errors"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { coordinatorActionBlocker, type CoordinatorAction } from "../domain/brochure-commerce-rules"

/** Đơn của tổ chức + kiểm đúng thứ tự tác vụ xưởng (409 nếu sai bước). */
async function loadForAction(
  ctx: TenantContext,
  orderId: string,
  action: CoordinatorAction,
  repo: BrochureOrderRepository
) {
  const order = await repo.findBrochureOrder(ctx, orderId)
  if (!order) throw notFound()
  const blocker = coordinatorActionBlocker(action, {
    status: order.status,
    productionStatus: order.production_status,
    deliveryStatus: order.delivery_status,
  })
  if (blocker) throw conflict(blocker)
  return order
}

async function assertAssetOwned(ctx: TenantContext, assetId: string, repo: BrochureOrderRepository) {
  if (!(await repo.assetBelongsToTenant(ctx, assetId))) throw notFound()
}

export async function assignBrochureFlorist(
  ctx: TenantContext,
  orderId: string,
  input: { floristNote: string },
  repo = new BrochureOrderRepository()
) {
  const order = await loadForAction(ctx, orderId, "assign-florist", repo)
  return repo.applyProgress(ctx, order, {
    eventType: "FLORIST_ASSIGNED",
    productionStatus: "ARRANGING",
    noteAppend: `[Florist] ${input.floristNote.trim()}`,
  })
}

export async function uploadBrochureProductPhoto(
  ctx: TenantContext,
  orderId: string,
  input: { assetId: string },
  repo = new BrochureOrderRepository()
) {
  const order = await loadForAction(ctx, orderId, "product-photo", repo)
  await assertAssetOwned(ctx, input.assetId, repo)
  return repo.applyProgress(ctx, order, {
    eventType: "PRODUCT_PHOTO_UPLOADED",
    productionStatus: "READY",
    qcImageAssetId: input.assetId,
  })
}

export async function dispatchBrochureShipping(
  ctx: TenantContext,
  orderId: string,
  input: { trackingNote: string },
  repo = new BrochureOrderRepository()
) {
  const order = await loadForAction(ctx, orderId, "dispatch-shipping", repo)
  return repo.applyProgress(ctx, order, {
    eventType: "SHIPPING_DISPATCHED",
    deliveryStatus: "DELIVERING",
    noteAppend: `[Ship] ${input.trackingNote.trim()}`,
  })
}

export async function uploadBrochureRecipientPhoto(
  ctx: TenantContext,
  orderId: string,
  input: { assetId: string },
  repo = new BrochureOrderRepository()
) {
  const order = await loadForAction(ctx, orderId, "recipient-photo", repo)
  await assertAssetOwned(ctx, input.assetId, repo)
  return repo.applyProgress(ctx, order, {
    eventType: "RECIPIENT_PHOTO_UPLOADED",
    deliveryStatus: "DELIVERED",
    orderStatus: "COMPLETED",
    qcImageAssetId: input.assetId,
  })
}
