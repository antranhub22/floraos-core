import { afterEach, describe, expect, it, vi } from "vitest"
import { publicAppUrl } from "@/lib/public-url"

describe("publicAppUrl — gốc URL cho ảnh xem trước link và link trong tin nhắn", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("ưu tiên PUBLIC_APP_URL, bỏ dấu / cuối", () => {
    vi.stubEnv("PUBLIC_APP_URL", "https://shop.example.vn/")
    vi.stubEnv("RENDER_EXTERNAL_URL", "https://x.onrender.com")
    expect(publicAppUrl()).toBe("https://shop.example.vn")
  })

  it("rơi về RENDER_EXTERNAL_URL khi chưa cấu hình", () => {
    vi.stubEnv("PUBLIC_APP_URL", "")
    vi.stubEnv("RENDER_EXTERNAL_URL", "https://x.onrender.com")
    expect(publicAppUrl()).toBe("https://x.onrender.com")
  })

  it("rỗng khi chạy local chưa cấu hình", () => {
    vi.stubEnv("PUBLIC_APP_URL", "")
    vi.stubEnv("RENDER_EXTERNAL_URL", "")
    expect(publicAppUrl()).toBe("")
  })
})
