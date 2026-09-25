/**
 * Customer Master Index & Field Projections (Chuẩn Hóa Ngành Hoa SSOT).
 *
 * Lưu trữ hồ sơ toàn diện của một khách hàng mua hoa:
 * Thông tin định danh, phân tầng RFM, sở thích loài hoa, dịp kỷ niệm,
 * quyền tiếp thị (Consent), và ưu đãi tích lũy.
 */

export type CustomerTier = "NEW" | "BRONZE" | "SILVER" | "GOLD" | "VIP"

export interface CustomerOccasionItem {
  id: string
  name: string // Sinh nhật vợ, Kỷ niệm ngày cưới, Sinh nhật sếp...
  date: string // MM-DD hoặc YYYY-MM-DD
  isRecurring: boolean
  reminderDaysBefore: number
  recipientName?: string | undefined
  notes?: string | undefined
}

export interface CustomerConsentItem {
  channel: "ZALO_ZNS" | "SMS" | "PHONE_CALL" | "PROMOTION"
  granted: boolean
  grantedAt: string
}

export interface CustomerVoucherItem {
  code: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: number
  expiresAt?: string | undefined
}

/** Cấu trúc Customer Master Index hoàn chỉnh */
export interface CustomerMasterIndex {
  id: string
  organizationId: string
  code: string // KH-0001
  name: string
  phone: string
  email?: string | undefined
  address?: string | undefined
  notes?: string | undefined
  tags: string[]

  // Phân tầng RFM & Giá trị mua hàng
  metrics: {
    tier: CustomerTier
    totalSpentVnd: number
    orderCount: number
    lastOrderAt?: string | undefined
    aovVnd: number // Average Order Value (Giá trị trung bình mỗi đơn)
  }

  // Sở thích thẩm mỹ & loài hoa (thu hoạch từ M01 Vision)
  preferences: {
    preferredFlowers: string[]
    preferredColors: string[]
  }

  // Dịp kỷ niệm & Người nhận
  occasions: CustomerOccasionItem[]

  // Quyền riêng tư & Tiếp thị
  consents: CustomerConsentItem[]

  // Voucher ưu đãi tích lũy
  availableVouchers: CustomerVoucherItem[]
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD PROJECTIONS (Lát cắt trích xuất trường dữ liệu theo chức năng)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. PROJECTION CHO MÀN HÌNH BÁN HÀNG & TƯ VẤN (Sales Card)
 * Hiển thị tóm tắt: Tên, SĐT, Phân hạng khách, loài hoa yêu thích, voucher sẵn có.
 */
export function projectCustomerSalesCard(customer: CustomerMasterIndex) {
  return {
    customerId: customer.id,
    customerCode: customer.code,
    name: customer.name,
    phone: customer.phone,
    tier: customer.metrics.tier,
    totalSpentVnd: customer.metrics.totalSpentVnd,
    orderCount: customer.metrics.orderCount,
    favFlowersSummary: customer.preferences.preferredFlowers.join(", ") || "Chưa ghi nhận",
    favColorsSummary: customer.preferences.preferredColors.join(", ") || "Chưa ghi nhận",
    vouchersCount: customer.availableVouchers.length,
  }
}

/**
 * 2. PROJECTION CHO NHẮC VIỆC DỊP KỶ NIỆM (Occasion Reminder)
 * Lấy danh sách dịp kỷ niệm sắp diễn ra kèm gợi ý mẫu hoa phù hợp gu của khách.
 */
export function projectOccasionReminder(
  customer: CustomerMasterIndex,
  occasion: CustomerOccasionItem,
  daysLeft: number
) {
  return {
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    occasionName: occasion.name,
    targetDate: occasion.date,
    daysLeft,
    recipientName: occasion.recipientName || customer.name,
    suggestedFlower: customer.preferences.preferredFlowers[0] || "Hoa hồng thiết kế",
    suggestedTone: customer.preferences.preferredColors[0] || "Pastel dịu ngọt",
    isZaloAllowed: customer.consents.find((c) => c.channel === "ZALO_ZNS")?.granted ?? false,
  }
}

export type OccasionReminder = ReturnType<typeof projectOccasionReminder>

/**
 * 3. PROJECTION CHO CHIẾN DỊCH QUẢNG BÁ / TIẾP THỊ (Marketing Audience)
 * Chỉ trích xuất khách hàng ĐÃ ĐỒNG Ý nhận tin (Consent = true).
 */
export function projectMarketingAudience(
  customer: CustomerMasterIndex,
  channel: "ZALO_ZNS" | "SMS" | "PROMOTION"
) {
  const hasConsent = customer.consents.find((c) => c.channel === channel)?.granted ?? false
  if (!hasConsent) return null

  return {
    customerId: customer.id,
    name: customer.name,
    phone: customer.phone,
    tier: customer.metrics.tier,
    voucherCode: customer.availableVouchers[0]?.code,
  }
}
