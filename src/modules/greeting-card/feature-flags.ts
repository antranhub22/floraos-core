/**
 * Feature flags cho module Thẻ chào / Swipe Brochure (§34.16).
 * Tất cả flag đọc từ env — không hardcode.
 *
 * Cách dùng (server-side only):
 *   import { isGreetingCardEnabled } from "@/modules/greeting-card/feature-flags"
 *   if (!isGreetingCardEnabled()) throw featureDisabled()
 */

/**
 * Trả `true` khi GREETING_CARD_ENABLED !== "false" (mặc định: bật).
 * Chỉ gọi trong Server Component, API Route hoặc Server Action.
 */
export function isGreetingCardEnabled(): boolean {
  return process.env["GREETING_CARD_ENABLED"] !== "false"
}
