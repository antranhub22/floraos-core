"use client"

import { useCallback, useEffect, useRef } from "react"

type TrackedEvent = "VIEW" | "DETAIL" | "FORM_OPEN"
const VISITOR_KEY = "floraos:visitor"

/** Mã khách ngẫu nhiên trên máy (không phải danh tính) — để đếm khách không trùng. */
function visitorId(): string {
  try {
    const saved = window.localStorage.getItem(VISITOR_KEY)
    if (saved) return saved
    const id = crypto.randomUUID()
    window.localStorage.setItem(VISITOR_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

/**
 * Đếm lượt xem/xem chi tiết/mở form theo kênh `?kenh=`. Gửi kiểu "bắn rồi quên":
 * lỗi mạng hay máy chủ không bao giờ chặn hoặc làm chậm khách.
 */
export function useCatalogTracking(catalogId: string) {
  const ctx = useRef<{ channel: string | undefined; visitorId: string } | null>(null)

  const track = useCallback(
    (type: TrackedEvent) => {
      try {
        ctx.current ??= { channel: new URLSearchParams(window.location.search).get("kenh") ?? undefined, visitorId: visitorId() }
        void fetch(`/api/v1/public/greeting-catalog/${catalogId}/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, ...ctx.current }),
          keepalive: true,
        }).catch(() => undefined)
      } catch {
        // bỏ qua — thống kê không được ảnh hưởng khách
      }
    },
    [catalogId]
  )

  useEffect(() => track("VIEW"), [track])

  /** Kênh + mã khách gửi kèm đơn để máy chủ ghi bước ORDER. */
  const orderMeta = useCallback(() => {
    ctx.current ??= { channel: new URLSearchParams(window.location.search).get("kenh") ?? undefined, visitorId: visitorId() }
    return ctx.current
  }, [])

  return { track, orderMeta }
}
