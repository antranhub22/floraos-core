/**
 * Thông tin liên hệ cửa hàng hiện trên trang khách Thẻ chào (thanh trên cùng,
 * trang link hết hạn). Pure TypeScript.
 */

export interface ShopContact {
  name: string
  /** Số gọi được (đã bỏ khoảng trắng) hoặc `null` khi tiệm chưa khai */
  phone: string | null
  /** Link mở chat Zalo theo SĐT, hoặc `null` khi không có SĐT di động VN */
  zaloUrl: string | null
  /** Ảnh/mã QR kết nối Zalo của tiệm (từ Hồ sơ cửa hàng), hoặc `null` */
  zaloQrUrl?: string | null | undefined
  address: string | null
  logoUrl: string | null
}

/** Số di động VN dạng 0xxxxxxxxx (Zalo cá nhân/OA mở theo số này). */
export function zaloChatUrl(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "")
  const local = digits.startsWith("84") ? `0${digits.slice(2)}` : digits
  return /^0[35789]\d{8}$/.test(local) ? `https://zalo.me/${local}` : null
}

export function toShopContact(raw: {
  name: string
  phone: string | null
  address: string | null
  logoUrl: string | null
  zaloQrUrl?: string | null | undefined
}): ShopContact {
  const phone = raw.phone?.replace(/\s+/g, "") || null
  return {
    name: raw.name,
    phone,
    zaloUrl: zaloChatUrl(phone),
    zaloQrUrl: raw.zaloQrUrl ?? null,
    address: raw.address?.trim() || null,
    logoUrl: raw.logoUrl,
  }
}

/** Ảnh QR hiện trên trang công khai: chỉ nhận `https://` hoặc đường dẫn nội bộ `/…` (chặn `javascript:`, `//host`). */
export function safeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null
  const v = value.trim()
  if (v.startsWith("/") && !v.startsWith("//")) return v
  return /^https:\/\/[^\s]+$/i.test(v) ? v : null
}

/**
 * Hồ sơ mẫu "Tiệm Hoa Mộc Lan" (dữ liệu trải nghiệm) — PO 08/10/2026: không để khách thấy tên/SĐT mẫu.
 * Tiệm còn hồ sơ mẫu thì máy chủ chặn tạo link gửi khách cho tới khi sửa Hồ sơ tiệm.
 */
export const DEMO_SHOP_NAME = "Tiệm Hoa Mộc Lan"
export const DEMO_SHOP_PHONE_DIGITS = "0900123456"
export const DEMO_SHOP_PROFILE_MESSAGE =
  "Hồ sơ tiệm vẫn là thông tin mẫu (Tiệm Hoa Mộc Lan). Vào Hồ sơ tiệm sửa tên, số điện thoại, địa chỉ thật trước khi gửi link cho khách."

export function isDemoShopContact(contact: { name: string | null | undefined; phone: string | null | undefined }): boolean {
  const digits = (contact.phone ?? "").replace(/\D/g, "")
  return contact.name?.trim() === DEMO_SHOP_NAME || digits === DEMO_SHOP_PHONE_DIGITS
}

/** Việc cần làm trên hồ sơ trước khi bán (hiện ở màn Thẻ chào); `null` = sẵn sàng. */
export function shopProfileGap(contact: { name: string | null | undefined; phone: string | null | undefined } | null): string | null {
  if (contact && isDemoShopContact(contact)) return DEMO_SHOP_PROFILE_MESSAGE
  if (!contact?.phone?.trim()) return "Hồ sơ tiệm chưa có số điện thoại — khách sẽ không gọi hoặc nhắn Zalo cho tiệm được từ trang đặt hoa."
  return null
}
