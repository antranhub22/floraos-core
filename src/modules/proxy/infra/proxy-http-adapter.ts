/**
 *Adapter HTTP cho proxy — nơi duy nhất core gọi sibling. Không ghi kho tệp
 * (theo AGENTS.md: adapter trả byte/handle, use-case xử lý).
 *
 * Dùng `undici` (Node 18+ built-in `fetch`) — không thêm thư viện. Ba app đều
 * Node/Python nên không cần custom agent; timeout dùng `AbortController`.
 */

import type { ProxyClient } from "../domain/proxy-rules"
import { PROXY_TIMEOUT_MS } from "../domain/proxy-rules"

/** Kết quả của một lần proxy — status + headers + body (đã decode). */
export type ProxyResponse = {
  readonly status: number
  readonly headers: Record<string, string>
  /** Body dưới dạng text (để dashboard tự parse JSON/binary). */
  readonly body: string
}

/** Lỗi proxy — message thân thiện với người dùng core. */
export class ProxyError extends Error {
  constructor(
    message: string,
    readonly status: number | null
  ) {
    super(message)
    this.name = "ProxyError"
  }
}

/**
 * Gọi sibling server-to-server, forward body + headers theo đúng danh tính.
 * Không forward cookie của core sang sibling — sibling chỉ cần JWT/Token.
 */
export async function proxyRequest(input: {
  client: ProxyClient
  baseUrl: string
  method: string
  path: string
  headers: Record<string, string>
  body: string | null
  signal: AbortSignal
}): Promise<ProxyResponse> {
  const finalUrl = input.baseUrl.replace(/\/$/, "") + "/" + input.path.replace(/^\//, "")

  const res = await fetch(finalUrl, {
    method: input.method,
    headers: input.headers,
    body: input.body,
    signal: input.signal,
  })

  const text = await res.text()
  const headers: Record<string, string> = {}
  res.headers.forEach((value, key) => {
    headers[key] = value
  })

  return { status: res.status, headers, body: text }
}

/** Tạo AbortSignal với timeout. */
export function proxyTimeoutSignal(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS)
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(id),
  }
}

/** Kiểm tra proxy response có phải JSON không. */
export function isJsonResponse(headers: Record<string, string>): boolean {
  const ct = headers["content-type"] ?? headers["Content-Type"] ?? ""
  return ct.includes("application/json")
}

/** Parse proxy error từ response không phải 2xx. */
export function proxyErrorMessage(res: ProxyResponse): string {
  if (isJsonResponse(res.headers)) {
    try {
      const data = JSON.parse(res.body)
      return data?.error?.message ?? data?.detail ?? `Sibling trả về ${res.status}`
    } catch {
      // fall through
    }
  }
  return `Sibling trả về ${res.status}`
}