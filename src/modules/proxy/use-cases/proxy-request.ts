/**
 *Proxy use-case — điểm duy nhất orchestrate: giải danh tính → dựng header →
 * gọi sibling → ánh xạ lỗi. Không tự gọi HTTP: đó là việc của adapter.
 *
 * Không cần `organization_id` từ client: core giải từ phiên/SSO/token đã ký,
 * và sibling tự verify JWT/token để lấy tổ chức của chính nó — không có đường
 * nào nhận `organization_id` từ body/query (AGENTS.md, quy ước tenant).
 */

import { AppError } from "@/core/http/errors"
import { readSsoCookie } from "@/core/http/cookies"
import { env } from "@/lib/env"
import { proxyTimeoutSignal, proxyRequest, ProxyError, proxyErrorMessage } from "../infra/proxy-http-adapter"
import { requireProxyUrl, SSO_HEADER, AUTHORIZATION_HEADER, NO_BODY_METHODS, type ProxyClient } from "../domain/proxy-rules"

export { ProxyClient }

/** Danh tính core forward sang sibling. Hai đường, SSO thắng khi có cả hai. */
export type ProxyIdentity =
  | { readonly kind: "sso"; readonly value: string }
  | { readonly kind: "token"; readonly value: string }
  | { readonly kind: "none" }

/** Kết quả proxy đã chuẩn hóa để route trả về. */
export type ProxyResult = {
  readonly status: number
  readonly headers: Record<string, string>
  readonly body: string
}

/** Lỗi proxy đã ánh xạ thành AppError. */
export class ProxyRouteError extends AppError {
  constructor(message: string, code: AppError["code"] = "INTERNAL") {
    super(code, message)
    this.name = "ProxyRouteError"
  }
}

/** Đọc danh tính từ request core. Ưu tiên SSO (hẹp hơn), sau token nền.
 *
 * SSO JWT `floraos_sso` core tự đặt cookie host-only "localhost" — trình duyệt
 * tự gửi kèm khi dashboard gọi proxy same-origin, core đọc ở đây rồi forward
 * làm header `X-FloraOS-SSO` sang sibling (sibling verify bằng chính bí mật
 * `SSO_SESSION_SECRET` dùng chung). Không forward cookie session
 * (`floraos_session`) — sibling không cần, và JWT/token là chứng thư đã ký,
 * tự xác minh được.
 */
export function readProxyIdentity(request: Request): ProxyIdentity {
  const ssoHeader = request.headers.get(SSO_HEADER)?.trim()
  if (ssoHeader) return { kind: "sso", value: ssoHeader }

  // Dashboard core không tự gửi JWT — core đọc cookie `floraos_sso` rồi forward.
  const ssoCookie = readSsoCookie(request)
  if (ssoCookie) return { kind: "sso", value: ssoCookie }

  const auth = request.headers.get(AUTHORIZATION_HEADER)?.trim()
  if (auth) return { kind: "token", value: auth }

  return { kind: "none" }
}

/** Dựng headers forward sang sibling. Chỉ forward JWT/token + content-type. */
export function buildForwardHeaders(input: {
  identity: ProxyIdentity
  contentType: string | undefined
  extra: Record<string, string>
}): Record<string, string> {
  const headers: Record<string, string> = {}
  if (input.identity.kind === "sso") {
    headers[SSO_HEADER] = input.identity.value
  } else if (input.identity.kind === "token") {
    headers[AUTHORIZATION_HEADER] = input.identity.value
  }
  if (input.contentType) {
    headers["content-type"] = input.contentType
  }
  for (const [k, v] of Object.entries(input.extra)) {
    headers[k] = v
  }
  return headers
}

/**
 * Gọi sibling qua proxy. `path` bắt đầu bằng `/` (vd. `/api/m04b/background-removal`).
 * Không forward cookie core — sibling tự verify JWT/token.
 */
export async function callProxy(input: {
  client: ProxyClient
  request: Request
  path: string
}): Promise<ProxyResult> {
  const baseUrl = requireProxyUrl(
    input.client,
    input.client === "SOCIALFLOW" ? env.SOCIALFLOW_URL : env.LOCALBUDD_URL
  )
  const identity = readProxyIdentity(input.request)

  const method = input.request.method.toUpperCase()
  const contentType = input.request.headers.get("content-type") ?? undefined
  const body =
    method !== "GET" && method !== "HEAD" && !NO_BODY_METHODS.includes(method)
      ? await input.request.text()
      : null

  const headers = buildForwardHeaders({
    identity,
    contentType,
    extra: { accept: "application/json" },
  })

  const { signal, cancel } = proxyTimeoutSignal()
  try {
    const res = await proxyRequest({
      client: input.client,
      baseUrl,
      method,
      path: input.path,
      headers,
      body,
      signal,
    })
    return { status: res.status, headers: res.headers, body: res.body }
  } catch (err) {
    if (err instanceof ProxyError) {
      throw new ProxyRouteError(err.message, "INTERNAL")
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new ProxyRouteError(`Proxy sang ${input.client} timeout sau ${20}s`, "INTERNAL")
    }
    throw new ProxyRouteError(
      `Không gọi được ${input.client}: ${err instanceof Error ? err.message : String(err)}`,
      "INTERNAL"
    )
  } finally {
    cancel()
  }
}

/** Ánh xạ proxy response thành AppError khi không phải 2xx. */
export function toProxyError(res: ProxyResult, client: ProxyClient): ProxyRouteError | null {
  if (res.status >= 200 && res.status < 300) return null
  const message = proxyErrorMessage(res)
  const code: AppError["code"] =
    res.status === 401 || res.status === 403
      ? "UNAUTHENTICATED"
      : res.status === 404
        ? "NOT_FOUND"
        : res.status === 400 || res.status === 422
          ? "VALIDATION_FAILED"
          : "INTERNAL"
  return new ProxyRouteError(`[${client}] ${message}`, code)
}

/** Kiểm proxy response có phải binary (download) không. */
export function isBinaryResponse(headers: Record<string, string>): boolean {
  const ct = headers["content-type"] ?? headers["Content-Type"] ?? ""
  return (
    ct.includes("image/") ||
    ct.includes("application/octet-stream") ||
    ct.includes("application/pdf") ||
    ct.includes("application/zip")
  )
}