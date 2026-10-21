/**
 * Luật thương mại của Thẻ chào: giá, thông tin nhận tiền, thứ tự tác vụ xưởng.
 * Pure TypeScript — không Prisma, không I/O. Dùng chung cho server và UI.
 */

// ── Giá ──────────────────────────────────────────────────────────────────────

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

/**
 * Giá bán của một mẫu theo Product Master — cùng thứ tự ưu tiên với
 * `ProductRepository` (`attributes.price` → biến thể đầu `attributes.price`),
 * thêm `attributes.price_vnd` của chỉ mục Product Master.
 *
 * Trả `null` khi chưa có giá: KHÔNG bịa giá mặc định. Bản cũ gán cứng
 * 500.000đ nên khách bị báo giá và chuyển khoản sai tiền.
 */
export function resolveProductPriceVnd(
  productAttributes: unknown,
  firstVariantAttributes?: unknown
): number | null {
  const attrs = asRecord(productAttributes)
  const variant = asRecord(firstVariantAttributes)
  return positiveNumber(attrs.price) ?? positiveNumber(attrs.price_vnd) ?? positiveNumber(variant.price)
}

// ── Thông tin nhận tiền theo tiệm ────────────────────────────────────────────

/** Khoá trong `organizations.settings` chứa tài khoản nhận tiền Thẻ chào. */
export const BROCHURE_PAYMENT_SETTINGS_KEY = "brochure_payment"

export interface BrochurePaymentConfig {
  bankId: string
  bankName: string
  accountNo: string
  accountName: string
}

/**
 * Đọc tài khoản nhận tiền từ cài đặt tổ chức. Thiếu/sai → `null` để trang
 * khách hiển thị "cửa hàng sẽ liên hệ", thay vì mã QR của một tài khoản
 * mẫu dùng chung cho mọi tiệm như bản cũ.
 */
export function parseBrochurePaymentConfig(settings: unknown): BrochurePaymentConfig | null {
  const raw = asRecord(asRecord(settings)[BROCHURE_PAYMENT_SETTINGS_KEY])
  const bankId = typeof raw.bank_id === "string" ? raw.bank_id.trim() : ""
  const accountNo = typeof raw.account_no === "string" ? raw.account_no.replace(/\s+/g, "") : ""
  const accountName = typeof raw.account_name === "string" ? raw.account_name.trim() : ""
  if (!/^[A-Za-z0-9]{2,20}$/.test(bankId)) return null
  if (!/^[0-9A-Za-z]{4,30}$/.test(accountNo)) return null
  if (!accountName) return null
  const bankName = typeof raw.bank_name === "string" && raw.bank_name.trim() ? raw.bank_name.trim() : bankId
  return { bankId, bankName, accountNo, accountName: accountName.toUpperCase() }
}

// ── Thứ tự tác vụ xưởng (Điều phối) ──────────────────────────────────────────

export type CoordinatorAction = "assign-florist" | "product-photo" | "dispatch-shipping" | "recipient-photo" | "delivery-failed"

export interface OrderProgressState {
  status: string
  productionStatus: string
  deliveryStatus: string
}

/**
 * Đơn cần Điều phối xác nhận nhận đơn? Trả `null` nếu nút Xác nhận nên hiện,
 * hoặc lý do chặn nếu đơn không ở trạng thái chờ xác nhận.
 * Điều kiện: đơn DRAFT + đã có ảnh chuyển khoản hoặc đã nhận tiền + production chưa bắt đầu.
 */
export function coordinatorAcceptanceBlocker(
  s: OrderProgressState,
  payment: { paidVnd: number; paymentProofUrl?: string | null | undefined },
): string | null {
  if (s.status === "CANCELLED") return "Đơn hàng đã huỷ"
  if (s.status === "COMPLETED" || s.deliveryStatus === "DELIVERED") return "Đơn hàng đã giao xong"
  if (s.status === "CONFIRMED" || s.status === "PROCESSING") return "Đơn đã được xác nhận nhận đơn"
  if (s.productionStatus === "ASSIGNED" || s.productionStatus === "ARRANGING" || s.productionStatus === "READY") {
    return "Đơn đã vào sản xuất"
  }
  const hasProof = Boolean(payment.paymentProofUrl)
  if (payment.paidVnd <= 0 && !hasProof) return "Chưa có thông tin chuyển khoản từ khách"
  return null
}

/**
 * Đơn đã được nhận chưa: Điều phối bấm "Nhận đơn" (→ CONFIRMED + ASSIGNED) hoặc Điều hành ghi nhận tiền
 * (→ CONFIRMED). Đơn còn DRAFT mà xưởng chưa bắt đầu = chưa ai nhận.
 */
export function isOrderAccepted(s: OrderProgressState): boolean {
  return s.status !== "DRAFT" || s.productionStatus !== "WAITING"
}

export const NOT_ACCEPTED_REASON = "Đơn chưa được nhận — bấm \"Nhận đơn\" trước khi giao florist, chụp ảnh hay giao ship"

/**
 * Trả lý do chặn (tiếng Việt) hoặc `null` nếu được làm. Bản cũ cho bấm cả
 * bốn tác vụ theo thứ tự bất kỳ — giao ship trước khi cắm xong, hay chụp ảnh
 * người nhận trên đơn đã huỷ.
 */
export function coordinatorActionBlocker(
  action: CoordinatorAction,
  s: OrderProgressState,
  options?: { skipPhoto?: boolean }
): string | null {
  if (s.status === "CANCELLED") return "Đơn hàng đã huỷ"
  if (s.status === "COMPLETED" || s.deliveryStatus === "DELIVERED") return "Đơn hàng đã giao xong"

  const shipped = s.deliveryStatus === "DISPATCHED" || s.deliveryStatus === "DELIVERING"
  // PO 17/10/2026: phải nhận đơn trước — trước đây đơn chờ nhận vẫn hiện "Giao Florist" bấm được
  if (action !== "recipient-photo" && action !== "delivery-failed" && !isOrderAccepted(s)) return NOT_ACCEPTED_REASON
  switch (action) {
    case "assign-florist":
      if (s.productionStatus === "READY" || shipped) return "Hoa đã cắm xong, không phân công lại được"
      return null
    case "product-photo":
      if (shipped) return "Đơn đã giao cho shipper"
      return null
    case "dispatch-shipping":
      if (shipped) return "Đơn đã giao cho shipper"
      if (s.productionStatus !== "READY" && !options?.skipPhoto) return "Cần chụp ảnh thành phẩm trước khi giao ship"
      return null
    case "recipient-photo":
      if (!shipped) return "Cần giao ship trước khi chụp ảnh người nhận"
      return null
    case "delivery-failed":
      if (!shipped) return "Chỉ ghi giao không thành công khi đơn đang được giao"
      return null
  }
}
