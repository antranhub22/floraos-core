/**
 * Use-case: Produce Authentic — Orchestrate AUTHENTIC mode end-to-end.
 *
 * AUTHENTIC = giữ ảnh gốc 100%, KHÔNG AI editing ảnh:
 * 1. Crop ảnh gốc theo platform ratios (local, 0 credit)
 * 2. Sinh voice + BGM qua Audio Studio
 * 3. Dựng video (ảnh gốc + Ken Burns + voice + nhạc)
 * 4. Sinh caption/content cho các nền tảng
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
import type { VideoJobInput } from "../domain/topic-to-video-bridge"
import type { AudioJobInput } from "@/modules/audio-studio/domain/audio-types"
import type { ContentGenerationInput } from "../domain/topic-to-content-bridge"

import { planNarrativeArc } from "./plan-narrative-arc"
import { buildTopicContentBriefs } from "../domain/content-brief-builder"
import { bridgeToVideoJob } from "../domain/topic-to-video-bridge"
import { bridgeToAudioJob, estimateAudioCredits } from "../domain/topic-to-audio-bridge"
import { bridgeToContentInputs } from "../domain/topic-to-content-bridge"

// ============================================================
// INPUT / OUTPUT
// ============================================================

export interface ProduceAuthenticInput {
  readonly brief: TopicProductionBrief
}

/** Kết quả cho 1 topic */
export interface AuthenticTopicResult {
  readonly topicId: string
  readonly topicTitle: string
  readonly arc: NarrativeArcOutput
  readonly briefs: TopicContentBriefs
  /** Ảnh: crop requests (xử lý local, 0 credit) */
  readonly imageCrops: TopicContentBriefs["imageBrief"]["cropRequests"]
  /** Video: input sẵn sàng dispatch sang M04c */
  readonly videoJobInput: VideoJobInput
  /** Audio: input sẵn sàng dispatch sang Audio Studio */
  readonly audioJobInput: AudioJobInput
  /** Content: inputs sẵn sàng dispatch sang AI Content Generator */
  readonly contentInputs: readonly ContentGenerationInput[]
  /** Tổng credit dự kiến cho topic này */
  readonly estimatedCredits: number
}

export interface ProduceAuthenticResult {
  readonly mode: "AUTHENTIC"
  readonly topicResults: readonly AuthenticTopicResult[]
  readonly totalEstimatedCredits: number
  readonly mediaPlanItems: readonly MediaPlanItem[]
}

// ============================================================
// USE-CASE
// ============================================================

/**
 * Orchestrate AUTHENTIC mode cho tất cả topics đã chọn.
 *
 * Bước 1: Sinh narrative arc (rule-based, 3 cảnh đơn giản)
 * Bước 2: Build content briefs phân nhánh AUTHENTIC
 * Bước 3: Chuẩn bị job inputs cho từng xưởng
 * Bước 4: Tổng hợp media plan (chưa dispatch thật)
 *
 * Dispatch thật sẽ thực hiện SAU khi user xác nhận.
 */
export function produceAuthentic(
  input: ProduceAuthenticInput,
): ProduceAuthenticResult {
  const { brief } = input

  if (brief.mode !== "AUTHENTIC") {
    throw new Error(
      `produceAuthentic() chỉ xử lý AUTHENTIC mode, nhận được: ${brief.mode}`
    )
  }

  const topicResults: AuthenticTopicResult[] = []
  const mediaPlanItems: MediaPlanItem[] = []
  let totalCredits = 0

  for (const topic of brief.selectedTopics) {
    const result = produceAuthenticTopic(brief, topic)
    topicResults.push(result)
    totalCredits += result.estimatedCredits

    // Gom media plan items
    mediaPlanItems.push(...buildAuthenticPlanItems(topic, result))
  }

  return {
    mode: "AUTHENTIC",
    topicResults,
    totalEstimatedCredits: totalCredits,
    mediaPlanItems,
  }
}

// ============================================================
// PRIVATE — Per-Topic Orchestration
// ============================================================

function produceAuthenticTopic(
  brief: TopicProductionBrief,
  topic: SelectedTopicInfo,
): AuthenticTopicResult {
  // 1. Sinh narrative arc — AUTHENTIC: 3 cảnh đơn giản
  const arc = planNarrativeArc({
    mode: "AUTHENTIC",
    topic,
    productContext: brief.productContext,
    targetDurationSeconds: brief.targetVideoDurationSeconds ?? 30,
  })

  // 2. Build briefs
  const briefs = buildTopicContentBriefs(brief, topic, arc.scenes)

  // 3. Video input — AUTHENTIC: tất cả scene dùng ảnh gốc
  const resolvedImageUrls = new Map<number, string>()
  for (const scene of arc.scenes) {
    resolvedImageUrls.set(scene.sceneIndex, brief.productContext.sourceImageUrl)
  }
  const videoJobInput = bridgeToVideoJob(
    briefs.videoBrief,
    brief.productContext,
    resolvedImageUrls,
    topic.topicTitle,
  )

  // 4. Audio input
  const audioJobInput = bridgeToAudioJob(
    briefs.audioBrief,
    brief.organizationId,
  )

  // 5. Content inputs
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

  // 6. Tính credit
  const audioCredits = estimateAudioCredits(briefs.audioBrief)
  const videoCredits = 10  // 10 credit/video
  const contentCredits = contentInputs.length * 1  // 1 credit/caption
  const imageCredits = 0   // AUTHENTIC: crop local = 0 credit
  const estimatedCredits = audioCredits + videoCredits + contentCredits + imageCredits

  return {
    topicId: topic.topicId,
    topicTitle: topic.topicTitle,
    arc,
    briefs,
    imageCrops: briefs.imageBrief.cropRequests,
    videoJobInput,
    audioJobInput,
    contentInputs,
    estimatedCredits,
  }
}

// ============================================================
// HELPERS
// ============================================================

function buildAuthenticPlanItems(
  topic: SelectedTopicInfo,
  result: AuthenticTopicResult,
): MediaPlanItem[] {
  const items: MediaPlanItem[] = []

  // Image crops (0 credit)
  for (const crop of result.imageCrops) {
    items.push({
      assetType: "IMAGE_CROP",
      topicId: topic.topicId,
      priority: 1,
      status: "PLANNED",
      description: `Crop ảnh gốc ${crop.ratio} cho ${crop.platform}`,
      targetPlatform: crop.platform as MediaPlanItem["targetPlatform"],
    })
  }

  // Video (10 credit)
  items.push({
    assetType: "VIDEO_OVERLAY",
    topicId: topic.topicId,
    priority: 2,
    status: "PLANNED",
    description: `Video ảnh gốc + voice + nhạc (${result.arc.totalDurationSeconds}s)`,
    targetPlatform: "all",
  })

  // Audio
  items.push({
    assetType: "AUDIO_MIX",
    topicId: topic.topicId,
    priority: 2,
    status: "PLANNED",
    description: `Voice + BGM phối (${result.arc.scenes.length} cảnh)`,
    targetPlatform: "all",
  })

  // Content
  for (const ci of result.contentInputs) {
    items.push({
      assetType: "CONTENT_CAPTION",
      topicId: topic.topicId,
      priority: 3,
      status: "PLANNED",
      description: `Caption ${ci.platform} (chân thật)`,
      targetPlatform: ci.platform,
    })
  }

  return items
}
