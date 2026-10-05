import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { enforceRateLimit, resetRateLimits } from "@/core/http/rate-limit"
import { closeRedis } from "@/core/cache/redis-client"

function req(ip: string): Request {
  return new Request("http://x/", { headers: { "x-forwarded-for": `${ip}, 10.0.0.1` } })
}

const rule = { scope: `test-${Date.now()}`, limit: 3, windowMs: 60_000 }

describe("enforceRateLimit", () => {
  beforeEach(() => resetRateLimits())
  afterAll(async () => {
    await closeRedis()
  })

  it("cho qua đúng `limit` lượt rồi trả 429 RATE_LIMITED", async () => {
    const now = 1_000_000
    for (let i = 0; i < 3; i++) await enforceRateLimit(req("1.1.1.1"), rule, now)
    await expect(enforceRateLimit(req("1.1.1.1"), rule, now)).rejects.toMatchObject({ code: "RATE_LIMITED" })
  })

  it("đếm riêng theo IP và mở lại ở cửa sổ kế tiếp", async () => {
    const now = 2_000_000_000
    for (let i = 0; i < 3; i++) await enforceRateLimit(req("2.2.2.2"), rule, now)
    await expect(enforceRateLimit(req("3.3.3.3"), rule, now)).resolves.toBeUndefined()
    await expect(enforceRateLimit(req("2.2.2.2"), rule, now + rule.windowMs)).resolves.toBeUndefined()
  })
})
