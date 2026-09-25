/**
 *Proxy-rules test — luật thuần, không cần CSDL.
 *
 * Bắt buộc theo AGENTS.md: "Luật nghiệp vụ đi kèm test khóa nó. Test xanh trên
 * repo này thì mới coi là chuyển xong."
 */

import { describe, it, expect } from "vitest"
import { requireProxyUrl, isAllowedProxyPath, NO_BODY_METHODS, SSO_HEADER, AUTHORIZATION_HEADER } from "./proxy-rules"
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

describe("isAllowedProxyPath", () => {
  it("nhận đường dẫn trong danh sách trắng, có hoặc không có / đầu", () => {
    expect(isAllowedProxyPath("SOCIALFLOW", "api/m07/generate")).toBe(true)
    expect(isAllowedProxyPath("SOCIALFLOW", "/api/m07/generate")).toBe(true)
    expect(isAllowedProxyPath("SOCIALFLOW", "api/m07")).toBe(true)
  })

  it("từ chối tiền tố lạ, tiền tố dính chữ, và đường dẫn có ..", () => {
    expect(isAllowedProxyPath("SOCIALFLOW", "api/admin")).toBe(false)
    expect(isAllowedProxyPath("SOCIALFLOW", "api/m07x/generate")).toBe(false)
    expect(isAllowedProxyPath("SOCIALFLOW", "api/m07/../admin")).toBe(false)
    expect(isAllowedProxyPath("LOCALBUDD", "api/m07/generate")).toBe(false)
  })
})
