/**
 * Khóa tính năng chưa mở cho khách trên môi trường production.
 *
 * Bật khi `NEXT_PUBLIC_APP_ENV=production` (đặt trên dịch vụ production, biến
 * NEXT_PUBLIC_ gắn lúc build). Dev local và staging/preview không đặt biến
 * này → mọi tính năng chạy bình thường.
 *
 * Luật thuần — không import React.
 */

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
]

/** Thẻ chức năng trên trang chủ bị khóa (theo `JourneyDefinition.id`). */
export const LOCKED_JOURNEY_IDS: readonly string[] = [
  "market-intelligence-explore",
  "create-marketing-copy",
  "create-audio-voiceover",
  "create-marketing-image",
  "create-product-video",
  "create-catalog-collection",
  "manage-customers",
  "launch-product-combo",
  "customer-service-chatbot",
]

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
