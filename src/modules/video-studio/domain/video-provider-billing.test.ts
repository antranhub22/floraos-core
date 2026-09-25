import { describe, expect, it } from "vitest"

import { videoRenderCredit } from "@/modules/usage/domain/pricing"

import { videoRenderRefund } from "./video-provider-billing"

describe("giá + hoàn chênh video nhà cung cấp (bảng giá v1)", () => {
  it("giá = ghép (5) + giá/cảnh của bên đứng đầu × số cảnh; cục bộ chỉ giá ghép", () => {
    expect(videoRenderCredit("kling", 4)).toBe(5 + 5 * 4)
    expect(videoRenderCredit("veo", 3)).toBe(5 + 12 * 3)
    expect(videoRenderCredit(null, 4)).toBe(5)
  })

  it("lùi Ken Burns cục bộ → hoàn toàn bộ phần clip", () => {
    expect(videoRenderRefund({ provider: "veo", scenes: 3, credit: 41 }, { provider_fallback: true })).toBe(36)
  })

  it("bên thật rẻ hơn bên đã tính → hoàn chênh; đắt hơn → không thu thêm", () => {
    expect(videoRenderRefund({ provider: "veo", scenes: 3, credit: 41 }, { clip_provider: "kling" })).toBe(21)
    expect(videoRenderRefund({ provider: "kling", scenes: 3, credit: 20 }, { clip_provider: "veo" })).toBe(0)
    expect(videoRenderRefund({ provider: "kling", scenes: 3, credit: 20 }, { clip_provider: "kling" })).toBe(0)
  })

  it("job cũ không có kế hoạch giá → không hoàn gì", () => {
    expect(videoRenderRefund(null, { provider_fallback: true })).toBe(0)
  })
})
