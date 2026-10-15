/**
 * Phần còn lại (Lần 2) của đơn đặt cọc được thu khi nào — một luật chung cho máy chủ ghi sổ
 * (`confirm-brochure-payment.ts`) và giao diện Điều hành (bảng đơn, hộp thoại thu tiền), để nút
 * hiện trên màn hình không lệch với điều máy chủ cho phép (PO 10/10 + 14/10/2026):
 * - khách đã báo chuyển khoản → thu được ngay;
 * - không bắt thu đủ trước giao + shipper không thu tiền mặt (mặc định) → thu bất cứ lúc nào;
 * - không bắt thu đủ trước giao + shipper thu tiền mặt → chỉ sau khi giao thành công;
 * - bắt thu đủ trước giao → hoa xong và khách duyệt ảnh thành phẩm (tự duyệt sau 10 phút);
 *   tiệm bỏ qua ảnh thành phẩm thì hoa xong là đủ.
 */

/** Ảnh thành phẩm tự coi như khách đã duyệt sau 10 phút. */
export const PHOTO_AUTO_APPROVE_MS = 10 * 60_000

export interface BalanceCollectionOrder {
  productionStatus: string
  deliveryStatus: string
  customerReported: boolean
  qcRecords: ReadonlyArray<{ notes: string | null; created_at: Date | string }>
}

export interface BalanceCollectionPolicy {
  requireFullBeforeDispatch: boolean
  allowShipperCash?: boolean | undefined
}

/** Lý do chưa thu được phần còn lại (tiếng Việt), hoặc `null` nếu thu được. */
export function balanceCollectionBlocker(order: BalanceCollectionOrder, policy: BalanceCollectionPolicy, nowMs: number): string | null {
  if (order.customerReported) return null
  if (!policy.requireFullBeforeDispatch) {
    // Shipper không thu tiền mặt → khách chuyển khoản lần 2 lúc nào cũng được (tránh kẹt: chưa thu thì chưa giao)
    if (policy.allowShipperCash !== true) return null
    return order.deliveryStatus === "DELIVERED"
      ? null
      : "Đơn hàng đã được ghi nhận tiền cọc. Theo chính sách của tiệm, phần còn lại sẽ thu sau khi giao hoa thành công."
  }
  if (order.productionStatus !== "READY") {
    return "Đơn hàng đã được ghi nhận tiền cọc. Phần còn lại chỉ được thu sau khi xưởng hoàn thành cắm hoa và khách xác nhận ảnh."
  }
  const productPhoto = order.qcRecords.find((qc) => qc.notes === "PRODUCT_PHOTO_UPLOADED")
  // Tiệm bỏ qua ảnh thành phẩm → không có ảnh nào để khách duyệt; hoa xong là đủ để thu
  if (!productPhoto) return null
  if (order.qcRecords.some((qc) => qc.notes === "CUSTOMER_PHOTO_APPROVED")) return null
  if (nowMs >= new Date(productPhoto.created_at).getTime() + PHOTO_AUTO_APPROVE_MS) return null
  return "Đơn hàng đang chờ khách duyệt ảnh thành phẩm trước khi giao. Chưa thể ghi nhận thanh toán lần 2."
}
