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

/**
 * Cookie JWT phiên liên-app (Unified Shell, B1) — khác cookie phiên ở trên:
 * giá trị TỰ CHỨA danh tính (ký, không tra CSDL), sống ngắn (xem
 * `modules/sso/domain/sso-claims.ts`), và là thứ `LocalBudd`/`SocialFlow` đọc
 * được — cookie phiên gốc (`floraos_session`) chỉ `floraos-core` tự đọc.
 *
 * Cùng quy ước host-only (không đặt `Domain`) như cookie phiên gốc: trên
 * localhost, trình duyệt đã tự gửi cookie theo TÊN MÁY, không phân biệt cổng,
 * nên ba app chạy ba cổng khác nhau trên "localhost" vẫn nhận được cookie này
 * mà không cần domain cha giả nào. Ở môi trường thật, một khi Nhóm C dựng
 * xong proxy, ba app cùng một origin (`app.floraos.vn`) thì càng không cần.
 */
export const SSO_COOKIE = "floraos_sso"

export function readSsoCookie(request: Request): string | null {
  return readCookie(request, SSO_COOKIE)
}

export function serializeSsoCookie(token: string, maxAgeSeconds: number): string {
  const parts = [
    `${SSO_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ]
  if (process.env.NODE_ENV === "production") parts.push("Secure")
  return parts.join("; ")
}

export function serializeClearedSsoCookie(): string {
  return serializeSsoCookie("", 0)
}
