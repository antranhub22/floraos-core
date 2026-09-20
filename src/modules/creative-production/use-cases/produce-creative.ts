/**
 * Use-case: Produce Creative — Orchestrate CREATIVE mode end-to-end.
 *
 * CREATIVE = AI biến thể ảnh + cung truyện 5 nhịp + video viral:
 * 1. Sinh narrative arc (5 cảnh: SETUP → RISING → CLIMAX → RESOLUTION → CTA)
 * 2. Dispatch ảnh biến thể AI qua M04b (5 credit/variant)
 * 3. Sinh voice + BGM qua Audio Studio (HD quality)
 * 4. Dựng video cốt truyện (M04c Video Studio)
 * 5. Sinh caption viral cho các nền tảng
 *
 * Tuân thủ: usage ghi tại điểm tạo job (core), không ở worker.
 * Domain logic thuần — gọi ra ngoài qua port interfaces.
 */

import type { TenantContext } from "@/core/tenancy"
import type {
  TopicProductionBrief,
  SelectedTopicInfo,
  NarrativeArcOutput,
  MediaPlanItem,
} from "../domain/production-types"
import type { TopicContentBriefs } from "../domain/content-brief-builder"
import type { VariantJobInput } from "../domain/topic-to-media-bridge"
import type { VideoJobInput } from "../domain/topic-to-video-bridge"
import type { AudioJobInput } from "@/modules/audio-studio/domain/audio-types"
import type { ContentGenerationInput } from "../domain/topic-to-content-bridge"

import { planNarrativeArc } from "./plan-narrative-arc"
import { buildTopicContentBriefs } from "../domain/content-brief-builder"
import { bridgeToVariantJobs } from "../domain/topic-to-media-bridge"
import { bridgeToVideoJob } from "../domain/topic-to-video-bridge"
import { bridgeToAudioJob, estimateAudioCredits } from "../domain/topic-to-audio-bridge"
import { bridgeToContentInputs } from "../domain/topic-to-content-bridge"

// ============================================================
// INPUT / OUTPUT
// ============================================================

export interface ProduceCreativeInput {
  readonly brief: TopicProductionBrief
}

/** Kết quả cho 1 topic */
export interface CreativeTopicResult {
  readonly topicId: string
  readonly topicTitle: string
  readonly arc: NarrativeArcOutput
  readonly briefs: TopicContentBriefs
  /** Ảnh: variant jobs sẵn sàng dispatch sang M04b */
  readonly variantJobInputs: readonly VariantJobInput[]
  /** Video: input sẵn sàng dispatch (cần resolvedImageUrls từ M04b) */
  readonly videoJobBuilder: CreativeVideoJobBuilder
  /** Audio: input sẵn sàng dispatch sang Audio Studio */
  readonly audioJobInput: AudioJobInput
  /** Content: inputs sẵn sàng dispatch sang AI Content Generator */
  readonly contentInputs: readonly ContentGenerationInput[]
  /** Tổng credit dự kiến cho topic này */
  readonly estimatedCredits: number
}

/**
 * Video job cần đợi ảnh biến thể xong mới build input hoàn chỉnh.
 * Builder giữ sẵn mọi thứ, chỉ chờ resolvedImageUrls.
 */
export interface CreativeVideoJobBuilder {
  /** Build VideoJobInput sau khi có ảnh biến thể */
  readonly build: (resolvedImageUrls: ReadonlyMap<number, string>) => VideoJobInput
  /** Video brief reference (để preview) */
  readonly videoFormat: "9:16" | "1:1" | "16:9"
  readonly sceneCount: number
  readonly totalDurationSeconds: number
}

export interface ProduceCreativeResult {
  readonly mode: "CREATIVE"
  readonly topicResults: readonly CreativeTopicResult[]
  readonly totalEstimatedCredits: number
  readonly mediaPlanItems: readonly MediaPlanItem[]
}

// ============================================================
// USE-CASE
// ============================================================

/**
 * Orchestrate CREATIVE mode cho tất cả topics đã chọn.
 *
 * Bước 1: Sinh narrative arc (5 nhịp kịch bản)
 * Bước 2: Build content briefs phân nhánh CREATIVE
 * Bước 3: Chuẩn bị variant job inputs cho M04b
 * Bước 4: Chuẩn bị video job builder (đợi ảnh biến thể)
 * Bước 5: Chuẩn bị audio/content inputs
 * Bước 6: Tổng hợp media plan
 *
 * Dispatch thật sẽ thực hiện SAU khi user xác nhận.
 */
export function produceCreative(
  input: ProduceCreativeInput,
): ProduceCreativeResult {
  const { brief } = input

  if (brief.mode !== "CREATIVE") {
    throw new Error(
      `produceCreative() chỉ xử lý CREATIVE mode, nhận được: ${brief.mode}`
    )
  }

  const topicResults: CreativeTopicResult[] = []
  const mediaPlanItems: MediaPlanItem[] = []
  let totalCredits = 0

  for (const topic of brief.selectedTopics) {
    const result = produceCreativeTopic(brief, topic)
    topicResults.push(result)
    totalCredits += result.estimatedCredits

    mediaPlanItems.push(...buildCreativePlanItems(topic, result))
  }

  return {
    mode: "CREATIVE",
    topicResults,
    totalEstimatedCredits: totalCredits,
    mediaPlanItems,
  }
}

// ============================================================
// PRIVATE — Per-Topic Orchestration
// ============================================================

function produceCreativeTopic(
  brief: TopicProductionBrief,
  topic: SelectedTopicInfo,
): CreativeTopicResult {
  // 1. Sinh narrative arc — CREATIVE: 5 cảnh đầy đủ
  const arc = planNarrativeArc({
    mode: "CREATIVE",
    topic,
    productContext: brief.productContext,
    targetDurationSeconds: brief.targetVideoDurationSeconds ?? 30,
  })

  // 2. Build briefs
  const briefs = buildTopicContentBriefs(brief, topic, arc.scenes)

  // 3. Variant job inputs → M04b
  const variantJobInputs = bridgeToVariantJobs(
    briefs.imageBrief,
    brief.productContext,
    topic.topicTitle,
  )

  // 4. Video job builder — đợi ảnh biến thể
  const videoJobBuilder: CreativeVideoJobBuilder = {
    build: (resolvedImageUrls: ReadonlyMap<number, string>) =>
      bridgeToVideoJob(
        briefs.videoBrief,
        brief.productContext,
        resolvedImageUrls,
        topic.topicTitle,
      ),
    videoFormat: briefs.videoBrief.videoFormat,
    sceneCount: briefs.videoBrief.scenes.length,
    totalDurationSeconds: briefs.videoBrief.totalDurationSeconds,
  }

  // 5. Audio input (HD quality cho CREATIVE)
  const audioJobInput = bridgeToAudioJob(
    briefs.audioBrief,
    brief.organizationId,
    undefined,  // auto-select provider
    "hd",       // CREATIVE → HD quality
  )

  // 6. Content inputs
  const contentInputs = bridgeToContentInputs(
    briefs.contentBrief,
    brief.productContext,
    {
      title: topic.topicTitle,
      angle: topic.topicAngle,
      hook: topic.topicHook,
      cta: topic.topicCta,
      emotionalTone: topic.topicEmotionalTone,
    },
  )

  // 7. Tính credit
  const imageCredits = variantJobInputs.length * 5  // 5 credit/variant
  const audioCredits = estimateAudioCredits(briefs.audioBrief)
  const videoCredits = 10  // 10 credit/video
  const contentCredits = contentInputs.length * 1
  const estimatedCredits = imageCredits + audioCredits + videoCredits + contentCredits

  return {
    topicId: topic.topicId,
    topicTitle: topic.topicTitle,
    arc,
    briefs,
    variantJobInputs,
    videoJobBuilder,
    audioJobInput,
    contentInputs,
    estimatedCredits,
  }
}

// ============================================================
// HELPERS
// ============================================================

function buildCreativePlanItems(
  topic: SelectedTopicInfo,
  result: CreativeTopicResult,
): MediaPlanItem[] {
  const items: MediaPlanItem[] = []

  // Image variants (5 credit mỗi)
  for (const vj of result.variantJobInputs) {
    items.push({
      assetType: "IMAGE_VARIANT",
      topicId: topic.topicId,
      priority: 1,
      status: "PLANNED",
      description: `Ảnh biến thể scene ${vj.sceneIndex}: ${vj.sceneConfig.preset}`,
      targetPlatform: "all",
    })
  }

  // Video story (10 credit)
  items.push({
    assetType: "VIDEO_STORY",
    topicId: topic.topicId,
    priority: 2,
    status: "PLANNED",
    description: `Video cốt truyện ${result.arc.scenes.length} cảnh (${result.arc.totalDurationSeconds}s)`,
    targetPlatform: "all",
  })

  // Audio HD
  items.push({
    assetType: "AUDIO_MIX",
    topicId: topic.topicId,
    priority: 2,
    status: "PLANNED",
    description: `Voice HD + BGM phối (${result.arc.scenes.length} cảnh)`,
    targetPlatform: "all",
  })

  // Content captions
  for (const ci of result.contentInputs) {
    items.push({
      assetType: "CONTENT_CAPTION",
      topicId: topic.topicId,
      priority: 3,
      status: "PLANNED",
      description: `Caption ${ci.platform} (viral)`,
      targetPlatform: ci.platform,
    })
  }

  return items
}
