/**
 * Một hình dạng lỗi duy nhất cho toàn bộ `/api/v1/` (đặc tả 06 mục 2).
 *
 *   { "error": { "code": "…", "message": "…", "details": { } } }
 */

export type ErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "CAPABILITY_DENIED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "QUOTA_EXCEEDED"
  | "UNPROCESSABLE_ENTITY"
  | "RATE_LIMITED"
  | "INTERNAL"

const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  CAPABILITY_DENIED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  QUOTA_EXCEEDED: 422,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
}

export class AppError extends Error {
  readonly code: ErrorCode
  readonly details: Record<string, unknown> | undefined

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.details = details
  }

  get status(): number {
    return HTTP_STATUS[this.code]
  }
}

/**
 * Không tìm thấy — hoặc thuộc tổ chức khác. Hai trường hợp trả về cùng một
 * câu trả lời là có chủ đích: phân biệt chúng là xác nhận bản ghi tồn tại.
 */
export function notFound(): AppError {
  return new AppError("NOT_FOUND", "Không tìm thấy")
}

export function unauthenticated(): AppError {
  return new AppError("UNAUTHENTICATED", "Cần đăng nhập")
}

export function validationFailed(details?: Record<string, unknown>): AppError {
  return new AppError("VALIDATION_FAILED", "Dữ liệu gửi lên không hợp lệ", details)
}

export function conflict(message: string): AppError {
  return new AppError("CONFLICT", message)
}

/** Hạn mức chặn tại điểm tạo job, trước khi job vào bảng (`YC-U3`). */
export function quotaExceeded(message: string, details?: Record<string, unknown>): AppError {
  return new AppError("QUOTA_EXCEEDED", message, details)
}
