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

  // Ảnh thành phẩm và ảnh người nhận là HAI mục riêng — ảnh người nhận không đè ảnh thành phẩm.
  // Mỗi bản ghi QC ghi loại ảnh ở `notes`; chỉ ký asset của đúng tổ chức sở hữu đơn.
  const idsOf = (kind: string) =>
    order.qc_records
      .filter((qc) => qc.notes === kind)
      .flatMap((qc) => (Array.isArray(qc.image_asset_ids) ? qc.image_asset_ids : []))
      .filter((id): id is string => typeof id === "string")
  const productIds = idsOf("PRODUCT_PHOTO_UPLOADED")
  const recipientIds = idsOf("RECIPIENT_PHOTO_UPLOADED")
  const urls = await repo.getAssetsStorageMap(order.organization_id, [...productIds, ...recipientIds])
  const toUrls = (ids: string[]) => ids.map((id) => urls.get(id)).filter((u): u is string => Boolean(u))
  const productPhotoUrls = toUrls(productIds)
  const recipientPhotoUrls = toUrls(recipientIds)

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
      /** Giữ cho client cũ: ảnh thành phẩm mới nhất */
      finishedImageUrl: productPhotoUrls[0] ?? null,
      productPhotoUrls,
      recipientPhotoUrls,
      createdAt: order.created_at.toISOString(),
      updatedAt: order.updated_at.toISOString(),
    },
    trackingStep: step,
  }
}
