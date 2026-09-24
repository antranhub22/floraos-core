import { describe, expect, test } from "vitest"

import { buildRuleScenePlan } from "@/modules/creative-production/domain/scene-plan-rules"
import { assembleVideo, pickFormatForDuration, type AssemblyAudio, type AssemblyVariant } from "@/modules/creative-production/domain/video-assembly-rules"

// Đợt 4 (24/09/2026): video lắp từ ĐÚNG ảnh D + bản phối C của kịch bản; thiếu thì chặn.

const plan = buildRuleScenePlan({
  mode: "AUTHENTIC",
  productName: "Bó hoa",
  colors: [],
  components: [],
  occasions: [],
  topic: { id: "t1", title: "Sinh nhật" },
})
const REF = "11111111-1111-1111-1111-111111111111"

const v = (sceneIndex: number, over: Partial<AssemblyVariant> = {}): AssemblyVariant => ({
  assetId: `a-${sceneIndex}`,
  sceneIndex,
  scenePlanId: REF,
  scenePlanRevision: 1,
  ratio: "9:16",
  variantKey: "styled",
  approvalState: "PENDING",
  createdAt: new Date(2026, 8, 24, 10, sceneIndex),
  ...over,
})
const audio = (over: Partial<AssemblyAudio> = {}): AssemblyAudio => ({
  jobId: "audio-1",
  status: "COMPLETED",
  storageKey: "org/o/unfiled/x_audio.m4a",
  hasVoice: true,
  scenePlanId: REF,
  scenePlanRevision: 1,
  sceneDurations: new Map([[1, 5.2], [2, 6.1], [3, 4]]),
  ...over,
})
const all = [v(1), v(2), v(3)]

describe("assembleVideo", () => {
  test("đủ ảnh + âm thanh → sẵn sàng, thời lượng theo âm thanh thật, không đọc lại TTS", () => {
    const r = assembleVideo({ plan, planRef: REF, variants: all, audio: audio() })
    expect(r.ready).toBe(true)
    expect(r.scenes.map((s) => s.durationSeconds)).toEqual([5.2, 6.1, 4])
    expect(r.scenes.map((s) => s.imageAssetId)).toEqual(["a-1", "a-2", "a-3"])
    expect(r.audioStorageKey).toBe("org/o/unfiled/x_audio.m4a")
    expect(r.aspectRatio).toBe("9:16")
  })
  test("thiếu âm thanh C → chặn", () => {
    const r = assembleVideo({ plan, planRef: REF, variants: all, audio: null })
    expect(r.ready).toBe(false)
    expect(r.problems.map((p) => p.kind)).toContain("missing_audio")
  })
  test("thiếu ảnh cảnh 2 → chặn, không lấy ảnh Master hay ảnh kịch bản khác", () => {
    const r = assembleVideo({ plan, planRef: REF, variants: [v(1), v(2, { scenePlanId: "khac" }), v(3)], audio: audio() })
    expect(r.ready).toBe(false)
    expect(r.problems).toContainEqual(expect.objectContaining({ kind: "missing_image", sceneIndex: 2 }))
  })
  test("âm thanh của kịch bản khác / chỉ có nhạc → chặn", () => {
    expect(assembleVideo({ plan, planRef: REF, variants: all, audio: audio({ scenePlanId: "khac" }) }).ready).toBe(false)
    expect(assembleVideo({ plan, planRef: REF, variants: all, audio: audio({ hasVoice: false }) }).ready).toBe(false)
  })
  test("ảnh sai khung → vẫn dựng được nhưng cảnh báo; ưu tiên ảnh đúng khung", () => {
    const r = assembleVideo({
      plan,
      planRef: REF,
      variants: [v(1, { ratio: "1:1", createdAt: new Date(2026, 8, 25) }), v(1, { assetId: "dung-khung" }), v(2), v(3, { ratio: "1:1" })],
      audio: audio(),
    })
    expect(r.ready).toBe(true)
    expect(r.scenes[0]!.imageAssetId).toBe("dung-khung")
    expect(r.warnings.some((w) => w.includes("Ảnh cảnh 3"))).toBe(true)
  })
  test("âm thanh dài hơn khuôn → đổi khuôn dài hơn", () => {
    expect(pickFormatForDuration("REEL_15S", 26)).toBe("TIKTOK_30S")
    expect(pickFormatForDuration("REEL_15S", 90)).toBeNull()
  })
  test("nhiều khung: mỗi khung một video, không mượn ảnh khung khác", () => {
    const multi = buildRuleScenePlan({
      mode: "AUTHENTIC",
      productName: "Bó hoa",
      colors: [],
      components: [],
      occasions: [],
      topic: { id: "t1", title: "Sinh nhật" },
      platforms: ["tiktok", "youtube"],
    })
    expect(multi.publishing.ratios).toEqual(["9:16", "16:9"])
    const r916 = assembleVideo({ plan: multi, planRef: REF, variants: all, audio: audio(), ratio: "9:16" })
    expect(r916.ready).toBe(true)
    const r169 = assembleVideo({ plan: multi, planRef: REF, variants: all, audio: audio(), ratio: "16:9" })
    expect(r169.ready).toBe(false)
    expect(r169.problems.filter((p) => p.kind === "missing_image")).toHaveLength(3)
    const wide = [v(1, { ratio: "16:9" }), v(2, { ratio: "16:9" }), v(3, { ratio: "16:9" })]
    const ok = assembleVideo({ plan: multi, planRef: REF, variants: [...all, ...wide], audio: audio(), ratio: "16:9" })
    expect(ok.ready).toBe(true)
    expect(ok.aspectRatio).toBe("16:9")
    expect(assembleVideo({ plan: multi, planRef: REF, variants: all, audio: audio(), ratio: "1:1" }).problems.map((p) => p.kind)).toContain("ratio_out_of_scope")
  })
})
