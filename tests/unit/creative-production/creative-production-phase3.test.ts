/**
 * Unit Tests — produce-authentic, produce-creative, package-campaign.
 *
 * Kiểm tra:
 * - produceAuthentic: đúng mode, đúng số jobs, 0 variant, có crop
 * - produceCreative: đúng mode, có variant jobs, video builder hoạt động
 * - packageCampaign: đóng gói đúng, cost summary, dual mode
 * - narrative-ai-adapter: stub throw, prompt builder
 * - creative-production-repository: CRUD in-memory
 */

import { describe, it, expect } from "vitest"
import { produceAuthentic } from "@/modules/creative-production/use-cases/produce-authentic"
import { produceCreative } from "@/modules/creative-production/use-cases/produce-creative"
import { packageCampaign } from "@/modules/creative-production/use-cases/package-campaign"
import {
  StubNarrativeAiAdapter,
  buildNarrativeArcPrompt,
} from "@/modules/creative-production/adapters/narrative-ai-adapter"
import {
  InMemoryCreativeProductionRepository,
} from "@/modules/creative-production/infra/creative-production-repository"
import type {
  TopicProductionBrief,
  SelectedTopicInfo,
  ProductContext,
  CampaignPackage,
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

const BRIEF_AUTHENTIC: TopicProductionBrief = {
  organizationId: "org-test",
  mode: "AUTHENTIC",
  productContext: PRODUCT_CTX,
  selectedTopics: [TOPIC],
  targetVideoDurationSeconds: 30,
}

const BRIEF_CREATIVE: TopicProductionBrief = {
  ...BRIEF_AUTHENTIC,
  mode: "CREATIVE",
}

// ============================================================
// produceAuthentic TESTS
// ============================================================

describe("produceAuthentic", () => {
  it("trả mode = AUTHENTIC", () => {
    const result = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    expect(result.mode).toBe("AUTHENTIC")
  })

  it("KHÔNG có variant jobs (0 AI editing)", () => {
    const result = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    for (const tr of result.topicResults) {
      expect(tr.imageCrops.length).toBeGreaterThan(0)
    }
    const variantItems = result.mediaPlanItems.filter(
      (i) => i.assetType === "IMAGE_VARIANT"
    )
    expect(variantItems.length).toBe(0)
  })

  it("có image crops cho 3 platforms", () => {
    const result = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    const cropItems = result.mediaPlanItems.filter(
      (i) => i.assetType === "IMAGE_CROP"
    )
    expect(cropItems.length).toBe(3) // 1:1, 4:5, 9:16
  })

  it("có 1 video job (VIDEO_OVERLAY)", () => {
    const result = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    const videoItems = result.mediaPlanItems.filter(
      (i) => i.assetType === "VIDEO_OVERLAY"
    )
    expect(videoItems.length).toBe(1)
  })

  it("có 1 audio job", () => {
    const result = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    const audioItems = result.mediaPlanItems.filter(
      (i) => i.assetType === "AUDIO_MIX"
    )
    expect(audioItems.length).toBe(1)
  })

  it("có content captions (facebook + zalo)", () => {
    const result = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    const captionItems = result.mediaPlanItems.filter(
      (i) => i.assetType === "CONTENT_CAPTION"
    )
    expect(captionItems.length).toBe(2) // facebook + zalo
  })

  it("videoJobInput dùng ảnh gốc cho tất cả scenes", () => {
    const result = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    const tr = result.topicResults[0]!
    expect(tr.videoJobInput.productionMode).toBe("AUTHENTIC")
    for (const scene of tr.videoJobInput.scenes) {
      expect(scene.imageUrl).toBe(PRODUCT_CTX.sourceImageUrl)
    }
  })

  it("arc có 3 cảnh (AUTHENTIC)", () => {
    const result = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    expect(result.topicResults[0]!.arc.scenes.length).toBe(3)
  })

  it("throw nếu mode !== AUTHENTIC", () => {
    expect(() =>
      produceAuthentic({ brief: BRIEF_CREATIVE })
    ).toThrow("AUTHENTIC")
  })

  it("totalEstimatedCredits > 0", () => {
    const result = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    expect(result.totalEstimatedCredits).toBeGreaterThan(0)
  })

  it("multi-topic: kết quả cho mỗi topic", () => {
    const multi: TopicProductionBrief = {
      ...BRIEF_AUTHENTIC,
      selectedTopics: [
        TOPIC,
        { ...TOPIC, topicId: "t-2", topicTitle: "Sinh nhật" },
      ],
    }
    const result = produceAuthentic({ brief: multi })
    expect(result.topicResults.length).toBe(2)
    expect(result.topicResults[0]!.topicId).toBe("t-1")
    expect(result.topicResults[1]!.topicId).toBe("t-2")
  })
})

// ============================================================
// produceCreative TESTS
// ============================================================

describe("produceCreative", () => {
  it("trả mode = CREATIVE", () => {
    const result = produceCreative({ brief: BRIEF_CREATIVE })
    expect(result.mode).toBe("CREATIVE")
  })

  it("có variant job inputs (5 scenes)", () => {
    const result = produceCreative({ brief: BRIEF_CREATIVE })
    const tr = result.topicResults[0]!
    expect(tr.variantJobInputs.length).toBe(5)
  })

  it("variant inputs khớp contract M04b", () => {
    const result = produceCreative({ brief: BRIEF_CREATIVE })
    const vj = result.topicResults[0]!.variantJobInputs[0]!
    expect(vj.sourceImage).toBe(PRODUCT_CTX.sourceImageUrl)
    expect(vj.productPassport.productName).toBe("Bó hoa hồng đỏ")
    expect(vj.sceneConfig.preset).toBeDefined()
    expect(vj.sceneConfig.lighting).toBeDefined()
    expect(vj.topicId).toBe("t-1")
  })

  it("mediaPlanItems có IMAGE_VARIANT", () => {
    const result = produceCreative({ brief: BRIEF_CREATIVE })
    const variants = result.mediaPlanItems.filter(
      (i) => i.assetType === "IMAGE_VARIANT"
    )
    expect(variants.length).toBe(5)
  })

  it("VIDEO_STORY thay vì VIDEO_OVERLAY", () => {
    const result = produceCreative({ brief: BRIEF_CREATIVE })
    const videos = result.mediaPlanItems.filter(
      (i) => i.assetType === "VIDEO_STORY"
    )
    expect(videos.length).toBe(1)
  })

  it("videoJobBuilder.build() hoạt động với resolved URLs", () => {
    const result = produceCreative({ brief: BRIEF_CREATIVE })
    const tr = result.topicResults[0]!
    const urls = new Map<number, string>()
    for (let i = 1; i <= 5; i++) {
      urls.set(i, `https://cdn.test/variant-${i}.jpg`)
    }
    const videoInput = tr.videoJobBuilder.build(urls)
    expect(videoInput.productionMode).toBe("CREATIVE")
    expect(videoInput.scenes[0]!.imageUrl).toBe("https://cdn.test/variant-1.jpg")
    expect(videoInput.scenes[4]!.imageUrl).toBe("https://cdn.test/variant-5.jpg")
  })

  it("videoJobBuilder fallback ảnh gốc nếu không có resolved URL", () => {
    const result = produceCreative({ brief: BRIEF_CREATIVE })
    const tr = result.topicResults[0]!
    const urls = new Map<number, string>()
    // Chỉ có scene 1
    urls.set(1, "https://cdn.test/variant-1.jpg")
    const videoInput = tr.videoJobBuilder.build(urls)
    expect(videoInput.scenes[0]!.imageUrl).toBe("https://cdn.test/variant-1.jpg")
    expect(videoInput.scenes[1]!.imageUrl).toBe(PRODUCT_CTX.sourceImageUrl) // fallback
  })

  it("audioJobInput quality = hd (CREATIVE)", () => {
    const result = produceCreative({ brief: BRIEF_CREATIVE })
    const tr = result.topicResults[0]!
    expect(tr.audioJobInput.qualityTier).toBe("hd")
  })

  it("content captions cho 3 platforms (tiktok + instagram + facebook)", () => {
    const result = produceCreative({ brief: BRIEF_CREATIVE })
    const captions = result.mediaPlanItems.filter(
      (i) => i.assetType === "CONTENT_CAPTION"
    )
    expect(captions.length).toBe(3)
  })

  it("CREATIVE credits > AUTHENTIC credits", () => {
    const c = produceCreative({ brief: BRIEF_CREATIVE })
    const a = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    expect(c.totalEstimatedCredits).toBeGreaterThan(a.totalEstimatedCredits)
  })

  it("throw nếu mode !== CREATIVE", () => {
    expect(() =>
      produceCreative({ brief: BRIEF_AUTHENTIC })
    ).toThrow("CREATIVE")
  })

  it("arc có 5 cảnh", () => {
    const result = produceCreative({ brief: BRIEF_CREATIVE })
    expect(result.topicResults[0]!.arc.scenes.length).toBe(5)
  })
})

// ============================================================
// packageCampaign TESTS
// ============================================================

describe("packageCampaign", () => {
  it("đóng gói AUTHENTIC result", () => {
    const authResult = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    const pkg = packageCampaign({ authenticResult: authResult })
    expect(pkg.campaign.mode).toBe("AUTHENTIC")
    expect(pkg.campaign.status).toBe("DRAFT")
    expect(pkg.campaign.topicIds).toContain("t-1")
    expect(pkg.totalJobsCount).toBeGreaterThan(0)
  })

  it("đóng gói CREATIVE result", () => {
    const creativeResult = produceCreative({ brief: BRIEF_CREATIVE })
    const pkg = packageCampaign({ creativeResult })
    expect(pkg.campaign.mode).toBe("CREATIVE")
    expect(pkg.campaign.mediaPlan.items.length).toBeGreaterThan(0)
  })

  it("đóng gói DUAL mode (A/B testing)", () => {
    const authResult = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    const creativeResult = produceCreative({ brief: BRIEF_CREATIVE })
    const pkg = packageCampaign({ authenticResult: authResult, creativeResult })
    // Dual mode → label as CREATIVE
    expect(pkg.campaign.mode).toBe("CREATIVE")
    // Items từ cả 2 mode
    const cropItems = pkg.campaign.mediaPlan.items.filter(
      (i) => i.assetType === "IMAGE_CROP"
    )
    const variantItems = pkg.campaign.mediaPlan.items.filter(
      (i) => i.assetType === "IMAGE_VARIANT"
    )
    expect(cropItems.length).toBeGreaterThan(0)
    expect(variantItems.length).toBeGreaterThan(0)
  })

  it("costSummary tính đúng", () => {
    const creativeResult = produceCreative({ brief: BRIEF_CREATIVE })
    const pkg = packageCampaign({ creativeResult })
    expect(pkg.costSummary.imageCredits).toBeGreaterThan(0)
    expect(pkg.costSummary.videoCredits).toBeGreaterThan(0)
    expect(pkg.costSummary.totalCredits).toBe(
      pkg.costSummary.imageCredits +
      pkg.costSummary.videoCredits +
      pkg.costSummary.audioCredits +
      pkg.costSummary.contentCredits
    )
  })

  it("tên chiến dịch auto-generate nếu không truyền", () => {
    const authResult = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    const pkg = packageCampaign({ authenticResult: authResult })
    expect(pkg.campaign.campaignName).toContain("Chân thật")
  })

  it("tên chiến dịch custom", () => {
    const authResult = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    const pkg = packageCampaign({
      authenticResult: authResult,
      campaignName: "Valentine 2024",
    })
    expect(pkg.campaign.campaignName).toBe("Valentine 2024")
  })

  it("producedAssets ban đầu rỗng", () => {
    const authResult = produceAuthentic({ brief: BRIEF_AUTHENTIC })
    const pkg = packageCampaign({ authenticResult: authResult })
    expect(pkg.campaign.producedAssets.length).toBe(0)
  })

  it("throw nếu không có kết quả nào", () => {
    expect(() => packageCampaign({})).toThrow("cần ít nhất 1")
  })
})

// ============================================================
// StubNarrativeAiAdapter TESTS
// ============================================================

describe("StubNarrativeAiAdapter", () => {
  it("stub throw khi gọi", async () => {
    const adapter = new StubNarrativeAiAdapter()
    await expect(
      adapter.generateNarrativeArc({
        mode: "CREATIVE",
        topic: TOPIC,
        productContext: PRODUCT_CTX,
        targetDurationSeconds: 30,
      })
    ).rejects.toThrow("chưa được triển khai")
  })
})

describe("buildNarrativeArcPrompt", () => {
  it("AUTHENTIC prompt chứa 3 cảnh", () => {
    const prompt = buildNarrativeArcPrompt({
      mode: "AUTHENTIC",
      topic: TOPIC,
      productContext: PRODUCT_CTX,
      targetDurationSeconds: 30,
    })
    expect(prompt).toContain("3 cảnh")
    expect(prompt).toContain("KHÔNG cốt truyện phức tạp")
  })

  it("CREATIVE prompt chứa 5 cảnh", () => {
    const prompt = buildNarrativeArcPrompt({
      mode: "CREATIVE",
      topic: TOPIC,
      productContext: PRODUCT_CTX,
      targetDurationSeconds: 30,
    })
    expect(prompt).toContain("5 cảnh")
    expect(prompt).toContain("SETUP")
  })

  it("prompt chứa tên sản phẩm", () => {
    const prompt = buildNarrativeArcPrompt({
      mode: "CREATIVE",
      topic: TOPIC,
      productContext: PRODUCT_CTX,
      targetDurationSeconds: 30,
    })
    expect(prompt).toContain("Bó hoa hồng đỏ")
  })
})

// ============================================================
// InMemoryCreativeProductionRepository TESTS
// ============================================================

describe("InMemoryCreativeProductionRepository", () => {
  const repo = new InMemoryCreativeProductionRepository()

  const makeCampaign = (id: string): CampaignPackage => ({
    campaignId: id,
    campaignName: "Test",
    mode: "AUTHENTIC",
    topicIds: ["t-1"],
    mediaPlan: {
      briefId: "b-1",
      mode: "AUTHENTIC",
      items: [],
      estimatedCredits: 10,
      estimatedTimeMinutes: 5,
    },
    status: "DRAFT",
    producedAssets: [],
    createdAt: new Date(),
  })

  it("save + get", async () => {
    repo.clear()
    const c = makeCampaign("cp-1")
    await repo.saveCampaign(c)
    const found = await repo.getCampaign("cp-1", "org-1")
    expect(found?.campaignId).toBe("cp-1")
  })

  it("get trả null nếu không có", async () => {
    const found = await repo.getCampaign("cp-none", "org-1")
    expect(found).toBeNull()
  })

  it("updateCampaignStatus", async () => {
    repo.clear()
    await repo.saveCampaign(makeCampaign("cp-2"))
    await repo.updateCampaignStatus("cp-2", "org-1", "PRODUCING")
    const found = await repo.getCampaign("cp-2", "org-1")
    expect(found?.status).toBe("PRODUCING")
  })

  it("addProducedAsset", async () => {
    repo.clear()
    await repo.saveCampaign(makeCampaign("cp-3"))
    await repo.addProducedAsset("cp-3", "org-1", {
      assetType: "IMAGE_CROP",
      url: "https://cdn/crop.jpg",
      storageKey: "org/1/crop.jpg",
      topicId: "t-1",
      jobId: "j-1",
      approvalStatus: "PENDING",
    })
    const found = await repo.getCampaign("cp-3", "org-1")
    expect(found?.producedAssets.length).toBe(1)
    expect(found?.producedAssets[0]!.assetType).toBe("IMAGE_CROP")
  })

  it("listCampaigns với filter status", async () => {
    repo.clear()
    await repo.saveCampaign(makeCampaign("cp-4"))
    await repo.saveCampaign({ ...makeCampaign("cp-5"), status: "PRODUCING" })
    const drafts = await repo.listCampaigns("org-1", { status: "DRAFT" })
    expect(drafts.length).toBe(1)
    expect(drafts[0]!.campaignId).toBe("cp-4")
  })

  it("listCampaigns với limit", async () => {
    repo.clear()
    await repo.saveCampaign(makeCampaign("cp-6"))
    await repo.saveCampaign(makeCampaign("cp-7"))
    await repo.saveCampaign(makeCampaign("cp-8"))
    const limited = await repo.listCampaigns("org-1", { limit: 2 })
    expect(limited.length).toBe(2)
  })

  it("size helper", async () => {
    repo.clear()
    expect(repo.size).toBe(0)
    await repo.saveCampaign(makeCampaign("cp-9"))
    expect(repo.size).toBe(1)
  })
})
