import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { mapOrderStatusToTrackingStep } from "../domain/greeting-card-rules"
import { areaOnly, maskPersonName, phoneLast4Matches } from "../domain/tracking-privacy"
import type { ProductSnapshot } from "../domain/greeting-card-types"

const ORDER_CODE_REGEX = /^[A-Z0-9-]{4,40}$/

/** Cách người xem chứng minh mình là khách: mở từ chính link của đơn, hoặc nhập 4 số cuối SĐT người đặt. */
export interface TrackingProof {
  sendCode?: string | null | undefined
  phoneLast4?: string | null | undefined
}

/**
 * Trang theo dõi công khai theo mã đơn. Chỉ đơn nguồn Thẻ chào; không bao giờ trả SĐT.
 * Mã đơn nằm trong nội dung chuyển khoản nên ai cũng có thể biết — mặc định chỉ trả thông tin
 * rút gọn (tên người nhận viết tắt, phường + tỉnh, không lời nhắn thiệp); có `proof` hợp lệ mới
 * trả đầy đủ (PO 06/10/2026).
 */
export async function getBrochureTracking(
  orderCode: string,
  proof: TrackingProof = {},
  orders = new BrochureOrderRepository(),
  repo = new GreetingCardRepository()
) {
  const code = orderCode.trim().toUpperCase()
  if (!ORDER_CODE_REGEX.test(code)) return { status: "NOT_FOUND" as const }

  const order = await orders.getTrackingOrderByCode(code)
  if (!order) return { status: "NOT_FOUND" as const }

  const linkCode = proof.sendCode?.trim().toUpperCase()
  const verified =
    (!!linkCode && order.greeting_sessions.some((s) => s.send_code === linkCode)) ||
    (!!proof.phoneLast4 && phoneLast4Matches(order.customer?.phone, proof.phoneLast4.trim()))

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
  // Ảnh người nhận là ảnh của một người cụ thể — chỉ hiện khi đã xác minh
  const recipientIds = verified ? idsOf("RECIPIENT_PHOTO_UPLOADED") : []
  const urls = await repo.getAssetsStorageMap(order.organization_id, [...productIds, ...recipientIds])
  const toUrls = (ids: string[]) => ids.map((id) => urls.get(id)).filter((u): u is string => Boolean(u))
  const productPhotoUrls = toUrls(productIds)
  const recipientPhotoUrls = toUrls(recipientIds)

  const address = (order.delivery_address as { recipientName?: string; street?: string; parts?: { ward?: string; province?: string } } | null) || {}
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
      /** `false` = đang xem bản rút gọn; nhập 4 số cuối SĐT người đặt để xem đầy đủ. */
      verified,
      cardMessage: verified ? order.card_message : null,
      recipientName: verified ? address.recipientName || "Khách nhận" : maskPersonName(address.recipientName),
      deliveryAddress: verified ? address.street || "" : areaOnly(address),
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
