import { describe, expect, it } from "vitest"

import {
  buildStoryboardFromPlan,
  buildStoryboardFromTopic,
  distributeDurations,
} from "@/components/creative-studio/video-storyboard-builder"
import { buildRuleScenePlan } from "@/modules/creative-production/domain/scene-plan-rules"
import { validateStoryboard } from "@/modules/video-studio/domain/video-storyboard"

const plan = buildRuleScenePlan({
  mode: "CREATIVE",
  productName: "Giỏ hoa khai trương",
  colors: ["đỏ"],
  components: [],
  occasions: ["Khai trương"],
  topic: { id: "t", title: "Bó hoa khai trương 1.200K tone màu đỏ", cta: "Nhắn tiệm" },
})
const master = { assetId: "master-1", url: "https://x/master.png" }

describe("video-storyboard-builder (Khu vực E theo kịch bản)", () => {
  it("số cảnh, phụ đề, lời thoại, chuyển động theo đúng kịch bản", () => {
    const { scenes } = buildStoryboardFromPlan(plan, 15, {}, master)
    expect(scenes).toHaveLength(plan.scenes.length)
    expect(scenes.map((s) => s.voiceScript)).toEqual(plan.scenes.map((s) => s.voiceScript))
    expect(scenes[0]!.motionEffect).toBe("ZOOM_IN")
    expect(validateStoryboard(scenes, "REEL_15S").isValid).toBe(true)
  })

  it("ảnh cảnh = ảnh biến thể cùng scene_index; thiếu thì Master, không bao giờ ảnh mẫu", () => {
    const { scenes, missingImages } = buildStoryboardFromPlan(
      plan,
      15,
      { 2: { assetId: "var-2", url: "https://x/v2.png" } },
      master
    )
    expect(scenes[1]!.imageAssetId).toBe("var-2")
    expect(scenes[0]!.imageAssetId).toBe("master-1")
    expect(missingImages).toBe(plan.scenes.length - 1)
    expect(scenes.every((s) => !String(s.imageUrl).includes("unsplash"))).toBe(true)
  })

  it("không kịch bản: 3 cảnh hook/tiêu đề/CTA với ảnh Master", () => {
    const scenes = buildStoryboardFromTopic(null, "Giỏ hoa", 15, master)
    expect(scenes).toHaveLength(3)
    expect(scenes.every((s) => s.imageAssetId === "master-1")).toBe(true)
  })

  it("chia thời lượng khớp tổng", () => {
    const d = distributeDurations(15, 5)
    expect(d.reduce((a, b) => a + b, 0)).toBeCloseTo(15, 5)
  })
})
