import { createHash } from "node:crypto"
import { getRedis } from "@/core/cache/redis-client"
import { log } from "@/core/observability/log"
import { AppError } from "./errors"

/**
 * Giới hạn tần suất cho endpoint CÔNG KHAI (không đăng nhập).
 *
 * Có `REDIS_URL`: cửa sổ cố định dùng chung mọi instance (INCR + PEXPIRE
 * nguyên tử bằng Lua). Không có Redis (dev/test) hoặc Redis lỗi: rơi về bộ
 * đếm trong bộ nhớ tiến trình — "mở" an toàn, không chặn khách vì hạ tầng.
 * IP được băm trước khi làm khoá: Redis không giữ địa chỉ IP thô.
 */

export interface RateLimitRule {
  /** Tên nhóm, vd. "brochure-order". */
  scope: string
  limit: number
  windowMs: number
}

const INCR_WITH_TTL = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return c`

const memory = new Map<string, { count: number; resetAt: number }>()
const MAX_MEMORY_KEYS = 10_000

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown"
  return request.headers.get("x-real-ip")?.trim() || "unknown"
}

function bucketKey(rule: RateLimitRule, request: Request, now: number): string {
  const ipHash = createHash("sha256").update(clientIp(request)).digest("hex").slice(0, 24)
  return `rl:${rule.scope}:${ipHash}:${Math.floor(now / rule.windowMs)}`
}

function countInMemory(key: string, windowMs: number, now: number): number {
  const entry = memory.get(key)
  if (entry && entry.resetAt > now) {
    entry.count += 1
    return entry.count
  }
  if (memory.size >= MAX_MEMORY_KEYS) {
    for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k)
    if (memory.size >= MAX_MEMORY_KEYS) memory.delete(memory.keys().next().value as string)
  }
  memory.set(key, { count: 1, resetAt: now + windowMs })
  return 1
}

async function countHit(key: string, windowMs: number, now: number): Promise<number> {
  const redis = getRedis()
  // Đang mất kết nối → đếm tạm trong bộ nhớ ngay, không chờ timeout từng request
  if (redis && redis.status !== "reconnecting" && redis.status !== "end") {
    try {
      const count = await redis.eval(INCR_WITH_TTL, 1, key, String(windowMs))
      return Number(count)
    } catch (error) {
      log.warn("rate_limit.redis_fallback", {
        feature: "rate-limit",
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return countInMemory(key, windowMs, now)
}

/** Ném `RATE_LIMITED` (429) khi vượt; ngược lại ghi nhận một lượt. */
export async function enforceRateLimit(request: Request, rule: RateLimitRule, now = Date.now()): Promise<void> {
  const count = await countHit(bucketKey(rule, request, now), rule.windowMs, now)
  if (count > rule.limit) {
    throw new AppError("RATE_LIMITED", "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút")
  }
}

/** Chỉ dùng trong test. */
export function resetRateLimits(): void {
  memory.clear()
}
