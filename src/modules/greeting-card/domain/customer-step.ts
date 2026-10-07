/**
 * Khách mở lại trang: bước đã nhớ trên máy còn được về không. Máy chủ (đơn, mẫu đã chọn) luôn
 * thắng: đã có đơn thì chỉ về thanh toán / theo dõi; chưa có đơn thì không về bước của đơn. Pure TypeScript.
 */

export type CustomerStep = "SWIPING" | "ORDER_FORM" | "PAYMENT" | "TRACKING"
export type PublicStep = "SWIPING" | "PREVIEW" | "ORDER_FORM" | "PAYMENT" | "TRACKING"

export function canEnterCustomerStep(target: CustomerStep, s: { hasOrder: boolean; hasSnapshot: boolean }): boolean {
  return s.hasOrder ? target === "PAYMENT" || target === "TRACKING" : target === "SWIPING" || (target === "ORDER_FORM" && s.hasSnapshot)
}

/** Link riêng `/b`: bước sẽ hiện khi mở lại, `null` = giữ bước máy chủ chọn. */
export function resumeCustomerStep(
  saved: CustomerStep,
  s: { hasOrder: boolean; hasSnapshot: boolean; serverStep: CustomerStep },
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
