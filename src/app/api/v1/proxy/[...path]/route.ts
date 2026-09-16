/**
 *Proxy route — `/api/v1/proxy/[...path]?client=SOCIALFLOW|LOCALBUDD`.
 *
 * Core làm proxy server-side để dashboard gọi tính năng thuộc engine ngoài
 * (LocalBudd/SocialFlow) mà không chuyển UI. Xem `domain/proxy-rules.ts` và
 * `use-cases/proxy-request.ts`.
 *
 * An toàn: không proxy mọi URL — chỉ forward path đã whitelist theo client,
 * và forward body/raw headers theo đúng danh tính (JWT/Token), không forward
 * cookie core sang sibling.
 *
 * Dùng `Request` + `context` (Next 16 dynamic route signature) thay vì
 * `NextRequest`, để handler là hàm thuần — bộ test cách ly tenant
 * (`tests/tenant/`) có thể gọi thẳng handler bằng một `Request` giả, giống
 * mọi route khác trong repo (xem `handle()` ở `core/http/response.ts`).
 */

import { handle } from "@/core/http/response"
import { AppError } from "@/core/http/errors"
import { callProxy, toProxyError } from "@/modules/proxy/use-cases/proxy-request"
import type { ProxyClient } from "@/modules/proxy/domain/proxy-rules"

/** Whitelist path prefix theo client — không proxy linh tinh. */
const ALLOWED_PREFIX: Record<ProxyClient, string[]> = {
  SOCIALFLOW: ["api/m04b", "api/m07", "api/posts", "api/accounts"],
  LOCALBUDD: [
    "api/v1/catalog-links",
    "api/v1/projects",
    "api/v1/generate",
    "api/v1/pages",
    "api/v1/worker/cron",
  ],
}

/** Kiểm path được phép proxy cho client này. */
function isAllowedPath(client: ProxyClient, path: string): boolean {
  return ALLOWED_PREFIX[client].some((prefix) => path === prefix || path.startsWith(prefix + "/"))
}

/** Trả về Response từ proxy result. */
function toResponse(res: { status: number; headers: Record<string, string>; body: string }): Response {
  const headers = new Headers()
  for (const [key, value] of Object.entries(res.headers)) {
    // content-length/transfer-encoding do sibling set, core Next tự tính lại.
    if (key === "content-length" || key === "transfer-encoding") continue
    headers.set(key, value)
  }
  return new Response(res.body, { status: res.status, headers })
}

async function proxyHandler(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await context.params
  const url = new URL(request.url)
  const clientParam = url.searchParams.get("client")
  if (!clientParam || (clientParam !== "SOCIALFLOW" && clientParam !== "LOCALBUDD")) {
    throw new AppError("VALIDATION_FAILED", "Thiếu hoặc sai tham số `client` (SOCIALFLOW | LOCALBUDD)")
  }
  const client = clientParam as ProxyClient

  const path = "/" + pathParts.join("/")
  const normalized = path.replace(/^\//, "")
  if (!isAllowedPath(client, normalized)) {
    throw new AppError("NOT_FOUND", "Đường dẫn này không được proxy")
  }

  const res = await callProxy({ client, request, path })
  const err = toProxyError(res, client)
  if (err) throw err

  return toResponse(res)
}

export const GET = handle(proxyHandler)
export const POST = handle(proxyHandler)
export const PUT = handle(proxyHandler)
export const PATCH = handle(proxyHandler)
export const DELETE = handle(proxyHandler)

export const dynamic = "force-dynamic" as const
export const revalidate = 0 as const