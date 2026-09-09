/**
 * `YC-U7` — chống trùng cho mọi `POST` tạo job. Client gửi `Idempotency-Key`
 * qua header; cùng khoá trong 24 giờ trả lại job cũ thay vì tạo job mới.
 * Thuần: chỉ đọc header, không chạm cơ sở dữ liệu.
 */
export const IDEMPOTENCY_KEY_HEADER = "idempotency-key"
export const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000

export function readIdempotencyKey(request: Request): string | null {
  const value = request.headers.get(IDEMPOTENCY_KEY_HEADER)
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
