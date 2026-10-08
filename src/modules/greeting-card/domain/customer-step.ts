/**
 * Khách mở lại trang: bước đã nhớ trên máy còn được về không. Máy chủ (đơn, mẫu đã chọn) luôn
 * thắng: đã có đơn thì chỉ về thanh toán / theo dõi; chưa có đơn thì không về bước của đơn. Pure TypeScript.
 */

export type CustomerStep = "SWIPING" | "ORDER_FORM" | "PAYMENT" | "TRACKING"
export type PublicStep = "SWIPING" | "PREVIEW" | "ORDER_FORM" | "PAYMENT" | "TRACKING"

export interface CustomerStepFacts {
  hasOrder: boolean
  hasSnapshot: boolean
  /** `canViewTracking` — chưa chuyển khoản thì không vào Theo dõi, kể cả bằng Back/Forward hay mở lại trang. */
  trackingUnlocked: boolean
}

export function canEnterCustomerStep(target: CustomerStep, s: CustomerStepFacts): boolean {
  if (!s.hasOrder) return target === "SWIPING" || (target === "ORDER_FORM" && s.hasSnapshot)
  return target === "PAYMENT" || (target === "TRACKING" && s.trackingUnlocked)
}

/**
 * Quy trình PO 08/10/2026: khách chuyển khoản → Điều hành xác nhận đã nhận tiền → khách thấy
 * "thanh toán thành công" và nút Theo dõi tiến độ. Khách tự báo "đã chuyển khoản" CHƯA đủ.
 * "Đã nhận tiền" = `paidVnd > 0` (kể cả tiền cọc — phần còn lại thu sau theo thoả thuận).
 * Ngoại lệ vì khách không có gì để chuyển: đơn đã huỷ, mẫu chưa có giá (chờ báo giá),
 * tiệm chưa cấu hình tài khoản nhận tiền (không có mã QR, tiệm tự liên hệ thu tiền).
 */
export function canViewTracking(o: {
  totalVnd: number
  paidVnd: number
  hasPaymentQr: boolean
  cancelled: boolean
}): boolean {
  return o.cancelled || o.totalVnd <= 0 || !o.hasPaymentQr || o.paidVnd > 0
}

/** Link riêng `/b`: bước sẽ hiện khi mở lại, `null` = giữ bước máy chủ chọn. */
export function resumeCustomerStep(
  saved: CustomerStep,
  s: CustomerStepFacts & { serverStep: CustomerStep },
): CustomerStep | null {
  // Đơn đã trả đủ / đã huỷ → máy chủ chọn Theo dõi; không quay lại màn thanh toán
  if (s.hasOrder && s.serverStep === "TRACKING") return null
  return canEnterCustomerStep(saved, s) ? saved : null
}

/** Link chung `/g` · `/bst`: chỉ về "xem mẫu đã chọn" / form khi mẫu đó còn trong bộ sưu tập và còn hàng. */
export function resumePublicStep(
  saved: PublicStep,
  selectedId: string | null,
  products: ReadonlyArray<{ id: string; available?: boolean | undefined }>,
): PublicStep | null {
  if (saved !== "PREVIEW" && saved !== "ORDER_FORM") return null // đơn đã đặt: chuyển sang trang đơn ở chỗ khác
  return products.some((p) => p.id === selectedId && p.available !== false) ? saved : null
}

/** Size đã lưu mà tiệm vừa gỡ → về bản gốc thay vì gửi id không còn. */
export function sanitizeVariant<T extends { variantId: string }>(selection: T, variantIds: readonly string[]): T {
  return selection.variantId && !variantIds.includes(selection.variantId) ? { ...selection, variantId: "" } : selection
}
