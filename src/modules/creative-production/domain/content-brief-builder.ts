/**
 * Content Brief Builder — Sinh nội dung sáng tạo từ topics đã chọn.
 *
 * Thuần TypeScript Domain Logic — Zero external dependencies.
 * Input: TopicProductionBrief (carry-forward từ Chặng 01–04)
 * Output: ContentBrief[] cho từng nhóm sản xuất (Ảnh, Video, Content, Audio)
 *
 * Phân nhánh hoàn toàn theo ProductionMode:
 * - 🌿 AUTHENTIC: chân thật, gần gũi, giữ nguyên ảnh gốc
 * - ✨ CREATIVE: sáng tạo AI, viral, biến thể bối cảnh
 */

import type {
  ProductionMode,
  TopicProductionBrief,
  SelectedTopicInfo,
  ProductContext,
  NarrativeSceneSpec,
  NarrativeBeat,
  VideoMotionEffect,
  TransitionEffect,
  CropRatio,
} from "./production-types"

// ============================================================
// OUTPUT TYPES
// ============================================================

/** Brief cho nhóm Ảnh */
export interface ImageBrief {
  readonly topicId: string
  readonly mode: ProductionMode
  /** Chỉ CREATIVE: yêu cầu biến thể (gửi sang M04b) */
  readonly variantRequests: readonly ImageVariantRequest[]
  /** Chỉ AUTHENTIC: yêu cầu crop (giữ ảnh gốc) */
  readonly cropRequests: readonly ImageCropRequest[]
}

export interface ImageVariantRequest {
  readonly sceneIndex: number
  readonly beat: NarrativeBeat
  readonly prompt: string
  readonly preset: string
  readonly lighting: string
  readonly surface: string
  readonly targetRatio: CropRatio
}

export interface ImageCropRequest {
  readonly ratio: CropRatio
  readonly platform: string
  readonly overlayText?: string | undefined
  readonly showLogo: boolean
  readonly showPrice: boolean
  readonly badgeText?: string | undefined
}

/** Brief cho nhóm Video */
export interface VideoBrief {
  readonly topicId: string
  readonly mode: ProductionMode
  readonly scenes: readonly VideoSceneBrief[]
  readonly voiceId: string
  readonly musicMood: string
  readonly totalDurationSeconds: number
  readonly videoFormat: "9:16" | "1:1" | "16:9"
}

export interface VideoSceneBrief {
  readonly sceneIndex: number
  readonly beat: NarrativeBeat
  /** CREATIVE: URL ảnh biến thể; AUTHENTIC: URL ảnh gốc */
  readonly imageSource: "original" | "variant"
  readonly voiceScript: string
  readonly textOverlay: string
  readonly durationSeconds: number
  readonly motionEffect: VideoMotionEffect
  readonly transitionEffect: TransitionEffect
}

/** Brief cho nhóm Audio */
export interface AudioBrief {
  readonly topicId: string
  readonly mode: ProductionMode
  readonly voiceId: string
  readonly musicMood: string
  readonly scenes: readonly AudioSceneBrief[]
  readonly totalDurationSeconds: number
}

export interface AudioSceneBrief {
  readonly sceneIndex: number
  readonly voiceScript: string
  readonly targetDurationSeconds: number
}

/** Brief cho nhóm Content */
export interface ContentBrief {
  readonly topicId: string
  readonly mode: ProductionMode
  readonly captionRequests: readonly CaptionRequest[]
  readonly hashtagSuggestions: readonly string[]
}

export interface CaptionRequest {
  readonly platform: "facebook" | "tiktok" | "instagram" | "zalo"
  readonly tone: string
  readonly hook: string
  readonly cta: string
  readonly maxLength: number
  readonly productName: string
  readonly category: string
  readonly targetAudience?: string | undefined
}

/** Tổng hợp toàn bộ briefs cho 1 topic */
export interface TopicContentBriefs {
  readonly topicId: string
  readonly topicTitle: string
  readonly mode: ProductionMode
  readonly imageBrief: ImageBrief
  readonly videoBrief: VideoBrief
  readonly audioBrief: AudioBrief
  readonly contentBrief: ContentBrief
}

// ============================================================
// BUILDER FUNCTIONS
// ============================================================

/**
 * Tổng hợp content briefs cho 1 topic — phân nhánh theo mode.
 */
export function buildTopicContentBriefs(
  brief: TopicProductionBrief,
  topic: SelectedTopicInfo,
  narrativeScenes: readonly NarrativeSceneSpec[],
): TopicContentBriefs {
  const voiceId = brief.voiceId ?? "flora-nu-truyen-cam"
  const musicMood = brief.musicMood ?? "warm"
  const totalDuration = brief.targetVideoDurationSeconds ?? 30

  return {
    topicId: topic.topicId,
    topicTitle: topic.topicTitle,
    mode: brief.mode,
    imageBrief: buildImageBrief(brief.mode, topic, narrativeScenes, brief.productContext),
    videoBrief: buildVideoBrief(brief.mode, topic, narrativeScenes, voiceId, musicMood, totalDuration),
    audioBrief: buildAudioBrief(brief.mode, topic, narrativeScenes, voiceId, musicMood, totalDuration),
    contentBrief: buildContentBrief(brief.mode, topic, brief.productContext),
  }
}

// ============================================================
// PRIVATE BUILDERS
// ============================================================

function buildImageBrief(
  mode: ProductionMode,
  topic: SelectedTopicInfo,
  scenes: readonly NarrativeSceneSpec[],
  ctx: ProductContext,
): ImageBrief {
  if (mode === "AUTHENTIC") {
    return {
      topicId: topic.topicId,
      mode,
      variantRequests: [],
      cropRequests: buildAuthenticCropRequests(ctx),
    }
  }

  // CREATIVE: biến thể AI cho mỗi scene
  return {
    topicId: topic.topicId,
    mode,
    cropRequests: [],
    variantRequests: scenes
      .filter((s) => s.creativeConfig)
      .map((s) => ({
        sceneIndex: s.sceneIndex,
        beat: s.beat,
        prompt: `${topic.topicAngle} — ${s.sceneDescription}`,
        preset: s.creativeConfig!.preset,
        lighting: s.creativeConfig!.lighting,
        surface: s.creativeConfig!.surface,
        targetRatio: "1:1" as CropRatio,
      })),
  }
}

function buildAuthenticCropRequests(ctx: ProductContext): readonly ImageCropRequest[] {
  const productName = ctx.commercialPassport.productName
  const price = ctx.commercialPassport.priceRange

  return [
    {
      ratio: "1:1",
      platform: "instagram",
      showLogo: true,
      showPrice: false,
      badgeText: "🌿 Ảnh thật từ tiệm",
    },
    {
      ratio: "4:5",
      platform: "facebook",
      overlayText: price ? `Giá: ${price}` : undefined,
      showLogo: true,
      showPrice: !!price,
    },
    {
      ratio: "9:16",
      platform: "tiktok_story",
      overlayText: productName,
      showLogo: true,
      showPrice: false,
      badgeText: "🌿 Ảnh thật",
    },
  ]
}

function buildVideoBrief(
  mode: ProductionMode,
  topic: SelectedTopicInfo,
  scenes: readonly NarrativeSceneSpec[],
  voiceId: string,
  musicMood: string,
  totalDuration: number,
): VideoBrief {
  const videoScenes: VideoSceneBrief[] = scenes.map((s) => ({
    sceneIndex: s.sceneIndex,
    beat: s.beat,
    imageSource: mode === "AUTHENTIC" ? "original" as const : "variant" as const,
    voiceScript: s.voiceScript,
    textOverlay: s.textOverlay,
    durationSeconds: s.durationSeconds,
    motionEffect: s.motionEffect,
    transitionEffect: s.transitionEffect,
  }))

  return {
    topicId: topic.topicId,
    mode,
    scenes: videoScenes,
    voiceId,
    musicMood,
    totalDurationSeconds: totalDuration,
    videoFormat: "9:16", // Mặc định dọc cho social
  }
}

function buildAudioBrief(
  mode: ProductionMode,
  topic: SelectedTopicInfo,
  scenes: readonly NarrativeSceneSpec[],
  voiceId: string,
  musicMood: string,
  totalDuration: number,
): AudioBrief {
  return {
    topicId: topic.topicId,
    mode,
    voiceId,
    musicMood,
    totalDurationSeconds: totalDuration,
    scenes: scenes.map((s) => ({
      sceneIndex: s.sceneIndex,
      voiceScript: s.voiceScript,
      targetDurationSeconds: s.durationSeconds,
    })),
  }
}

function buildContentBrief(
  mode: ProductionMode,
  topic: SelectedTopicInfo,
  ctx: ProductContext,
): ContentBrief {
  const productName = ctx.commercialPassport.productName
  const category = ctx.commercialPassport.category
  const audience = ctx.commercialPassport.targetAudience

  const authenticTone = "chân thật, gần gũi, storytelling nhẹ nhàng"
  const creativeTone = "sáng tạo, năng lượng cao, hook mạnh, viral"
  const tone = mode === "AUTHENTIC" ? authenticTone : creativeTone

  const platforms: Array<"facebook" | "tiktok" | "instagram" | "zalo"> =
    mode === "AUTHENTIC"
      ? ["facebook", "zalo"]
      : ["tiktok", "instagram", "facebook"]

  const captionRequests: CaptionRequest[] = platforms.map((platform) => ({
    platform,
    tone,
    hook: topic.topicHook,
    cta: topic.topicCta,
    maxLength: platform === "tiktok" ? 150 : platform === "instagram" ? 300 : 500,
    productName,
    category,
    targetAudience: audience,
  }))

  // Hashtags phân nhánh theo mode
  const baseHashtags = [`#${category.toLowerCase().replace(/\s/g, "")}`, "#hoatuoi"]
  const authenticHashtags = [...baseHashtags, "#thucte", "#handmade"]
  const creativeHashtags = [...baseHashtags, "#trending", "#viral", "#aiart"]

  return {
    topicId: topic.topicId,
    mode,
    captionRequests,
    hashtagSuggestions: mode === "AUTHENTIC" ? authenticHashtags : creativeHashtags,
  }
}
