/**
 * Khóa tính năng chưa mở cho khách trên môi trường production.
 *
 * Bật khi `NEXT_PUBLIC_APP_ENV=production` (đặt trên dịch vụ production, biến
 * NEXT_PUBLIC_ gắn lúc build). Dev local và staging/preview không đặt biến
 * này → mọi tính năng chạy bình thường.
 *
 * Luật thuần — không import React.
 */

import { STORE_JOURNEYS } from "@/modules/journey/domain/journey-catalog"

/** Tuyến (và mọi tuyến con) bị khóa: sidebar làm mờ + trang hiện "Sắp ra mắt". */
export const LOCKED_ROUTE_PREFIXES: readonly string[] = [
  "/hoi-thoai",
  "/catalog",
  "/market-intelligence",
  "/creative-studio",
  "/video",
  "/noi-dung",
  "/lich-dang",
  "/kho-templates",
  // Nhóm "Vận hành" trên sidebar (PO 08/10/2026)
  "/dieu-phoi",
  "/job",
  "/duyet",
  "/so-lieu",
  "/muc-dung",
  "/audit",
  // Sidebar: Tính giá (Sản phẩm) + Tri thức, Chính sách AI, Kết nối kênh (Thiết lập) — PO 09/10/2026
  "/gia",
  "/tri-thuc",
  "/cai-dat-ai",
  "/ket-noi",
]

/**
 * Trang chủ cửa hàng trên production: CHỈ các thẻ này hoạt động (PO 08/10/2026 —
 * chỉ mở Thẻ chào mẫu hoa). Mọi thẻ khác của cửa hàng bị khóa "Sắp ra mắt".
 * Thẻ quản trị nền tảng / chuỗi không thuộc trang chủ cửa hàng nên không bị ảnh hưởng.
 */
export const UNLOCKED_STORE_JOURNEY_IDS: readonly string[] = ["greeting-card-hub"]

/** Thẻ chức năng trên trang chủ cửa hàng bị khóa (theo `JourneyDefinition.id`). */
export const LOCKED_JOURNEY_IDS: readonly string[] = STORE_JOURNEYS.map((j) => j.id).filter(
  (id) => !UNLOCKED_STORE_JOURNEY_IDS.includes(id)
)

export const COMING_SOON_LABEL = "Sắp ra mắt"

export function isFeatureLockEnabled(
  appEnv: string | undefined = process.env.NEXT_PUBLIC_APP_ENV
): boolean {
  return appEnv === "production"
}

/** `href` có thể kèm query (`/creative-studio?tab=area-d`). */
export function isRouteLocked(href: string, enabled = isFeatureLockEnabled()): boolean {
  if (!enabled) return false
  const path = href.split(/[?#]/)[0] ?? href
  return LOCKED_ROUTE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export function isJourneyLocked(journeyId: string, enabled = isFeatureLockEnabled()): boolean {
  return enabled && LOCKED_JOURNEY_IDS.includes(journeyId)
}
