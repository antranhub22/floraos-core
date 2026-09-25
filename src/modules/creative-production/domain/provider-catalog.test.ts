import { describe, expect, it } from "vitest"

import {
  defaultProviderOrder,
  orgProviderOrders,
  PROVIDER_CATALOG,
  PROVIDER_KINDS,
  resolveProviderOrder,
  validateOrgOrder,
} from "./provider-catalog"

describe("danh mục nhà cung cấp Creative Studio (PO 25/09/2026)", () => {
  it("mỗi loại TẠO kết quả đều có nhà cung cấp; cục bộ không nằm trong danh sách chọn", () => {
    for (const kind of PROVIDER_KINDS) {
      const spec = PROVIDER_CATALOG[kind]
      expect(spec.providers.length).toBeGreaterThan(0)
      if (spec.localFallback) expect(spec.providers.map((p) => p.key)).not.toContain(spec.localFallback.key)
    }
  })

  it("nhiều lựa chọn cho nội dung / ảnh / video (quyết định PO)", () => {
    expect(defaultProviderOrder("content")).toEqual(
      expect.arrayContaining(["claude_opus", "gemini_pro", "openai_structured"])
    )
    expect(defaultProviderOrder("image_optimize")).toEqual(expect.arrayContaining(["photoroom", "fal_flux", "imagen", "openai"]))
    expect(defaultProviderOrder("image_variant")).toEqual(expect.arrayContaining(["fal", "stability", "imagen"]))
    expect(defaultProviderOrder("video")).toEqual(["veo", "kling", "runway", "luma"])
    expect(defaultProviderOrder("music")).toEqual(["elevenlabs_music"])
  })

  it("thứ tự một lượt: bên chọn cho lượt → thứ tự tiệm → phần còn lại; không trùng, bỏ khoá lạ", () => {
    expect(resolveProviderOrder("video", ["luma", "kling"], "runway")).toEqual(["runway", "luma", "kling", "veo"])
    expect(resolveProviderOrder("video", ["khong_co"], "cung_khong")).toEqual(defaultProviderOrder("video"))
    expect(resolveProviderOrder("image_optimize", null, "studio")).not.toContain("studio")
  })

  it("thứ tự tiệm gửi lên phải là khoá đã biết, không trùng, không rỗng", () => {
    expect(validateOrgOrder("video", ["kling", "veo"])).toEqual({ ok: true, order: ["kling", "veo"] })
    expect(validateOrgOrder("video", ["local_cinematic"]).ok).toBe(false)
    expect(validateOrgOrder("video", ["veo", "veo"]).ok).toBe(false)
    expect(validateOrgOrder("video", []).ok).toBe(false)
    expect(validateOrgOrder("video", "veo").ok).toBe(false)
  })

  it("đọc thứ tự tiệm từ settings, bỏ dữ liệu hỏng", () => {
    expect(orgProviderOrders({ creative_providers: { video: ["kling"], content: "x" } })).toEqual({ video: ["kling"] })
    expect(orgProviderOrders(null)).toEqual({})
  })
})
