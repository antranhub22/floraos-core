/**
 * CRM Domain Rules (Luật nghiệp vụ Khách hàng & Tiếp thị ngành hoa).
 * Thuần túy logic, không import Prisma hay thư viện ngoài.
 */

import type { CustomerTier, CustomerConsentItem } from "./customer-master-index"

/**
 * Phân hạng khách hàng tự động theo RFM (Frequency & Monetary):
 * - VIP: >= 10.000.000 đ hoặc >= 10 đơn
 * - GOLD: >= 5.000.000 đ hoặc >= 5 đơn
 * - SILVER: >= 2.000.000 đ hoặc >= 3 đơn
 * - BRONZE: >= 500.000 đ hoặc >= 1 đơn
 * - NEW: Chưa phát sinh đơn
 */
export function deriveCustomerTier(totalSpentVnd: number, orderCount: number): CustomerTier {
  if (totalSpentVnd >= 10_000_000 || orderCount >= 10) return "VIP"
  if (totalSpentVnd >= 5_000_000 || orderCount >= 5) return "GOLD"
  if (totalSpentVnd >= 2_000_000 || orderCount >= 3) return "SILVER"
  if (totalSpentVnd >= 500_000 || orderCount >= 1) return "BRONZE"
  return "NEW"
}

/**
 * Kiểm tra định dạng số điện thoại Việt Nam hợp lệ
 */
export function isValidVietnamesePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.-]/g, "")
  return /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/.test(cleaned)
}

/**
 * Chuẩn hóa số điện thoại về định dạng 10 số (bắt đầu bằng 0)
 */
export function normalizeVietnamesePhone(phone: string): string {
  let cleaned = phone.replace(/[\s.-]/g, "")
  if (cleaned.startsWith("+84")) {
    cleaned = "0" + cleaned.slice(3)
  } else if (cleaned.startsWith("84")) {
    cleaned = "0" + cleaned.slice(2)
  }
  return cleaned
}

/**
 * Kiểm tra xem một dịp kỷ niệm có rơi vào khoảng `daysAhead` ngày tới không.
 * dateStr có thể là MM-DD hoặc YYYY-MM-DD.
 */
export function calculateDaysUntilOccasion(
  dateStr: string,
  now: Date = new Date()
): number | null {
  const parts = dateStr.split("-")
  if (parts.length < 2) return null

  const month = parseInt(parts[parts.length - 2] ?? "", 10) - 1
  const day = parseInt(parts[parts.length - 1] ?? "", 10)

  if (isNaN(month) || isNaN(day)) return null

  const currentYear = now.getFullYear()
  let targetDate = new Date(currentYear, month, day)

  // Đặt về 00:00:00 để so sánh chính xác theo ngày
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Nếu ngày trong năm nay đã trôi qua, tính cho năm sau
  if (targetDate.getTime() < today.getTime()) {
    targetDate = new Date(currentYear + 1, month, day)
  }

  const diffMs = targetDate.getTime() - today.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Kiểm tra quyền tiếp thị (Consent check) trước khi gửi tin
 */
export function hasMarketingConsent(
  consents: CustomerConsentItem[],
  channel: CustomerConsentItem["channel"]
): boolean {
  const c = consents.find((it) => it.channel === channel)
  return c ? c.granted : false
}
