import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { mapOrderStatusToTrackingStep } from "../domain/greeting-card-rules"
import type { ProductSnapshot } from "../domain/greeting-card-types"

const ORDER_CODE_REGEX = /^[A-Z0-9-]{4,40}$/

/**
 * Trang theo dõi công khai theo mã đơn. Chỉ đơn nguồn Thẻ chào; chỉ trả tên
 * người nhận và địa chỉ đã rút gọn (không SĐT).
 */
export async function getBrochureTracking(
  orderCode: string,
  orders = new BrochureOrderRepository(),
  repo = new GreetingCardRepository()
) {
  const code = orderCode.trim().toUpperCase()
  if (!ORDER_CODE_REGEX.test(code)) return { status: "NOT_FOUND" as const }

  const order = await orders.getTrackingOrderByCode(code)
  if (!order) return { status: "NOT_FOUND" as const }

  const step = mapOrderStatusToTrackingStep(order.status, order.production_status, order.delivery_status)

  const firstItem = order.items[0]
  const snapshot = (firstItem?.metadata as unknown as ProductSnapshot | null) ?? null

  // Ảnh thành phẩm/người nhận gần nhất — chỉ ký asset của đúng tổ chức sở hữu đơn
  let finishedImageUrl: string | null = null
  const latestQc = order.qc_records[0]
  const assetIds = Array.isArray(latestQc?.image_asset_ids) ? latestQc.image_asset_ids : []
  if (typeof assetIds[0] === "string") {
    finishedImageUrl = await repo.getAssetStorageUrl(order.organization_id, assetIds[0])
  }

  const deliveryAddress = (order.delivery_address as Record<string, string> | null) || {}
  const deliveryWindow = (order.delivery_window as Record<string, string> | null) || {}

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
      deliveryDate: deliveryWindow.date || null,
      deliveryTimeSlot: deliveryWindow.timeSlot || null,
      productSnapshot: snapshot,
      finishedImageUrl,
      createdAt: order.created_at.toISOString(),
      updatedAt: order.updated_at.toISOString(),
    },
    trackingStep: step,
  }
}
