import { AppError } from "./errors"

/**
 * Giới hạn tần suất cho endpoint CÔNG KHAI (không đăng nhập) — cửa sổ trượt
 * đơn giản, giữ trong bộ nhớ tiến trình.
 *
 * Giới hạn đã biết: mỗi instance đếm riêng và mất khi khởi động lại. Đủ để
 * chặn spam/dò mã từ một nguồn; triển khai nhiều instance cần thay bằng kho
 * dùng chung (Redis/Postgres).
 */

type Bucket = { hits: number[] }

const buckets = new Map<string, Bucket>()
const MAX_KEYS = 10_000

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown"
  return request.headers.get("x-real-ip")?.trim() || "unknown"
}

export interface RateLimitRule {
  /** Tên nhóm, vd. "brochure-order". */
  scope: string
  limit: number
  windowMs: number
}

/** Ném `RATE_LIMITED` (429) khi vượt; ngược lại ghi nhận một lượt. */
export function enforceRateLimit(request: Request, rule: RateLimitRule, now = Date.now()): void {
  const key = `${rule.scope}:${clientIp(request)}`
  const bucket = buckets.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((t) => now - t < rule.windowMs)
  if (bucket.hits.length >= rule.limit) {
    throw new AppError("RATE_LIMITED", "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút")
  }
  bucket.hits.push(now)
  if (!buckets.has(key) && buckets.size >= MAX_KEYS) {
    const oldest = buckets.keys().next().value
    if (oldest !== undefined) buckets.delete(oldest)
  }
  buckets.set(key, bucket)
}

/** Chỉ dùng trong test. */
export function resetRateLimits(): void {
  buckets.clear()
}
