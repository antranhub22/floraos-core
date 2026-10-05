/**
 * Phạm vi xem đơn Thẻ chào của nhân viên bán hàng (`organizations.settings.brochure_visibility`).
 * Điều hành chọn theo giai đoạn: ALL = ai có quyền xem đơn cũng thấy mọi đơn (mặc định);
 * OWN = sale chỉ thấy link/đơn do chính mình gửi. Pure TypeScript.
 */

export const VISIBILITY_SETTINGS_KEY = "brochure_visibility"
export type VisibilityMode = "ALL" | "OWN"

/**
 * Người có một trong các năng lực này luôn thấy mọi đơn (điều hành, điều phối, giao hàng,
 * kế toán, quản trị) — chế độ OWN chỉ áp cho nhân viên bán hàng thuần.
 */
export const SEE_ALL_CAPABILITIES = ["R4", "R5", "R9", "F2"] as const

export function parseVisibilityMode(settings: unknown): VisibilityMode {
  const root = settings && typeof settings === "object" ? (settings as Record<string, unknown>) : {}
  const raw = root[VISIBILITY_SETTINGS_KEY]
  const mode = raw && typeof raw === "object" ? (raw as Record<string, unknown>).mode : undefined
  return mode === "OWN" ? "OWN" : "ALL"
}

/** `userId` khi phải lọc theo sale phụ trách; `null` = thấy tất cả. */
export function ownSaleScope(
  mode: VisibilityMode,
  user: { userId: string | null | undefined; capabilities: ReadonlySet<string> },
): string | null {
  if (mode !== "OWN" || !user.userId) return null
  return SEE_ALL_CAPABILITIES.some((c) => user.capabilities.has(c)) ? null : user.userId
}
