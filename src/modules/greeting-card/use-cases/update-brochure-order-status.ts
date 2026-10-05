import type { TenantContext } from "@/core/tenancy"
import { conflict, notFound, validationFailed } from "@/core/http/errors"
import { mediaSelectionError } from "../domain/media-limits"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { coordinatorActionBlocker, type CoordinatorAction } from "../domain/brochure-commerce-rules"
import { paymentGateBlocker, parsePaymentPolicy } from "../domain/brochure-payment-policy"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { queueOrderNotification } from "./notify-customer"

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
  // Chính sách thu tiền của tiệm (cọc trước khi cắm, thu đủ trước khi giao)
  const shop = await new GreetingCardRepository().getShopProfile(ctx.organizationId)
  const moneyBlocker = paymentGateBlocker(action, parsePaymentPolicy(shop.settings), {
    totalVnd: Number(order.total_vnd),
    paidVnd: Number(order.paid_vnd),
  })
  if (moneyBlocker) throw conflict(moneyBlocker)
  return order
}

/** Đầu vào ảnh: `assetIds` (1–5 ảnh + 0–2 video) hoặc `assetId` (client cũ, một ảnh). */
export type PhotoInput = { assetId?: string | undefined; assetIds?: string[] | undefined }

/**
 * Mọi asset phải thuộc đúng tổ chức (khác → 404) và bộ tệp đúng giới hạn ảnh/video.
 * Thời lượng video do trình duyệt kiểm; máy chủ kiểm loại, số lượng, dung lượng.
 */
async function ownedMediaIds(ctx: TenantContext, input: PhotoInput, repo: BrochureOrderRepository): Promise<string[]> {
  const ids = [...new Set(input.assetIds ?? (input.assetId ? [input.assetId] : []))]
  if (ids.length === 0) throw validationFailed({ assetIds: "Cần ít nhất 1 ảnh" })
  const meta = await repo.ownedAssetsMeta(ctx, ids)
  if (meta.length !== ids.length) throw notFound()
  const error = mediaSelectionError(meta.map((m) => ({ mimeType: m.mime_type, sizeBytes: m.file_size })))
  if (error) throw validationFailed({ assetIds: error })
  return ids
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
  input: PhotoInput,
  repo = new BrochureOrderRepository()
) {
  const order = await loadForAction(ctx, orderId, "product-photo", repo)
  const assetIds = await ownedMediaIds(ctx, input, repo)
  const result = await repo.applyProgress(ctx, order, {
    eventType: "PRODUCT_PHOTO_UPLOADED",
    productionStatus: "READY",
    qcAssetIds: assetIds,
  })
  queueOrderNotification(ctx.organizationId, order.id, "READY")
  return result
}

export async function dispatchBrochureShipping(
  ctx: TenantContext,
  orderId: string,
  input: { trackingNote: string },
  repo = new BrochureOrderRepository()
) {
  const order = await loadForAction(ctx, orderId, "dispatch-shipping", repo)
  const result = await repo.applyProgress(ctx, order, {
    eventType: "SHIPPING_DISPATCHED",
    deliveryStatus: "DELIVERING",
    noteAppend: `[Ship] ${input.trackingNote.trim()}`,
  })
  queueOrderNotification(ctx.organizationId, order.id, "DISPATCHED")
  return result
}

export async function uploadBrochureRecipientPhoto(
  ctx: TenantContext,
  orderId: string,
  input: PhotoInput,
  repo = new BrochureOrderRepository()
) {
  const order = await loadForAction(ctx, orderId, "recipient-photo", repo)
  const assetIds = await ownedMediaIds(ctx, input, repo)
  const result = await repo.applyProgress(ctx, order, {
    eventType: "RECIPIENT_PHOTO_UPLOADED",
    deliveryStatus: "DELIVERED",
    orderStatus: "COMPLETED",
    qcAssetIds: assetIds,
  })
  queueOrderNotification(ctx.organizationId, order.id, "DELIVERED")
  return result
}
