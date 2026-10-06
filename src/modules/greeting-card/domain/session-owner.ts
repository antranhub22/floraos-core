/**
 * Chủ phiên Thẻ chào (`/b/<mã phiên>`). URL bộ sưu tập là công khai, nhưng phiên của khách thì
 * không: trình duyệt mở link đầu tiên nhận cookie chủ phiên; người khác mở cùng URL (khách chuyển
 * tiếp link) không thấy và không sửa được lựa chọn, đơn hàng của người trước. Pure TypeScript.
 */

export const OWNER_COOKIE_PREFIX = "fl_b_"
export const OWNER_COOKIE_MAX_AGE = 90 * 86_400
/** Sự kiện hành trình đánh dấu phiên đã có chủ (lưu ở `greeting_journey_events`). */
export const OWNER_CLAIMED_EVENT = "OWNER_CLAIMED"

export function ownerCookieName(sendCode: string): string {
  return `${OWNER_COOKIE_PREFIX}${sendCode.toUpperCase()}`
}

/** Ai đang xem trang phiên. */
export type BrochureViewer = "OWNER" | "UNCLAIMED" | "STAFF" | "OTHER"

export function decideViewer(input: { tokenValid: boolean; claimed: boolean; staffOfShop: boolean }): BrochureViewer {
  if (input.tokenValid) return "OWNER"
  if (input.staffOfShop) return "STAFF"
  return input.claimed ? "OTHER" : "UNCLAIMED"
}
