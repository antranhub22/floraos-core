/**
 * Luật cho bộ quét nền Thẻ chào (chạy mỗi phút trong tiến trình web — PO 06/10/2026: không thêm
 * hạ tầng). Mọi lần thử lại đều có giới hạn. Pure TypeScript.
 */
import { paymentHoldUntil, type BrochurePaymentPolicy } from "./brochure-payment-policy"

export const SWEEP_INTERVAL_MS = 60_000
/** Tin kẹt "đang gửi" quá lâu (tiến trình tắt giữa chừng) → coi là lỗi để gửi lại. */
export const STALE_SENDING_MS = 5 * 60_000
/** Gửi lại tin lỗi cách nhau 30 phút, chỉ trong 6 giờ đầu → tối đa ~12 lần mỗi mốc. */
export const RETRY_BACKOFF_MS = 30 * 60_000
export const RETRY_WINDOW_MS = 6 * 3_600_000
/** Sau hạn giữ đơn bao lâu thì tự huỷ (khi tiệm bật). */
export const AUTO_CANCEL_GRACE_MS = 60 * 60_000
export const AUTO_CANCEL_REASON = "Tự huỷ: quá hạn giữ đơn mà chưa nhận được chuyển khoản"
export const PAYMENT_TIMEOUT_REASON = "Thanh toán không thành công: hết hạn thanh toán mà chưa nhận được chuyển khoản"

/** FAIL_PAYMENT = hết hạn thanh toán → ghi thanh toán thất bại + huỷ đơn ngay. */
export type HoldAction = "NONE" | "REMIND" | "CANCEL" | "FAIL_PAYMENT"

/**
 * Đơn đang giữ chờ chuyển khoản: hết hạn → nhắc khách (một lần, máy chủ chống trùng theo mốc);
 * hết hạn + 60 phút, tiệm bật tự huỷ, khách chưa báo đã chuyển → huỷ. Tiệm bật hạn thanh toán
 * (`paymentTimeoutMinutes`) → hết hạn mà khách chưa báo đã chuyển là thanh toán thất bại, huỷ ngay. Đơn chờ báo giá (tổng 0),
 * đã thu đồng nào, hay đã khác DRAFT thì không đụng.
 */
export function holdAction(
  order: { status: string; totalVnd: number; paidVnd: number; createdAt: Date; customerReportedPaid: boolean },
  policy: BrochurePaymentPolicy,
  now: Date = new Date(),
): HoldAction {
  if (order.status !== "DRAFT" || order.totalVnd <= 0 || order.paidVnd > 0) return "NONE"
  const until = paymentHoldUntil(policy, order)
  if (!until) return "NONE"
  const expired = now.getTime() - Date.parse(until)
  if (expired < 0) return "NONE"
  // Hạn thanh toán (PO 08/10/2026): khách đã bấm "Tôi đã chuyển khoản" thì không huỷ — chờ tiệm đối soát
  if (policy.paymentTimeoutMinutes) return order.customerReportedPaid ? "NONE" : "FAIL_PAYMENT"
  if (policy.autoCancelUnpaid && !order.customerReportedPaid && expired >= AUTO_CANCEL_GRACE_MS) return "CANCEL"
  return order.customerReportedPaid ? "NONE" : "REMIND"
}
