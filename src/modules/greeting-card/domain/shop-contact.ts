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
  /** Thông tin tạo niềm tin trong khung "Thông tin cửa hàng" (PO 08/10/2026); thiếu = ẩn. */
  email?: string | null | undefined
  websites?: string[] | undefined
  socialLinks?: ShopLink[] | undefined
  /** Cam kết từ Chính sách trong Hồ sơ tiệm (chỉ phần dành cho khách). */
  commitments?: ShopCommitment[] | undefined
}

export interface ShopLink {
  label: string
  url: string
}

export interface ShopCommitment {
  id: string
  title: string
  customerText: string
}

export const MAX_SHOP_WEBSITES = 5
const SOCIAL_LABELS: Array<[string, string]> = [["facebook", "Facebook"], ["instagram", "Instagram"], ["tiktok", "TikTok"]]

/** Link công khai: chỉ `http(s)://` (thiếu giao thức → thêm `https://`); chặn `javascript:`, chuỗi có khoảng trắng. */
export function safeWebUrl(value: unknown): string | null {
  if (typeof value !== "string") return null
  const v = value.trim()
  if (!v || /\s/.test(v)) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v.replace(/^\/+/, "")}`
  try {
    const url = new URL(withScheme)
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".") ? url.toString() : null
  } catch {
    return null
  }
}

/** `https://www.tiemhoa.vn/` → `tiemhoa.vn` (chữ hiện cho khách). */
export function websiteLabel(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "")
}

/** Website chính (`business_profiles.website`) + "Website khác" (`social_links.websites`), bỏ trùng, tối đa 5. */
export function shopWebsites(website: unknown, socialLinks: unknown): string[] {
  const extra = socialLinks && typeof socialLinks === "object" ? (socialLinks as Record<string, unknown>).websites : null
  const all = [website, ...(Array.isArray(extra) ? extra : [])].map(safeWebUrl).filter((u): u is string => !!u)
  return [...new Set(all)].slice(0, MAX_SHOP_WEBSITES)
}

export function shopSocialLinks(socialLinks: unknown): ShopLink[] {
  if (!socialLinks || typeof socialLinks !== "object") return []
  const raw = socialLinks as Record<string, unknown>
  return SOCIAL_LABELS.flatMap(([key, label]) => {
    const url = safeWebUrl(raw[key])
    return url ? [{ label, url }] : []
  })
}

export function safeEmail(value: unknown): string | null {
  const v = typeof value === "string" ? value.trim() : ""
  return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(v) && v.length <= 254 ? v : null
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
  email?: string | null | undefined
  website?: string | null | undefined
  socialLinks?: unknown
  commitments?: ReadonlyArray<{ id: string; title: string; customerText: string }> | undefined
}): ShopContact {
  const phone = raw.phone?.replace(/\s+/g, "") || null
  return {
    name: raw.name,
    phone,
    zaloUrl: zaloChatUrl(phone),
    zaloQrUrl: raw.zaloQrUrl ?? null,
    address: raw.address?.trim() || null,
    logoUrl: raw.logoUrl,
    ...(raw.email !== undefined ? { email: safeEmail(raw.email) } : {}),
    ...(raw.website !== undefined || raw.socialLinks !== undefined
      ? { websites: shopWebsites(raw.website, raw.socialLinks), socialLinks: shopSocialLinks(raw.socialLinks) }
      : {}),
    // Chỉ nội dung dành cho khách — không lộ ghi chú nội bộ (`internalText`)
    ...(raw.commitments ? { commitments: raw.commitments.map(({ id, title, customerText }) => ({ id, title, customerText })) } : {}),
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
 * Ảnh ở cửa sổ "Quét mã kết nối Zalo": CHỈ ô Mã QR Zalo (`zalo_qr`). Ô `qr_code` cũ từng được
 * hướng dẫn tải mã QR ngân hàng (và dữ liệu mẫu là VietQR giả) nên không dùng — PO 08/10/2026.
 * Không có → trang khách tự sinh QR từ link Zalo.
 */
export function zaloQrUrlFromBrandAssets(brandAssets: unknown): string | null {
  if (!brandAssets || typeof brandAssets !== "object") return null
  return safeImageUrl((brandAssets as Record<string, unknown>).zalo_qr)
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
