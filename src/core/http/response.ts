import { AppError } from "./errors"

export function jsonResponse(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string | string[]> }
): Response {
  const headers = new Headers({ "content-type": "application/json; charset=utf-8" })
  // `string[]` cho một khoá — cần khi một response phải đặt NHIỀU Set-Cookie
  // cùng lúc (Unified Shell B1: cookie phiên hiện có + cookie JWT liên-app),
  // điều `Headers.set` không làm được vì nó ghi đè thay vì cộng dồn.
  for (const [key, value] of Object.entries(init?.headers ?? {})) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v)
    } else {
      headers.append(key, value)
    }
  }
  return new Response(JSON.stringify(body), { status: init?.status ?? 200, headers })
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return jsonResponse(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.status }
    )
  }

  // Lỗi ngoài dự kiến không lộ chi tiết ra ngoài (`YC-S`, đặc tả 06 mục 2).
  console.error("[api] lỗi không lường trước", error)
  return jsonResponse(
    { error: { code: "INTERNAL", message: "Lỗi hệ thống" } },
    { status: 500 }
  )
}

/**
 * Bọc một handler để mọi `AppError` ném ra đều thành đáp ứng đúng hình dạng.
 *
 * Generic theo `Args` để cùng một `handle` dùng được cho cả route tĩnh (chỉ
 * `request`) lẫn route động của Next.js, vốn gọi handler bằng
 * `(request, { params })` với `params` là một `Promise` (Next 16).
 */
export function handle<Args extends unknown[]>(
  fn: (request: Request, ...args: Args) => Promise<Response>
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    try {
      return await fn(request, ...args)
    } catch (error) {
      return errorResponse(error)
    }
  }
}
