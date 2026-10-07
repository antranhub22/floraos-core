/** Trạng thái đóng/mở nhóm menu và mục Báo cáo — localStorage, gắn organization_id để không lẫn giữa tổ chức. */
export function navStorageKeys(orgId?: string | null) {
  const suffix = orgId ? `__${orgId}` : ""
  return { groupsKey: `floraos_nav_groups_v1${suffix}`, reportsKey: `floraos_nav_reports_open_v1${suffix}` }
}

export function loadNavGroups(key: string): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function persistNavGroups(key: string, states: Record<string, boolean>): void {
  try {
    localStorage.setItem(key, JSON.stringify(states))
  } catch {
    // localStorage bị khoá — chỉ mất ghi nhớ trạng thái
  }
}

/** Mục Báo cáo mặc định mở khi chưa lưu gì. */
export function loadReportsOpen(key: string): boolean {
  try {
    return localStorage.getItem(key) !== "false"
  } catch {
    return true
  }
}
