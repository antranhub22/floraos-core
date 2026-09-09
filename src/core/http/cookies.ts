/**
 * Cookie phiên (`YC-S1`): `HttpOnly`, `Secure`, `SameSite=Lax`.
 *
 * Đọc và ghi cookie ở đây thay vì qua `next/headers` để route handler vẫn là
 * một hàm thuần của `Request` — nhờ vậy bộ test cách ly tenant gọi thẳng
 * được handler, không cần dựng máy chủ.
 */
export const SESSION_COOKIE = "floraos_session"

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie")
  if (!header) return null

  for (const part of header.split(";")) {
    const index = part.indexOf("=")
    if (index === -1) continue
    if (part.slice(0, index).trim() !== name) continue
    return decodeURIComponent(part.slice(index + 1).trim())
  }
  return null
}

export function serializeSessionCookie(token: string, maxAgeSeconds: number): string {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ]
  if (process.env.NODE_ENV === "production") parts.push("Secure")
  return parts.join("; ")
}

export function serializeClearedSessionCookie(): string {
  return serializeSessionCookie("", 0)
}
