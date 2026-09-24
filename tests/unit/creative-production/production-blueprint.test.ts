import { describe, expect, test } from "vitest"

import { areaScopeStatus, resolvePublishing } from "@/modules/creative-production/domain/publishing-rules"
import {
  balanceSceneDurations,
  buildRuleScenePlan,
  normalizeAiScenePlan,
  parseStoredScenePlan,
  sceneSpeechNeed,
  SCENE_BEATS_BY_MODE,
  type ScenePlanInput,
} from "@/modules/creative-production/domain/scene-plan-rules"
import { applyScenePlanEdit } from "@/modules/creative-production/domain/scene-plan-edit"

// Kịch bản sản xuất tổng v2 (24/09/2026, quyết định PO): Chặng 05 lên đủ nền
// tảng/khung hình, thời lượng từng cảnh, âm thanh, video, bài đăng — B/C/D/E
// chỉ thực thi.

const INPUT: ScenePlanInput = {
  mode: "CREATIVE",
  productName: "Giỏ hoa sinh nhật",
  colors: ["vàng"],
  components: [],
  occasions: ["sinh nhật"],
  topic: { id: "top-01", title: "Sinh nhật tone vàng", angleCategory: "EMOTIONAL", cta: "Nhắn tiệm để đặt" },
}

const aiScene = (beat: string, i: number) => ({
  beat,
  title: `Cảnh ${i}`,
  setting: "Bàn tiệc sinh nhật tone vàng",
  background_prompt: "a warm birthday table with soft yellow light, shallow depth of field",
  local_backdrop: "wedding",
  voice_script: "Một lời chúc ngọt ngào gửi người thương.",
  text_overlay: "Chúc mừng sinh nhật",
  motion_effect: "zoom_in",
  duration_seconds: i === 3 ? 5 : 3,
  transition: "dissolve",
})

describe("resolvePublishing — tỉ lệ theo nền tảng", () => {
  test("mặc định 9:16 (TikTok + Reels)", () => {
    const p = resolvePublishing(undefined)
    expect(p.aspectRatio).toBe("9:16")
    expect(p.platforms).toEqual(["tiktok", "instagram_reels", "facebook_reels"])
  })
  test("chỉ YouTube → 16:9", () => {
    expect(resolvePublishing(["youtube"]).aspectRatio).toBe("16:9")
  })
  test("chỉ feed → 4:5", () => {
    expect(resolvePublishing(["facebook_feed", "instagram_feed"]).aspectRatio).toBe("4:5")
  })
  test("trộn nhiều khung → sinh ĐỦ các khung, mỗi khung một video (PO 24/09 tối)", () => {
    const p = resolvePublishing(["tiktok", "youtube"])
    expect(p.aspectRatio).toBe("9:16")
    expect(p.ratios).toEqual(["9:16", "16:9"])
    expect(p.videoVariants.map((v) => v.ratio)).toEqual(["9:16", "16:9"])
  })
  test('"Tất cả" và danh sách rỗng = mọi nền tảng, mọi loại kết quả', () => {
    const a = resolvePublishing("all", "all")
    expect(a.allPlatforms && a.allOutputs).toBe(true)
    expect(a.ratios).toEqual(["9:16", "4:5", "16:9"])
    expect(resolvePublishing([], []).allPlatforms).toBe(true)
  })
  test("mặc định (không truyền) = TikTok + Reels 9:16, đủ 4 loại", () => {
    const d = resolvePublishing(undefined, undefined)
    expect(d.platforms).toEqual(["tiktok", "instagram_reels", "facebook_reels"])
    expect(d.produce).toEqual(["content", "audio", "image", "video"])
  })
  test("chọn video mà không chọn ảnh/âm thanh → tự thêm phụ thuộc; không content → không bài đăng", () => {
    const p = resolvePublishing(["tiktok"], ["video"])
    expect(p.derivedOutputs).toEqual(["image", "audio"])
    expect(p.produce).toEqual(["audio", "image", "video"])
    expect(p.postChannels).toEqual([])
  })
  test("chỉ chọn content → không video, không khung video", () => {
    const p = resolvePublishing(["facebook_feed"], ["content"])
    expect(p.videoVariants).toEqual([])
    expect(p.postChannels).toEqual(["facebook"])
  })
  test("bỏ mã lạ", () => {
    expect(resolvePublishing(["myspace", "tiktok"]).platforms).toEqual(["tiktok"])
  })
})

describe("balanceSceneDurations", () => {
  const beats = SCENE_BEATS_BY_MODE.CREATIVE
  test("tổng khớp mục tiêu, cao trào dài nhất khi không có đề xuất AI", () => {
    const d = balanceSceneDurations(beats.map((b) => ({ beat: b, voiceScript: "Ngắn." })), 15)
    expect(Math.abs(d.reduce((a, b) => a + b, 0) - 15)).toBeLessThan(0.3)
    expect(d[2]).toBe(Math.max(...d))
  })
  test("cảnh nào cũng đủ số giây đọc trọn lời", () => {
    const long = "Bó hoa hồng vàng rực rỡ gửi trọn yêu thương và lời chúc sinh nhật ngọt ngào nhất."
    const d = balanceSceneDurations(beats.map((b) => ({ beat: b, voiceScript: long })), 15)
    for (const x of d) expect(x).toBeGreaterThanOrEqual(sceneSpeechNeed(long))
  })
})

describe("kịch bản v2", () => {
  test("AI: đủ phần sản xuất, bài đăng theo kênh của nền tảng", () => {
    const r = normalizeAiScenePlan(
      {
        emotional_tone: "Ấm áp",
        story: { logline: "Món quà sinh nhật tone vàng" },
        scenes: SCENE_BEATS_BY_MODE.CREATIVE.map(aiScene),
        audio: { voice_id: "flora-nu-tre-trung", music_mood: "upbeat" },
        posts: [
          { channel: "tiktok", text: "Giỏ hoa sinh nhật tone vàng cho người thương 🎂", hashtags: ["hoasinhnhat"] },
          { channel: "zalo", text: "Không thuộc nền tảng đã chọn nên bị bỏ qua" },
        ],
      },
      { ...INPUT, platforms: ["tiktok"] }
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const p = r.plan
    expect(p.version).toBe(2)
    expect(p.revision).toBe(1)
    expect(p.publishing.aspectRatio).toBe("9:16")
    expect(p.video.format).toBe("TIKTOK_30S")
    expect(p.audio.voiceId).toBe("flora-nu-tre-trung")
    expect(p.content.posts.map((x) => x.channel)).toEqual(["tiktok"])
    expect(p.content.posts[0]!.hashtags).toEqual(["#hoasinhnhat"])
    expect(p.scenes.every((s) => s.durationSeconds >= 1.5 && s.transition)).toBe(true)
    expect(p.video.totalDurationSeconds).toBeCloseTo(p.scenes.reduce((a, s) => a + s.durationSeconds, 0), 1)
  })

  test("giọng lạ → giọng gợi ý theo mode, không nhận bừa", () => {
    const r = normalizeAiScenePlan(
      { scenes: SCENE_BEATS_BY_MODE.CREATIVE.map(aiScene), audio: { voice_id: "giong-bia" } },
      INPUT
    )
    expect(r.ok && r.plan.audio.voiceId).not.toBe("giong-bia")
  })

  test("kịch bản cơ bản cũng đủ phần sản xuất", () => {
    const p = buildRuleScenePlan({ ...INPUT, platforms: ["youtube"] })
    expect(p.version).toBe(2)
    expect(p.publishing.aspectRatio).toBe("16:9")
    expect(p.scenes).toHaveLength(5)
    expect(p.content.posts).toEqual([])
  })

  test("bản v1 đã lưu được nâng lên v2 khi đọc", () => {
    const v2 = buildRuleScenePlan(INPUT)
    const v1 = {
      version: 1,
      source: v2.source,
      mode: v2.mode,
      topicId: v2.topicId,
      topicTitle: v2.topicTitle,
      emotionalTone: v2.emotionalTone,
      reasoning: v2.reasoning,
      scenes: v2.scenes.map(({ durationSeconds: _d, transition: _t, shot: _s, musicCue: _m, ...rest }) => rest),
    }
    const up = parseStoredScenePlan(v1)
    expect(up?.version).toBe(2)
    expect(up?.publishing.aspectRatio).toBe("9:16")
    expect(up?.scenes.every((s) => s.durationSeconds > 0)).toBe(true)
  })
})

describe("applyScenePlanEdit", () => {
  const base = buildRuleScenePlan(INPUT)

  test("mỗi lần sửa tăng revision; phụ đề luôn = lời thoại (PO 24/09)", () => {
    const r = applyScenePlanEdit(base, { scenes: [{ sceneIndex: 1, voiceScript: "Lời mới", textOverlay: "Phụ đề khác" }] })
    expect(r.ok && r.plan.revision).toBe(base.revision + 1)
    expect(r.ok && r.plan.scenes[0]!.textOverlay).toBe("Lời mới")
  })
  test("kịch bản nào cũng có phụ đề = lời thoại", () => {
    expect(base.scenes.every((s) => s.textOverlay === s.voiceScript)).toBe(true)
  })
  test("thời lượng người dùng nhập được giữ, tổng tính lại", () => {
    const r = applyScenePlanEdit(base, { scenes: [{ sceneIndex: 3, durationSeconds: 6 }] })
    expect(r.ok && r.plan.scenes[2]!.durationSeconds).toBe(6)
    expect(r.ok && r.plan.video.totalDurationSeconds).toBeCloseTo(
      r.ok ? r.plan.scenes.reduce((a, s) => a + s.durationSeconds, 0) : 0,
      1
    )
  })
  test("đổi nền tảng sang YouTube → 16:9, bỏ bài của kênh không còn chọn", () => {
    const withPost = { ...base, content: { ...base.content, posts: [{ channel: "tiktok" as const, text: "Bài TikTok đủ dài nhé", hashtags: [] }] } }
    const r = applyScenePlanEdit(withPost, { platforms: ["youtube"] })
    expect(r.ok && r.plan.publishing.aspectRatio).toBe("16:9")
    expect(r.ok && r.plan.video.format).toBe("SLIDESHOW")
    expect(r.ok && r.plan.content.posts).toEqual([])
  })
  test("cảnh không tồn tại → từ chối", () => {
    expect(applyScenePlanEdit(base, { scenes: [{ sceneIndex: 9, textOverlay: "x" }] }).ok).toBe(false)
  })
  test("thay cảnh bằng AI giữ đúng nhịp của cảnh", () => {
    const replaced = { ...base.scenes[1]!, beat: "CTA" as const, setting: "Không gian mới", voiceScript: "Lời mới dài hơn một chút cho cảnh này." }
    const r = applyScenePlanEdit(base, { replaceScene: replaced })
    expect(r.ok && r.plan.scenes[1]!.beat).toBe(base.scenes[1]!.beat)
    expect(r.ok && r.plan.scenes[1]!.setting).toBe("Không gian mới")
  })
})

describe("areaScopeStatus — khu vực theo phạm vi", () => {
  test("chọn video + content: C/D là 'cần cho video', không phải ngoài phạm vi", () => {
    const pub = resolvePublishing(undefined, ["content", "video"])
    expect(areaScopeStatus(pub, "area-b")).toBe("in")
    expect(areaScopeStatus(pub, "area-c")).toBe("derived")
    expect(areaScopeStatus(pub, "area-d")).toBe("derived")
    expect(areaScopeStatus(pub, "area-e")).toBe("in")
    expect(areaScopeStatus(pub, "area-f")).toBe("in")
  })
  test("chỉ ảnh: B/C/E ngoài phạm vi", () => {
    const pub = resolvePublishing(undefined, ["image"])
    expect(areaScopeStatus(pub, "area-b")).toBe("out")
    expect(areaScopeStatus(pub, "area-c")).toBe("out")
    expect(areaScopeStatus(pub, "area-d")).toBe("in")
    expect(areaScopeStatus(pub, "area-e")).toBe("out")
  })
})
