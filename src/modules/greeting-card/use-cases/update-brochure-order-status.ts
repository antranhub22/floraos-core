import type { TenantContext } from "@/core/tenancy"
import { GreetingCardRepository } from "../infra/greeting-card-repository"

export async function assignBrochureFlorist(
  ctx: TenantContext,
  orderId: string,
  input: { floristNote: string },
  repo = new GreetingCardRepository()
) {
  return repo.updateBrochureOrderStatus(ctx, orderId, {
    production_status: "ARRANGING",
    internal_note_append: `[Florist] ${input.floristNote}`,
    eventType: "FLORIST_ASSIGNED",
    eventMeta: { note: input.floristNote, assignedBy: ctx.userId },
  })
}

export async function uploadBrochureProductPhoto(
  ctx: TenantContext,
  orderId: string,
  input: { assetId: string },
  repo = new GreetingCardRepository()
) {
  return repo.attachQcRecord(ctx, orderId, {
    imageAssetId: input.assetId,
    eventType: "PRODUCT_PHOTO_UPLOADED",
    newProductionStatus: "READY",
  })
}

export async function dispatchBrochureShipping(
  ctx: TenantContext,
  orderId: string,
  input: { trackingNote: string },
  repo = new GreetingCardRepository()
) {
  return repo.updateBrochureOrderStatus(ctx, orderId, {
    delivery_status: "DELIVERING",
    internal_note_append: `[Ship] ${input.trackingNote}`,
    eventType: "SHIPPING_DISPATCHED",
    eventMeta: { note: input.trackingNote, dispatchedBy: ctx.userId },
  })
}

export async function uploadBrochureRecipientPhoto(
  ctx: TenantContext,
  orderId: string,
  input: { assetId: string },
  repo = new GreetingCardRepository()
) {
  return repo.attachQcRecord(ctx, orderId, {
    imageAssetId: input.assetId,
    eventType: "RECIPIENT_PHOTO_UPLOADED",
    newDeliveryStatus: "DELIVERED",
    newOrderStatus: "COMPLETED",
  })
}
