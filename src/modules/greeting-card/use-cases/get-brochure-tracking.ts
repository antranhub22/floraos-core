import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { mapOrderStatusToTrackingStep } from "../domain/greeting-card-rules"
import type { ProductSnapshot } from "../domain/greeting-card-types"

export async function getBrochureTracking(
  orderCode: string,
  repo = new GreetingCardRepository()
) {
  const order = await repo.getTrackingOrderByCode(orderCode)

  if (!order) {
    return { status: "NOT_FOUND" as const }
  }

  const step = mapOrderStatusToTrackingStep(
    order.status,
    order.production_status,
    order.delivery_status
  )

  // Extract snapshot from item metadata or session
  let snapshot: ProductSnapshot | null = null
  const firstOrderItem = order.items.length > 0 ? order.items[0] : null
  if (firstOrderItem && firstOrderItem.metadata) {
    snapshot = firstOrderItem.metadata as unknown as ProductSnapshot
  }

  // Look for finished flower image in QC records or session
  let finishedImageUrl: string | null = null
  const latestQc = order.qc_records.length > 0 ? order.qc_records[0] : null
  if (latestQc && latestQc.image_asset_ids && Array.isArray(latestQc.image_asset_ids)) {
    const firstAssetId = latestQc.image_asset_ids[0]
    if (typeof firstAssetId === "string") {
      finishedImageUrl = await repo.getAssetStorageUrl(firstAssetId)
    }
  }

  const deliveryAddress = (order.delivery_address as Record<string, string> | null) || {}

  return {
    status: "FOUND" as const,
    order: {
      code: order.code,
      status: order.status,
      productionStatus: order.production_status,
      deliveryStatus: order.delivery_status,
      totalVnd: Number(order.total_vnd),
      paidVnd: Number(order.paid_vnd),
      balanceVnd: Number(order.balance_vnd),
      cardMessage: order.card_message,
      recipientName: deliveryAddress.recipientName || "Khách nhận",
      deliveryAddress: deliveryAddress.street || "",
      productSnapshot: snapshot,
      finishedImageUrl,
      createdAt: order.created_at.toISOString(),
      updatedAt: order.updated_at.toISOString(),
    },
    trackingStep: step,
  }
}
