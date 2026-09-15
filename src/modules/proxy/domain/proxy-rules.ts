/**
 *Proxy sang engine ngoài — luật thuần, không chạm Prisma, không chạm
 * `node:crypto` (giống `token-rules.ts` cùng thư mục).
 *
 * Dashboard `floraos-core` (3100) muốn chạy một tính năng thuộc `LocalBudd`
 * (3000) hay `SocialFlow` (8000) mà KHÔNG chuyển sang UI của app đó. Ba app
 * ba cổng nên trình duyệt blocked mọi call cross-origin (CORS), và cookie
 * `floraos_session`/`floraos_sso` host-only "localhost" tự đi kèm trong cùng
 * một host nhưng KHÔNG tự đi qua cổng khác.
 *
 * Giải pháp duy nhất đúng: core làm PROXY SERVER-SIDE. Dashboard fetch
 * same-origin `/api/v1/proxy/[...path]`, core server-side gọi sibling bằng HTTP
 * server-to-server (không CORS), forward danh tính theo đúng hai cơ chế đã có
 * từ trước (Unified Shell B1/B2, P7 Integration Layer), rồi trả response về
 * cho trình duyệt.
 *
 * Hai đường danh tính forwarded:
 *   - `X-FloraOS-SSO: <jwt>` — thay mặt NGƯỜI DÙNG đang đăng nhập. Sibling đã
 *     có `sso_auth.py`/`sso-jwt.ts` để verify, `claims.org` là tổ chức. Dùng cho
 *     mọi tính năng theo người dùng.
 *   - `Authorization: Bearer <token>` — token MÁY GỌI MÁY (`integration_tokens`,
 *     `F9`). Gắn cứng một tổ chức, dùng cho lời gọi nền. Core không tự cấp token
 *     mới cho proxy; dashboard gửi token đã có (hoặc không cần nếu đi SSO).
 *
 * SSO thắng khi có cả hai (cùng quy ước với `integration-credential.ts`): chọn
 * cái hẹp hơn — SSO bị locked vào đúng tổ chức của người thao tác và mang theo
 * năng lực thật, trong khi token nền mở toàn bộ tổ chức đã cấp.
 */

import { AppError } from "@/core/http/errors"

export type ProxyClient = "SOCIALFLOW" | "LOCALBUDD"

/** Tên header core forward JWT `floraos_sso` khi gọi server-to-server. */
export const SSO_HEADER = "x-floraos-sso"

/** Tên header core forward token máy-gọi-máy. */
export const AUTHORIZATION_HEADER = "authorization"

/** Khoảng timeout khi gọi sibling, mili-giây. Tăng lên 120s để đảm bảo đủ thời gian
 * cho các tác vụ AI suy luận cục bộ (Local LLM Qwen sinh đa kênh Facebook,
 * Instagram, TikTok, Zalo). */
export const PROXY_TIMEOUT_MS = 120_000

/** Danh sách method không forward body (GET/HEAD/DELETE). */
export const NO_BODY_METHODS: readonly string[] = ["GET", "HEAD", "DELETE"]

/** Kiểm một client được proxy có cấu hình URL chưa. */
export function requireProxyUrl(client: ProxyClient, url: string | undefined): string {
  if (!url) {
    throw new AppError(
      "INTERNAL",
      `Proxy sang ${client} chưa được cấu hình — set ${client === "SOCIALFLOW" ? "SOCIALFLOW_URL" : "LOCALBUDD_URL"} trong .env`
    )
  }
  return url
}