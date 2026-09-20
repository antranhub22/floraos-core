/**
 * Unit Tests — Creative Production Domain Layer.
 *
 * Kiểm tra:
 * - Content Brief Builder (AUTHENTIC vs CREATIVE branching)
 * - 4 Bridge files (mapping contracts)
 * - Mode-specific logic xuyên suốt
 */

import { describe, it, expect } from "vitest"
import {
  buildTopicContentBriefs,
  type TopicContentBriefs,
} from "@/modules/creative-production/domain/content-brief-builder"
import { bridgeToVariantJobs, countVariantJobs } from "@/modules/creative-production/domain/topic-to-media-bridge"
import { bridgeToVideoJob } from "@/modules/creative-production/domain/topic-to-video-bridge"
import { bridgeToAudioJob, estimateAudioCredits } from "@/modules/creative-production/domain/topic-to-audio-bridge"
import { bridgeToContentInputs, buildContentPrompt } from "@/modules/creative-production/domain/topic-to-content-bridge"
import type {
  TopicProductionBrief,
  SelectedTopicInfo,
  NarrativeSceneSpec,
  ProductContext,
} from "@/modules/creative-production/domain/production-types"

// ============================================================
// FIXTURES
// ============================================================

const MOCK_PRODUCT_CONTEXT: ProductContext = {
  sourceImageUrl: "data:image/jpeg;base64,/9j/4AAQ...",
  sourceImageStorageKey: "org/org-1/prod-1/master.jpg",
  commercialPassport: {
    productName: "Bó hoa hồng kem dâu",
    category: "Bó hoa",
    style: "Lãng mạn",
    components: ["Hoa hồng kem", "Hoa baby", "Lá bạch đàn"],
    colors: ["Hồng pastel", "Trắng"],
    priceRange: "350.000 - 500.000đ",
    targetAudience: "Nữ 25-35 tuổi",
    suggestedOccasions: ["Sinh nhật", "Kỷ niệm", "Valentine"],
  },
}

const MOCK_TOPIC: SelectedTopicInfo = {
  topicId: "topic-1",
  topicTitle: "Hoa sinh nhật cho người yêu",
  topicAngle: "Lãng mạn, tỏ tình",
  topicCategory: "romantic",
  topicHook: "Bó hoa này khiến 1000 cô gái rơi nước mắt...",
  topicCta: "Inbox ngay để đặt bó hoa yêu thương nhé! 🌹",
  topicEmotionalTone: "Lãng mạn ấm áp",
  trendScore: 85,
}

const MOCK_SCENES_CREATIVE: readonly NarrativeSceneSpec[] = [
  {
    sceneIndex: 1,
    beat: "SETUP",
    beatTitle: "Xưởng hoa khuya",
    sceneDescription: "Góc xưởng hoa nhỏ, ánh đèn ấm",
    voiceScript: "Đêm nay, xưởng hoa nhỏ lại rộn ràng...",
    textOverlay: "Xưởng hoa nhỏ",
    durationSeconds: 6,
    transitionEffect: "fade",
    motionEffect: "zoom_in",
    connectionToNext: "Ánh sáng dần sáng lên...",
    creativeConfig: {
      preset: "workshop",
      lighting: "warm_golden",
      surface: "wooden_table",
    },
  },
  {
    sceneIndex: 2,
    beat: "CLIMAX",
    beatTitle: "Bó hoa hoàn thiện",
    sceneDescription: "Bó hoa hồng kem dâu lung linh",
    voiceScript: "Mỗi cánh hoa đều mang theo lời yêu thương...",
    textOverlay: "Tình yêu trong từng cánh hoa",
    durationSeconds: 8,
    transitionEffect: "dissolve",
    motionEffect: "zoom_out",
    connectionToNext: "Và giờ, bó hoa ấy đang trên đường đến tay bạn...",
    creativeConfig: {
      preset: "studio_white",
      lighting: "soft_diffused",
      surface: "marble",
    },
  },
  {
    sceneIndex: 3,
    beat: "CTA",
    beatTitle: "Kêu gọi hành động",
    sceneDescription: "Bó hoa trên bàn phòng khách ấm cúng",
    voiceScript: "Inbox ngay, để tình yêu lan tỏa!",
    textOverlay: "Đặt hoa ngay hôm nay 🌹",
    durationSeconds: 4,
    transitionEffect: "fade",
    motionEffect: "static",
    connectionToNext: "",
    creativeConfig: {
      preset: "living_room",
      lighting: "natural_window",
      surface: "wooden_table",
    },
  },
]

const MOCK_SCENES_AUTHENTIC: readonly NarrativeSceneSpec[] = [
  {
    sceneIndex: 1,
    beat: "SETUP",
    beatTitle: "Ảnh thật bó hoa",
    sceneDescription: "Ảnh gốc từ tiệm",
    voiceScript: "Bó hoa hồng kem dâu này mình vừa cắm sáng nay...",
    textOverlay: "🌿 Ảnh thật từ tiệm",
    durationSeconds: 10,
    transitionEffect: "fade",
    motionEffect: "zoom_in",
    connectionToNext: "",
    authenticEffect: {
      cropRatio: "1:1",
      motionEffect: "zoom_in",
      showBrandBadge: true,
      showPrice: true,
      overlayText: "350.000đ",
      overlayPosition: "bottom",
    },
  },
  {
    sceneIndex: 2,
    beat: "CLIMAX",
    beatTitle: "Chi tiết hoa",
    sceneDescription: "Cận cảnh cánh hoa",
    voiceScript: "Từng cánh hoa hồng kem mềm mại, tươi suốt 7 ngày...",
    textOverlay: "Tươi 7 ngày",
    durationSeconds: 8,
    transitionEffect: "fade",
    motionEffect: "pan_right",
    connectionToNext: "",
    authenticEffect: {
      cropRatio: "4:5",
      motionEffect: "pan_right",
      showBrandBadge: false,
      showPrice: false,
    },
  },
  {
    sceneIndex: 3,
    beat: "CTA",
    beatTitle: "Liên hệ đặt hoa",
    sceneDescription: "Ảnh gốc toàn bộ",
    voiceScript: "Inbox mình để đặt bó hoa tươi nhé!",
    textOverlay: "Đặt hoa: 0912.xxx.xxx",
    durationSeconds: 5,
    transitionEffect: "fade",
    motionEffect: "static",
    connectionToNext: "",
    authenticEffect: {
      cropRatio: "9:16",
      motionEffect: "static",
      showBrandBadge: true,
      showPrice: true,
      overlayText: "Đặt ngay!",
      overlayPosition: "bottom",
    },
  },
]

const MOCK_BRIEF_CREATIVE: TopicProductionBrief = {
  organizationId: "org-1",
  productId: "prod-1",
  mode: "CREATIVE",
  productContext: MOCK_PRODUCT_CONTEXT,
  selectedTopics: [MOCK_TOPIC],
  voiceId: "flora-nu-truyen-cam",
  musicMood: "romantic",
  targetVideoDurationSeconds: 30,
}

const MOCK_BRIEF_AUTHENTIC: TopicProductionBrief = {
  ...MOCK_BRIEF_CREATIVE,
  mode: "AUTHENTIC",
  musicMood: "warm",
}

// ============================================================
// CONTENT BRIEF BUILDER TESTS
// ============================================================

describe("Content Brief Builder", () => {
  describe("CREATIVE mode", () => {
    let briefs: TopicContentBriefs

    it("build CREATIVE briefs thành công", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
      expect(briefs).toBeDefined()
      expect(briefs.mode).toBe("CREATIVE")
      expect(briefs.topicId).toBe("topic-1")
    })

    it("imageBrief có variantRequests, không có cropRequests", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
      expect(briefs.imageBrief.variantRequests.length).toBe(3) // 3 scenes với creativeConfig
      expect(briefs.imageBrief.cropRequests.length).toBe(0)
    })

    it("variant request chứa preset, lighting, surface từ scene config", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
      const first = briefs.imageBrief.variantRequests[0]!
      expect(first.preset).toBe("workshop")
      expect(first.lighting).toBe("warm_golden")
      expect(first.surface).toBe("wooden_table")
      expect(first.beat).toBe("SETUP")
    })

    it("videoBrief scenes dùng imageSource = variant", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
      expect(briefs.videoBrief.scenes.every((s) => s.imageSource === "variant")).toBe(true)
    })

    it("contentBrief có hashtag trending/viral", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
      expect(briefs.contentBrief.hashtagSuggestions).toContain("#trending")
      expect(briefs.contentBrief.hashtagSuggestions).toContain("#viral")
    })

    it("contentBrief platforms bao gồm tiktok, instagram", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
      const platforms = briefs.contentBrief.captionRequests.map((r) => r.platform)
      expect(platforms).toContain("tiktok")
      expect(platforms).toContain("instagram")
    })
  })

  describe("AUTHENTIC mode", () => {
    let briefs: TopicContentBriefs

    it("build AUTHENTIC briefs thành công", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_AUTHENTIC, MOCK_TOPIC, MOCK_SCENES_AUTHENTIC)
      expect(briefs).toBeDefined()
      expect(briefs.mode).toBe("AUTHENTIC")
    })

    it("imageBrief có cropRequests, không có variantRequests", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_AUTHENTIC, MOCK_TOPIC, MOCK_SCENES_AUTHENTIC)
      expect(briefs.imageBrief.cropRequests.length).toBe(3) // 1:1, 4:5, 9:16
      expect(briefs.imageBrief.variantRequests.length).toBe(0)
    })

    it("crop requests có badge 'Ảnh thật'", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_AUTHENTIC, MOCK_TOPIC, MOCK_SCENES_AUTHENTIC)
      const has = briefs.imageBrief.cropRequests.some((r) => r.badgeText?.includes("Ảnh thật"))
      expect(has).toBe(true)
    })

    it("videoBrief scenes dùng imageSource = original", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_AUTHENTIC, MOCK_TOPIC, MOCK_SCENES_AUTHENTIC)
      expect(briefs.videoBrief.scenes.every((s) => s.imageSource === "original")).toBe(true)
    })

    it("contentBrief KHÔNG có hashtag trending/viral", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_AUTHENTIC, MOCK_TOPIC, MOCK_SCENES_AUTHENTIC)
      expect(briefs.contentBrief.hashtagSuggestions).not.toContain("#trending")
      expect(briefs.contentBrief.hashtagSuggestions).not.toContain("#viral")
    })

    it("contentBrief platforms bao gồm facebook, zalo (cộng đồng)", () => {
      briefs = buildTopicContentBriefs(MOCK_BRIEF_AUTHENTIC, MOCK_TOPIC, MOCK_SCENES_AUTHENTIC)
      const platforms = briefs.contentBrief.captionRequests.map((r) => r.platform)
      expect(platforms).toContain("facebook")
      expect(platforms).toContain("zalo")
    })
  })
})

// ============================================================
// MEDIA BRIDGE TESTS
// ============================================================

describe("Topic → Media Bridge (M04b)", () => {
  it("CREATIVE mode tạo variant jobs", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
    const jobs = bridgeToVariantJobs(briefs.imageBrief, MOCK_PRODUCT_CONTEXT, MOCK_TOPIC.topicTitle)
    expect(jobs.length).toBe(3)
    expect(jobs[0]!.sourceImage).toBe(MOCK_PRODUCT_CONTEXT.sourceImageUrl)
    expect(jobs[0]!.sceneConfig.preset).toBe("workshop")
  })

  it("AUTHENTIC mode trả mảng rỗng (không gọi M04b)", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_AUTHENTIC, MOCK_TOPIC, MOCK_SCENES_AUTHENTIC)
    const jobs = bridgeToVariantJobs(briefs.imageBrief, MOCK_PRODUCT_CONTEXT, MOCK_TOPIC.topicTitle)
    expect(jobs.length).toBe(0)
  })

  it("countVariantJobs đếm chính xác", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
    expect(countVariantJobs([briefs])).toBe(3)
  })

  it("variant job chứa productPassport đúng", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
    const jobs = bridgeToVariantJobs(briefs.imageBrief, MOCK_PRODUCT_CONTEXT, MOCK_TOPIC.topicTitle)
    expect(jobs[0]!.productPassport.productName).toBe("Bó hoa hồng kem dâu")
    expect(jobs[0]!.productPassport.components).toContain("Hoa hồng kem")
  })
})

// ============================================================
// VIDEO BRIDGE TESTS
// ============================================================

describe("Topic → Video Bridge (M04c)", () => {
  it("CREATIVE mode dùng ảnh biến thể khi có resolvedImageUrls", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
    const imageUrls = new Map<number, string>([
      [1, "https://storage/variant-1.jpg"],
      [2, "https://storage/variant-2.jpg"],
      [3, "https://storage/variant-3.jpg"],
    ])
    const job = bridgeToVideoJob(briefs.videoBrief, MOCK_PRODUCT_CONTEXT, imageUrls, MOCK_TOPIC.topicTitle)
    expect(job.scenes[0]!.imageUrl).toBe("https://storage/variant-1.jpg")
    expect(job.productionMode).toBe("CREATIVE")
    expect(job.subtitleStyle).toBe("MODERN_BADGE")
  })

  it("AUTHENTIC mode luôn dùng ảnh gốc", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_AUTHENTIC, MOCK_TOPIC, MOCK_SCENES_AUTHENTIC)
    const job = bridgeToVideoJob(briefs.videoBrief, MOCK_PRODUCT_CONTEXT, new Map(), MOCK_TOPIC.topicTitle)
    expect(job.scenes[0]!.imageUrl).toBe(MOCK_PRODUCT_CONTEXT.sourceImageUrl)
    expect(job.productionMode).toBe("AUTHENTIC")
    expect(job.subtitleStyle).toBe("MINIMAL_ELEGANT")
  })

  it("video job có productInfo đúng", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
    const job = bridgeToVideoJob(briefs.videoBrief, MOCK_PRODUCT_CONTEXT, new Map(), MOCK_TOPIC.topicTitle)
    expect(job.productInfo.name).toBe("Bó hoa hồng kem dâu")
    expect(job.totalDurationSeconds).toBe(30)
  })

  it("voice code mapped đúng từ voice ID", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
    const job = bridgeToVideoJob(briefs.videoBrief, MOCK_PRODUCT_CONTEXT, new Map(), MOCK_TOPIC.topicTitle)
    expect(job.voiceCode).toBe("nova") // flora-nu-truyen-cam → nova
  })
})

// ============================================================
// AUDIO BRIDGE TESTS
// ============================================================

describe("Topic → Audio Bridge", () => {
  it("CREATIVE mode: quality hd, ducking 0.25", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
    const job = bridgeToAudioJob(briefs.audioBrief, "org-1")
    expect(job.qualityTier).toBe("hd")
    expect(job.bgmDuckingVolume).toBe(0.25)
  })

  it("AUTHENTIC mode: quality standard, ducking 0.18", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_AUTHENTIC, MOCK_TOPIC, MOCK_SCENES_AUTHENTIC)
    const job = bridgeToAudioJob(briefs.audioBrief, "org-1")
    expect(job.qualityTier).toBe("standard")
    expect(job.bgmDuckingVolume).toBe(0.18)
  })

  it("scenes count khớp", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
    const job = bridgeToAudioJob(briefs.audioBrief, "org-1")
    expect(job.scenes.length).toBe(3)
    expect(job.organizationId).toBe("org-1")
    expect(job.taskType).toBe("AUDIO_MIX")
  })

  it("estimateAudioCredits CREATIVE = 2x", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
    expect(estimateAudioCredits(briefs.audioBrief)).toBe(6) // 3 scenes × 2
  })

  it("estimateAudioCredits AUTHENTIC = 1x", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_AUTHENTIC, MOCK_TOPIC, MOCK_SCENES_AUTHENTIC)
    expect(estimateAudioCredits(briefs.audioBrief)).toBe(3) // 3 scenes × 1
  })
})

// ============================================================
// CONTENT BRIDGE TESTS
// ============================================================

describe("Topic → Content Bridge", () => {
  it("CREATIVE mode có prompt viral/hook mạnh", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
    const inputs = bridgeToContentInputs(briefs.contentBrief, MOCK_PRODUCT_CONTEXT, {
      title: MOCK_TOPIC.topicTitle,
      angle: MOCK_TOPIC.topicAngle,
      hook: MOCK_TOPIC.topicHook,
      cta: MOCK_TOPIC.topicCta,
      emotionalTone: MOCK_TOPIC.topicEmotionalTone,
    })
    expect(inputs.length).toBeGreaterThan(0)
    const prompt = buildContentPrompt(inputs[0]!)
    expect(prompt).toContain("viral")
    expect(prompt).toContain("DỪNG LẠI")
  })

  it("AUTHENTIC mode có prompt chân thật/storytelling", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_AUTHENTIC, MOCK_TOPIC, MOCK_SCENES_AUTHENTIC)
    const inputs = bridgeToContentInputs(briefs.contentBrief, MOCK_PRODUCT_CONTEXT, {
      title: MOCK_TOPIC.topicTitle,
      angle: MOCK_TOPIC.topicAngle,
      hook: MOCK_TOPIC.topicHook,
      cta: MOCK_TOPIC.topicCta,
      emotionalTone: MOCK_TOPIC.topicEmotionalTone,
    })
    const prompt = buildContentPrompt(inputs[0]!)
    expect(prompt).toContain("Chân thật")
    expect(prompt).toContain("kể chuyện thật")
  })

  it("content input chứa product info đúng", () => {
    const briefs = buildTopicContentBriefs(MOCK_BRIEF_CREATIVE, MOCK_TOPIC, MOCK_SCENES_CREATIVE)
    const inputs = bridgeToContentInputs(briefs.contentBrief, MOCK_PRODUCT_CONTEXT, {
      title: MOCK_TOPIC.topicTitle,
      angle: MOCK_TOPIC.topicAngle,
      hook: MOCK_TOPIC.topicHook,
      cta: MOCK_TOPIC.topicCta,
      emotionalTone: MOCK_TOPIC.topicEmotionalTone,
    })
    expect(inputs[0]!.product.name).toBe("Bó hoa hồng kem dâu")
    expect(inputs[0]!.product.components).toContain("Hoa hồng kem")
  })
})
