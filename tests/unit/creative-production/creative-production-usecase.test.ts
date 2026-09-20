/**
 * Unit Tests — Creative Production Use-cases.
 *
 * Kiểm tra:
 * - planNarrativeArc: AUTHENTIC (3 cảnh) vs CREATIVE (5 cảnh)
 * - distributeSceneDurations
 * - planProduction orchestrator
 */

import { describe, it, expect } from "vitest"
import {
  planNarrativeArc,
  distributeSceneDurations,
} from "@/modules/creative-production/use-cases/plan-narrative-arc"
import { planProduction } from "@/modules/creative-production/use-cases/dispatch-production-jobs"
import type {
  TopicProductionBrief,
  SelectedTopicInfo,
  ProductContext,
} from "@/modules/creative-production/domain/production-types"

// ============================================================
// FIXTURES
// ============================================================

const PRODUCT_CTX: ProductContext = {
  sourceImageUrl: "data:image/jpeg;base64,test",
  commercialPassport: {
    productName: "Bó hoa hồng đỏ",
    category: "Bó hoa",
    style: "Lãng mạn",
    components: ["Hoa hồng đỏ", "Baby", "Lá bạch đàn"],
    colors: ["Đỏ", "Trắng", "Xanh lá"],
    priceRange: "400.000đ",
    targetAudience: "Nữ 20-35",
    suggestedOccasions: ["Valentine", "Sinh nhật"],
  },
}

const TOPIC: SelectedTopicInfo = {
  topicId: "t-1",
  topicTitle: "Valentine lãng mạn",
  topicAngle: "Tình yêu vĩnh cửu",
  topicCategory: "romantic",
  topicHook: "Bạn có biết 1 bông hồng đỏ nói gì?",
  topicCta: "Inbox ngay để đặt hoa Valentine! 🌹",
  topicEmotionalTone: "Lãng mạn ấm áp",
  trendScore: 90,
}

const BRIEF_CREATIVE: TopicProductionBrief = {
  organizationId: "org-1",
  mode: "CREATIVE",
  productContext: PRODUCT_CTX,
  selectedTopics: [TOPIC],
  targetVideoDurationSeconds: 30,
}

const BRIEF_AUTHENTIC: TopicProductionBrief = {
  ...BRIEF_CREATIVE,
  mode: "AUTHENTIC",
}

// ============================================================
// planNarrativeArc TESTS
// ============================================================

describe("planNarrativeArc", () => {
  it("AUTHENTIC: sinh 3 cảnh", () => {
    const arc = planNarrativeArc({
      mode: "AUTHENTIC",
      topic: TOPIC,
      productContext: PRODUCT_CTX,
      targetDurationSeconds: 25,
    })
    expect(arc.mode).toBe("AUTHENTIC")
    expect(arc.scenes.length).toBe(3)
    expect(arc.totalDurationSeconds).toBe(25)
  })

  it("AUTHENTIC: cảnh có authenticEffect, không có creativeConfig", () => {
    const arc = planNarrativeArc({
      mode: "AUTHENTIC",
      topic: TOPIC,
      productContext: PRODUCT_CTX,
      targetDurationSeconds: 30,
    })
    expect(arc.scenes.every((s) => s.authenticEffect !== undefined)).toBe(true)
    expect(arc.scenes.every((s) => s.creativeConfig === undefined)).toBe(true)
  })

  it("AUTHENTIC: beats = SETUP, CLIMAX, CTA", () => {
    const arc = planNarrativeArc({
      mode: "AUTHENTIC",
      topic: TOPIC,
      productContext: PRODUCT_CTX,
      targetDurationSeconds: 20,
    })
    const beats = arc.scenes.map((s) => s.beat)
    expect(beats).toEqual(["SETUP", "CLIMAX", "CTA"])
  })

  it("CREATIVE: sinh 5 cảnh", () => {
    const arc = planNarrativeArc({
      mode: "CREATIVE",
      topic: TOPIC,
      productContext: PRODUCT_CTX,
      targetDurationSeconds: 30,
    })
    expect(arc.mode).toBe("CREATIVE")
    expect(arc.scenes.length).toBe(5)
  })

  it("CREATIVE: cảnh có creativeConfig, không có authenticEffect", () => {
    const arc = planNarrativeArc({
      mode: "CREATIVE",
      topic: TOPIC,
      productContext: PRODUCT_CTX,
      targetDurationSeconds: 30,
    })
    expect(arc.scenes.every((s) => s.creativeConfig !== undefined)).toBe(true)
    expect(arc.scenes.every((s) => s.authenticEffect === undefined)).toBe(true)
  })

  it("CREATIVE: beats đầy đủ 5 nhịp", () => {
    const arc = planNarrativeArc({
      mode: "CREATIVE",
      topic: TOPIC,
      productContext: PRODUCT_CTX,
      targetDurationSeconds: 30,
    })
    const beats = arc.scenes.map((s) => s.beat)
    expect(beats).toEqual(["SETUP", "RISING", "CLIMAX", "RESOLUTION", "CTA"])
  })

  it("mọi cảnh đều có voiceScript không rỗng", () => {
    for (const mode of ["AUTHENTIC", "CREATIVE"] as const) {
      const arc = planNarrativeArc({
        mode,
        topic: TOPIC,
        productContext: PRODUCT_CTX,
        targetDurationSeconds: 30,
      })
      expect(arc.scenes.every((s) => s.voiceScript.length > 0)).toBe(true)
    }
  })

  it("narrativeReasoning giải thích mode", () => {
    const a = planNarrativeArc({ mode: "AUTHENTIC", topic: TOPIC, productContext: PRODUCT_CTX, targetDurationSeconds: 30 })
    const c = planNarrativeArc({ mode: "CREATIVE", topic: TOPIC, productContext: PRODUCT_CTX, targetDurationSeconds: 30 })
    expect(a.narrativeReasoning).toContain("AUTHENTIC")
    expect(c.narrativeReasoning).toContain("CREATIVE")
  })
})

// ============================================================
// distributeSceneDurations TESTS
// ============================================================

describe("distributeSceneDurations", () => {
  it("phân bổ đúng tổng thời lượng", () => {
    const durations = distributeSceneDurations(30, 5)
    expect(durations.reduce((a, b) => a + b, 0)).toBeCloseTo(30, 0)
  })

  it("CTA cuối ngắn hơn các cảnh khác", () => {
    const durations = distributeSceneDurations(30, 5)
    const ctaDuration = durations[durations.length - 1]!
    const otherAvg = durations.slice(0, -1).reduce((a, b) => a + b, 0) / (durations.length - 1)
    expect(ctaDuration).toBeLessThan(otherAvg)
  })

  it("1 cảnh = toàn bộ thời lượng", () => {
    expect(distributeSceneDurations(20, 1)).toEqual([20])
  })

  it("0 cảnh = mảng rỗng", () => {
    expect(distributeSceneDurations(20, 0)).toEqual([])
  })
})

// ============================================================
// planProduction TESTS
// ============================================================

describe("planProduction orchestrator", () => {
  it("CREATIVE plan: có variant jobs + video + audio + content", () => {
    const result = planProduction({ brief: BRIEF_CREATIVE })
    expect(result.jobsSummary.imageJobs).toBeGreaterThan(0)
    expect(result.jobsSummary.videoJobs).toBe(1)
    expect(result.jobsSummary.audioJobs).toBe(1)
    expect(result.jobsSummary.contentJobs).toBeGreaterThan(0)
    expect(result.totalEstimatedCredits).toBeGreaterThan(0)
  })

  it("CREATIVE plan: image jobs là IMAGE_VARIANT", () => {
    const result = planProduction({ brief: BRIEF_CREATIVE })
    const imageItems = result.mediaPlan.items.filter((i) => i.assetType === "IMAGE_VARIANT")
    expect(imageItems.length).toBe(5) // 5 scenes CREATIVE
  })

  it("AUTHENTIC plan: image jobs là IMAGE_CROP (0 credit)", () => {
    const result = planProduction({ brief: BRIEF_AUTHENTIC })
    const imageItems = result.mediaPlan.items.filter((i) => i.assetType === "IMAGE_CROP")
    expect(imageItems.length).toBe(3) // 1:1, 4:5, 9:16
  })

  it("AUTHENTIC plan: không có IMAGE_VARIANT", () => {
    const result = planProduction({ brief: BRIEF_AUTHENTIC })
    const variants = result.mediaPlan.items.filter((i) => i.assetType === "IMAGE_VARIANT")
    expect(variants.length).toBe(0)
  })

  it("mediaPlan.mode khớp brief.mode", () => {
    const c = planProduction({ brief: BRIEF_CREATIVE })
    const a = planProduction({ brief: BRIEF_AUTHENTIC })
    expect(c.mediaPlan.mode).toBe("CREATIVE")
    expect(a.mediaPlan.mode).toBe("AUTHENTIC")
  })

  it("mediaPlan có estimatedTimeMinutes > 0", () => {
    const result = planProduction({ brief: BRIEF_CREATIVE })
    expect(result.mediaPlan.estimatedTimeMinutes).toBeGreaterThan(0)
  })

  it("CREATIVE credits > AUTHENTIC credits (cùng topic)", () => {
    const c = planProduction({ brief: BRIEF_CREATIVE })
    const a = planProduction({ brief: BRIEF_AUTHENTIC })
    expect(c.totalEstimatedCredits).toBeGreaterThan(a.totalEstimatedCredits)
  })

  it("tất cả items đều có status = PLANNED", () => {
    const result = planProduction({ brief: BRIEF_CREATIVE })
    expect(result.mediaPlan.items.every((i) => i.status === "PLANNED")).toBe(true)
  })

  it("multi-topic: tổng jobs nhân với số topic", () => {
    const multiBrief: TopicProductionBrief = {
      ...BRIEF_CREATIVE,
      selectedTopics: [
        TOPIC,
        { ...TOPIC, topicId: "t-2", topicTitle: "Ngày phụ nữ" },
      ],
    }
    const result = planProduction({ brief: multiBrief })
    expect(result.jobsSummary.videoJobs).toBe(2)
    expect(result.jobsSummary.audioJobs).toBe(2)
  })
})
