import { beforeEach, describe, expect, it } from "vitest"
import { openSecret, sealSecret } from "@/core/security/secret-box"
import { CircuitOpenError, resetCircuitBreakers, withCircuitBreaker } from "@/core/http/circuit-breaker"

describe("secret-box", () => {
  beforeEach(() => {
    process.env["INTEGRATION_TOKEN_SECRET"] = "khoa-thu-nghiem-du-dai-1234567890"
  })
  it("mã hoá/giải mã đúng, bản mã khác nhau mỗi lần, sai mục đích hoặc bị sửa thì hỏng", () => {
    const a = sealSecret("bí mật", "zns")
    expect(a).not.toBe(sealSecret("bí mật", "zns"))
    expect(openSecret(a, "zns")).toBe("bí mật")
    expect(() => openSecret(a, "esms")).toThrow()
    const parts = a.split(".")
    parts[3] = Buffer.from("x").toString("base64url")
    expect(() => openSecret(parts.join("."), "zns")).toThrow()
  })
})

describe("withCircuitBreaker", () => {
  beforeEach(() => resetCircuitBreakers())
  it("mở sau N lỗi liên tiếp, đóng lại sau thời gian nghỉ khi gọi thành công", async () => {
    let t = 0
    const clock = () => t
    const fail = () => Promise.reject(new Error("sập"))
    for (let i = 0; i < 3; i++) {
      await expect(withCircuitBreaker("x", fail, { failureThreshold: 3, cooldownMs: 100 }, clock)).rejects.toThrow("sập")
    }
    await expect(withCircuitBreaker("x", () => Promise.resolve(1), { failureThreshold: 3 }, clock)).rejects.toBeInstanceOf(CircuitOpenError)
    t = 200
    await expect(withCircuitBreaker("x", () => Promise.resolve(1), {}, clock)).resolves.toBe(1)
  })
  it("huỷ lời gọi quá thời gian chờ", async () => {
    const slow = (signal: AbortSignal) =>
      new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("timeout"))))
    await expect(withCircuitBreaker("y", slow, { timeoutMs: 20 })).rejects.toThrow("timeout")
  })
})
