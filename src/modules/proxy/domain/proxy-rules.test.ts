/**
 *Proxy-rules test — luật thuần, không cần CSDL.
 *
 * Bắt buộc theo AGENTS.md: "Luật nghiệp vụ đi kèm test khóa nó. Test xanh trên
 * repo này thì mới coi là chuyển xong."
 */

import { describe, it, expect } from "vitest"
import { requireProxyUrl, NO_BODY_METHODS, SSO_HEADER, AUTHORIZATION_HEADER } from "./proxy-rules"
import { AppError } from "@/core/http/errors"

describe("proxy-rules", () => {
  it("requireProxyUrl throw khi thiếu URL", () => {
    expect(() => requireProxyUrl("SOCIALFLOW", undefined)).toThrow(AppError)
    expect(() => requireProxyUrl("LOCALBUDD", undefined)).toThrow(AppError)
  })

  it("requireProxyUrl trả về URL khi có", () => {
    expect(requireProxyUrl("SOCIALFLOW", "http://localhost:8000")).toBe("http://localhost:8000")
    expect(requireProxyUrl("LOCALBUDD", "http://localhost:3000")).toBe("http://localhost:3000")
  })

  it("header constants đúng", () => {
    expect(SSO_HEADER).toBe("x-floraos-sso")
    expect(AUTHORIZATION_HEADER).toBe("authorization")
  })

  it("NO_BODY_METHODS không có POST/PUT/PATCH", () => {
    expect(NO_BODY_METHODS).toEqual(["GET", "HEAD", "DELETE"])
    expect(NO_BODY_METHODS).not.toContain("POST")
    expect(NO_BODY_METHODS).not.toContain("PUT")
    expect(NO_BODY_METHODS).not.toContain("PATCH")
  })
})