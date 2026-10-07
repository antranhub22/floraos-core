/**
 * Domain rules and logic for Greeting Card / Swipe Brochure.
 * Pure TypeScript — No Prisma, No external I/O.
 */

import type {
  GreetingSessionStatus,
  ProductSnapshot,
  GreetingCatalogProduct,
  CustomerOrderSubmitInput,
} from "./greeting-card-types"

/**
 * Mã gửi = `<PREFIX>-<phần ngẫu nhiên>`. Phần đuôi cũ là số thứ tự (`T01-001`)
 * nên đoán được và TRÙNG giữa hai tiệm (unique chỉ theo tổ chức) — link công
 * khai tra không theo tổ chức nên khách tiệm A có thể mở nhầm thẻ của tiệm B.
 * Regex vẫn nhận mã số cũ để link đã gửi không chết.
 */
export const SEND_CODE_REGEX = /^[A-Z0-9]{2,6}-[A-Z0-9]{3,12}$/

/** Bảng chữ Crockford base32 — bỏ I, L, O, U để khách đọc/gõ lại không nhầm. */
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
export const SEND_CODE_RANDOM_LENGTH = 8

export type RandomBytes = (length: number) => Uint8Array

const defaultRandomBytes: RandomBytes = (length) =>
  globalThis.crypto.getRandomValues(new Uint8Array(length))

export function randomCode(length: number, randomBytes: RandomBytes = defaultRandomBytes): string {
  const bytes = randomBytes(length)
  let out = ""
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[(bytes[i] ?? 0) % CODE_ALPHABET.length]
  return out
}

export function normalizeSendCodePrefix(prefix: string | undefined): string {
  const clean = (prefix ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
  return clean.length >= 2 ? clean : "T01"
}

export function generateSendCode(prefix = "T01", randomBytes: RandomBytes = defaultRandomBytes): string {
  return `${normalizeSendCodePrefix(prefix)}-${randomCode(SEND_CODE_RANDOM_LENGTH, randomBytes)}`
}

/** Mã đơn Thẻ chào: `DH<yymmdd>-<ngẫu nhiên>` — cũng là khoá tra cứu công khai nên không được đoán ra. */
export function generateBrochureOrderCode(
  now: Date = new Date(),
  randomBytes: RandomBytes = defaultRandomBytes
): string {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "")
  return `DH${ymd}-${randomCode(8, randomBytes)}`
}

export function validateSendCode(code: string): boolean {
  if (!code || typeof code !== "string") return false
  return SEND_CODE_REGEX.test(code.trim().toUpperCase())
}

export function createProductSnapshot(
  product: GreetingCatalogProduct & { price: number },
  timestamp: string = new Date().toISOString()
): ProductSnapshot {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    driveLink: product.driveLink ?? null,
    description: product.description ?? null,
    flowersSummary: product.flowersSummary ?? null,
    selectedAt: timestamp,
  }
}

export const VALID_SESSION_TRANSITIONS: Record<GreetingSessionStatus, GreetingSessionStatus[]> = {
  CREATED: ["OPENED", "BROWSING", "SELECTED"],
  OPENED: ["BROWSING", "SELECTED"],
  BROWSING: ["SELECTED", "BROWSING"],
  SELECTED: ["BROWSING", "ORDER_SUBMITTED"],
  ORDER_SUBMITTED: ["PAYMENT_REPORTED", "COMPLETED"],
  PAYMENT_REPORTED: ["COMPLETED"],
  COMPLETED: [],
}

export function canTransitionSessionStatus(
  current: GreetingSessionStatus,
  target: GreetingSessionStatus
): boolean {
  if (current === target) return true
  const allowed = VALID_SESSION_TRANSITIONS[current] || []
  return allowed.includes(target)
}

/** Giới hạn độ dài trường khách nhập — chặn spam/payload phình ở link công khai. */
export const ORDER_FIELD_MAX = {
  name: 100,
  address: 300,
  cardMessage: 500,
  senderNote: 500,
  timeSlot: 50,
} as const

/** Đặt trước tối đa bao nhiêu ngày. */
export const MAX_DELIVERY_LEAD_DAYS = 365

const VN_PHONE_REGEX = /^(0|\+84)[35789][0-9]{8}$/
const VN_OFFSET_MS = 7 * 3_600_000

export function normalizePhone(phone: string | undefined | null): string {
  return (phone ?? "").replace(/[\s.-]+/g, "")
}

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function todayInVietnam(now: Date = new Date()): string {
  return new Date(now.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10)
}

/** Trả thông báo lỗi tiếng Việt, hoặc `null` nếu ngày giao hợp lệ. */
export function validateDeliveryDate(value: string | undefined, now: Date = new Date()): string | null {
  const date = (value ?? "").trim()
  if (!date) return "Vui lòng chọn ngày giao hoa"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Ngày giao hoa không hợp lệ"
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return "Ngày giao hoa không hợp lệ"
  }
  const today = todayInVietnam(now)
  if (date < today) return "Ngày giao hoa không được ở trong quá khứ"
  const max = new Date(`${today}T00:00:00Z`)
  max.setUTCDate(max.getUTCDate() + MAX_DELIVERY_LEAD_DAYS)
  if (parsed > max) return `Chỉ nhận đặt trước tối đa ${MAX_DELIVERY_LEAD_DAYS} ngày`
  return null
}

export function validateCustomerOrderInput(
  input: CustomerOrderSubmitInput,
  now: Date = new Date()
): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  const customerName = input.customerName?.trim() ?? ""
  if (!customerName) {
    errors.customerName = "Vui lòng nhập họ tên người đặt hoa"
  } else if (customerName.length > ORDER_FIELD_MAX.name) {
    errors.customerName = `Họ tên tối đa ${ORDER_FIELD_MAX.name} ký tự`
  }

  if (!VN_PHONE_REGEX.test(normalizePhone(input.customerPhone))) {
    errors.customerPhone = "Số điện thoại người đặt không hợp lệ (10 số)"
  }

  const recipientName = input.recipientName?.trim() ?? ""
  if (!recipientName) {
    errors.recipientName = "Vui lòng nhập họ tên người nhận hoa"
  } else if (recipientName.length > ORDER_FIELD_MAX.name) {
    errors.recipientName = `Họ tên tối đa ${ORDER_FIELD_MAX.name} ký tự`
  }

  if (!VN_PHONE_REGEX.test(normalizePhone(input.recipientPhone))) {
    errors.recipientPhone = "Số điện thoại người nhận không hợp lệ (10 số)"
  }

  const dateError = validateDeliveryDate(input.deliveryDate, now)
  if (dateError) errors.deliveryDate = dateError

  const address = input.deliveryAddress?.trim() ?? ""
  if (address.length < 5) {
    errors.deliveryAddress = "Vui lòng nhập địa chỉ giao hoa chi tiết (tối thiểu 5 ký tự)"
  } else if (address.length > ORDER_FIELD_MAX.address) {
    errors.deliveryAddress = `Địa chỉ tối đa ${ORDER_FIELD_MAX.address} ký tự`
  }

  if ((input.cardMessage?.length ?? 0) > ORDER_FIELD_MAX.cardMessage) {
    errors.cardMessage = `Lời nhắn thiệp tối đa ${ORDER_FIELD_MAX.cardMessage} ký tự`
  }
  if ((input.senderNote?.length ?? 0) > ORDER_FIELD_MAX.senderNote) {
    errors.senderNote = `Ghi chú tối đa ${ORDER_FIELD_MAX.senderNote} ký tự`
  }
  if ((input.deliveryTimeSlot?.length ?? 0) > ORDER_FIELD_MAX.timeSlot) {
    errors.deliveryTimeSlot = "Khung giờ giao không hợp lệ"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function mapOrderStatusToTrackingStep(
  orderStatus: string,
  productionStatus: string,
  deliveryStatus: string
): {
  stepIndex: number
  title: string
  description: string
  percentage: number
} {
  if (orderStatus === "CANCELLED") {
    return {
      stepIndex: -1,
      title: "Đơn hàng đã hủy",
      description: "Đơn hàng này đã được hủy bởi cửa hàng.",
      percentage: 0,
    }
  }

  if (deliveryStatus === "DELIVERED" || orderStatus === "COMPLETED") {
    return {
      stepIndex: 4,
      title: "Giao hoa thành công",
      description: "Đơn hoa đã được trao tận tay người nhận với tình cảm trọn vẹn.",
      percentage: 100,
    }
  }

  if (deliveryStatus === "DELIVERING" || deliveryStatus === "DISPATCHED") {
    return {
      stepIndex: 3,
      title: "Đang trên đường giao hoa",
      description: "Shipper đang cẩn thận vận chuyển bình/bó hoa đến địa chỉ nhận.",
      percentage: 75,
    }
  }

  if (productionStatus === "READY" || productionStatus === "ARRANGING") {
    return {
      stepIndex: 2,
      title: productionStatus === "READY" ? "Hoa đã cắm xong" : "Nghệ nhân đang cắm hoa",
      description:
        productionStatus === "READY"
          ? "Bình hoa hoàn thiện đã qua kiểm duyệt chất lượng và sẵn sàng giao."
          : "Florist đang tỉ mỉ lựa chọn từng cành hoa tươi và phối mẫu theo yêu cầu.",
      percentage: 50,
    }
  }

  return {
    stepIndex: 1,
    title: "Đã tiếp nhận đơn hàng",
    description: "Cửa hàng đã nhận thông tin đặt hoa và đang chuẩn bị nguyên liệu.",
    percentage: 25,
  }
}

// ── Hạn dùng link ─────────────────────────────────────────────────────────────

export const DEFAULT_LINK_EXPIRY_DAYS = 30
export const MAX_LINK_EXPIRY_DAYS = 365

/** `null` = không hết hạn. Số ngày ngoài [1, 365] bị kẹp về biên. */
export function computeLinkExpiry(days: number | null | undefined, now: Date = new Date()): Date | null {
  if (days === null) return null
  const d = Math.min(Math.max(Math.round(days ?? DEFAULT_LINK_EXPIRY_DAYS), 1), MAX_LINK_EXPIRY_DAYS)
  return new Date(now.getTime() + d * 86_400_000)
}

export type LinkAvailability = "ACTIVE" | "EXPIRED" | "REVOKED"

/** Link đã có đơn luôn mở được (khách cần xem thanh toán/theo dõi). */
export function linkAvailability(
  s: { expiresAt: Date | null; revokedAt: Date | null; hasOrder: boolean },
  now: Date = new Date()
): LinkAvailability {
  if (s.hasOrder) return "ACTIVE"
  if (s.revokedAt) return "REVOKED"
  if (s.expiresAt && s.expiresAt.getTime() <= now.getTime()) return "EXPIRED"
  return "ACTIVE"
}
