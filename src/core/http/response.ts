import { AppError } from "./errors"

export function jsonResponse(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> }
): Response {
  const headers = new Headers({ "content-type": "application/json; charset=utf-8" })
  for (const [key, value] of Object.entries(init?.headers ?? {})) headers.append(key, value)
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

/** Bọc một handler để mọi `AppError` ném ra đều thành đáp ứng đúng hình dạng. */
export function handle(fn: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await fn(request)
    } catch (error) {
      return errorResponse(error)
    }
  }
}
