/**
 * Chính sách thu tiền đơn Thẻ chào theo tiệm (`organizations.settings.brochure_policy`):
 * đặt cọc %, có bắt thu tiền trước khi cắm hoa / thu đủ trước khi giao không.
 * Pure TypeScript — dùng chung server (chặn thao tác) và UI (khoá nút, báo lý do).
 */

import type { CoordinatorAction } from "./brochure-commerce-rules"

export const BROCHURE_POLICY_SETTINGS_KEY = "brochure_policy"

export interface BrochurePaymentPolicy {
  /** 0 = khách trả đủ ngay; 1–99 = lần đầu chỉ cần cọc chừng ấy %. */
  depositPercent: number
  requirePaidBeforeProduction: boolean
  requireFullBeforeDispatch: boolean
  /** Số phút giữ đơn chờ chuyển khoản lần đầu (hiện đồng hồ đếm ngược cho khách); 0 = không hiện. */
  holdMinutes?: number
  /** Hết hạn giữ đơn + 60 phút mà khách chưa chuyển, chưa báo đã chuyển → tự huỷ đơn. Mặc định tắt. */
  autoCancelUnpaid?: boolean
}

export const DEFAULT_PAYMENT_POLICY: BrochurePaymentPolicy = {
  depositPercent: 0,
  requirePaidBeforeProduction: false,
  requireFullBeforeDispatch: false,
}

export function parsePaymentPolicy(settings: unknown): BrochurePaymentPolicy {
  const root = settings && typeof settings === "object" ? (settings as Record<string, unknown>) : {}
  const raw = root[BROCHURE_POLICY_SETTINGS_KEY]
  if (!raw || typeof raw !== "object") return DEFAULT_PAYMENT_POLICY
  const r = raw as Record<string, unknown>
  const pct = typeof r.deposit_percent === "number" && Number.isFinite(r.deposit_percent) ? Math.round(r.deposit_percent) : 0
  return {
    depositPercent: pct >= 1 && pct <= 99 ? pct : 0,
    requirePaidBeforeProduction: r.require_paid_before_production === true,
    requireFullBeforeDispatch: r.require_full_before_dispatch === true,
    // Chỉ thêm khoá khi tiệm bật giữ đơn — chính sách cũ giữ nguyên hình dạng
    ...(typeof r.hold_minutes === "number" && Number.isInteger(r.hold_minutes) && r.hold_minutes >= 5 && r.hold_minutes <= 1440
      ? { holdMinutes: r.hold_minutes }
      : {}),
    ...(r.auto_cancel_unpaid === true ? { autoCancelUnpaid: true } : {}),
  }
}

export type PaymentPurpose = "FULL" | "DEPOSIT" | "BALANCE"

/**
 * Số tiền khách nên chuyển LẦN NÀY: lần đầu theo % cọc (làm tròn lên nghìn),
 * các lần sau là phần còn lại.
 */
export function expectedPayment(
  policy: BrochurePaymentPolicy,
  totalVnd: number,
  paidVnd: number
): { amountVnd: number; purpose: PaymentPurpose } {
  const balance = Math.max(0, totalVnd - paidVnd)
  if (paidVnd > 0) return { amountVnd: balance, purpose: "BALANCE" }
  if (policy.depositPercent > 0) {
    const deposit = Math.min(balance, Math.ceil((totalVnd * policy.depositPercent) / 100 / 1000) * 1000)
    if (deposit < balance) return { amountVnd: deposit, purpose: "DEPOSIT" }
  }
  return { amountVnd: balance, purpose: "FULL" }
}

/** Lý do chặn tác vụ xưởng vì chưa thu tiền theo chính sách, hoặc `null`. */
export function paymentGateBlocker(
  action: CoordinatorAction,
  policy: BrochurePaymentPolicy,
  money: { totalVnd: number; paidVnd: number }
): string | null {
  const producing = action === "assign-florist" || action === "product-photo"
  if (producing && policy.requirePaidBeforeProduction && money.paidVnd <= 0) {
    return "Tiệm yêu cầu thu cọc/thanh toán trước khi cắm hoa"
  }
  if (action === "dispatch-shipping" && policy.requireFullBeforeDispatch) {
    if (money.totalVnd <= 0) return "Đơn chưa báo giá — báo giá và thu đủ tiền trước khi giao hoa"
    if (money.paidVnd < money.totalVnd) return "Tiệm yêu cầu thu đủ tiền trước khi giao hoa"
  }
  return null
}

/** Huỷ được khi đơn chưa giao xong/chưa huỷ. */
export function cancelBlocker(s: { status: string; deliveryStatus: string }): string | null {
  if (s.status === "CANCELLED") return "Đơn hàng đã huỷ trước đó"
  if (s.status === "COMPLETED" || s.deliveryStatus === "DELIVERED") return "Đơn đã giao xong, không thể huỷ"
  return null
}

/** Số tiền tối đa cửa hàng được báo cho một đơn Thẻ chào. */
export const MAX_QUOTE_VND = 1_000_000_000

/**
 * Lý do không báo giá được cho đơn, hoặc `null`. Chỉ báo giá đơn đang chờ
 * (tổng 0 — khách đặt mẫu chưa niêm yết giá), chưa huỷ.
 */
export function quoteBlocker(order: { status: string; totalVnd: number }, totalVnd: number): string | null {
  if (order.status === "CANCELLED") return "Đơn hàng đã huỷ"
  if (order.totalVnd > 0) return "Đơn hàng đã có giá, không báo giá lại được"
  if (!Number.isInteger(totalVnd) || totalVnd <= 0 || totalVnd > MAX_QUOTE_VND) return "Số tiền báo giá không hợp lệ"
  return null
}

/** Hạn giữ đơn (ISO) khi tiệm bật giữ đơn và khách chưa trả đồng nào; ngược lại `null`. */
export function paymentHoldUntil(
  policy: BrochurePaymentPolicy,
  order: { paidVnd: number; createdAt?: Date | undefined },
): string | null {
  const minutes = policy.holdMinutes ?? 0
  if (minutes <= 0 || order.paidVnd > 0 || !order.createdAt) return null
  return new Date(order.createdAt.getTime() + minutes * 60_000).toISOString()
}
