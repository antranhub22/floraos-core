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
