/**
 * Infrastructure cho module Journey.
 * Hỗ trợ lưu trữ trạng thái hành trình phía client (sessionStorage/localStorage).
 */

const JOURNEY_STATE_STORAGE_KEY_PREFIX = "floraos_journey_state_"

export const journeyStorage = {
  saveState(journeyId: string, state: unknown): void {
    if (typeof window === "undefined") return
    try {
      window.sessionStorage.setItem(
        `${JOURNEY_STATE_STORAGE_KEY_PREFIX}${journeyId}`,
        JSON.stringify(state)
      )
    } catch {
      // Bỏ qua lỗi quota hoặc private browsing
    }
  },

  loadState<T>(journeyId: string): T | null {
    if (typeof window === "undefined") return null
    try {
      const raw = window.sessionStorage.getItem(
        `${JOURNEY_STATE_STORAGE_KEY_PREFIX}${journeyId}`
      )
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  },

  clearState(journeyId: string): void {
    if (typeof window === "undefined") return
    try {
      window.sessionStorage.removeItem(
        `${JOURNEY_STATE_STORAGE_KEY_PREFIX}${journeyId}`
      )
    } catch {
      // Bỏ qua lỗi
    }
  },
}
