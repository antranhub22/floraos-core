/**
 * Use-case: Dispatch Production Jobs — Gửi jobs sang các xưởng sản xuất.
 *
 * Orchestrator chính: nhận TopicProductionBrief → phân phối jobs:
 * 1. Plan Narrative Arc
 * 2. Build Content Briefs  
 * 3. Dispatch Image Jobs (CREATIVE → M04b, AUTHENTIC → crop local)
 * 4. Dispatch Video Jobs (→ M04c Video Studio)
 * 5. Dispatch Audio Jobs (→ Audio Studio)
 * 6. Dispatch Content Jobs (→ AI Content Generator)
 *
 * Tuân thủ: usage ghi tại điểm tạo job (core), không ghi ở worker.
 */

import type { TenantContext } from "@/core/tenancy"
import type {
  TopicProductionBrief,
  MediaPlan,
  MediaPlanItem,
  MediaAssetType,
} from "../domain/production-types"
import { planNarrativeArc } from "./plan-narrative-arc"
import { buildTopicContentBriefs } from "../domain/content-brief-builder"
import { bridgeToVariantJobs, countVariantJobs } from "../domain/topic-to-media-bridge"
import { bridgeToVideoJob } from "../domain/topic-to-video-bridge"
import { bridgeToAudioJob, estimateAudioCredits } from "../domain/topic-to-audio-bridge"
import { bridgeToContentInputs } from "../domain/topic-to-content-bridge"

// ============================================================
// INPUT / OUTPUT
// ============================================================

export interface DispatchProductionInput {
  readonly brief: TopicProductionBrief
}

export interface DispatchProductionResult {
  readonly mediaPlan: MediaPlan
  readonly totalEstimatedCredits: number
  readonly jobsSummary: {
    readonly imageJobs: number
    readonly videoJobs: number
    readonly audioJobs: number
    readonly contentJobs: number
  }
}

// ============================================================
// USE-CASE
// ============================================================

/**
 * Lập kế hoạch sản xuất từ TopicProductionBrief.
 *
 * Bước 1: Sinh narrative arcs cho mỗi topic
 * Bước 2: Build content briefs
 * Bước 3: Lập media plan (chưa dispatch thật — chỉ lên kế hoạch)
 *
 * Dispatch thật sẽ được thực hiện sau khi user xác nhận media plan.
 */
export function planProduction(
  input: DispatchProductionInput,
): DispatchProductionResult {
  const { brief } = input
  const items: MediaPlanItem[] = []
  let totalCredits = 0
  let imageJobs = 0
  let videoJobs = 0
  let audioJobs = 0
  let contentJobs = 0

  for (const topic of brief.selectedTopics) {
    // 1. Sinh Narrative Arc
    const arc = planNarrativeArc({
      mode: brief.mode,
      topic,
      productContext: brief.productContext,
      targetDurationSeconds: brief.targetVideoDurationSeconds ?? 30,
    })

    // 2. Build Content Briefs
    const briefs = buildTopicContentBriefs(brief, topic, arc.scenes)

    // 3. Plan Image Jobs
    if (brief.mode === "CREATIVE") {
      const variantJobs = bridgeToVariantJobs(
        briefs.imageBrief,
        brief.productContext,
        topic.topicTitle,
      )
      for (const vj of variantJobs) {
        items.push({
          assetType: "IMAGE_VARIANT",
          topicId: topic.topicId,
          priority: 1,
          status: "PLANNED",
          description: `Ảnh biến thể scene ${vj.sceneIndex}: ${vj.sceneConfig.preset}`,
          targetPlatform: "all",
        })
        imageJobs++
        totalCredits += 5 // 5 credit/variant
      }
    } else {
      // AUTHENTIC: crop local (0 credit)
      for (const crop of briefs.imageBrief.cropRequests) {
        items.push({
          assetType: "IMAGE_CROP",
          topicId: topic.topicId,
          priority: 1,
          status: "PLANNED",
          description: `Crop ảnh gốc ${crop.ratio} cho ${crop.platform}`,
          targetPlatform: crop.platform as MediaPlanItem["targetPlatform"],
        })
        imageJobs++
      }
    }

    // 4. Plan Video Job
    items.push({
      assetType: brief.productContext.sourceVideoUrl ? "VIDEO_OVERLAY" : "VIDEO_STORY",
      topicId: topic.topicId,
      priority: 2,
      status: "PLANNED",
      description: brief.mode === "AUTHENTIC"
        ? `Video ảnh gốc + voice + nhạc (${arc.totalDurationSeconds}s)`
        : `Video cốt truyện ${arc.scenes.length} cảnh (${arc.totalDurationSeconds}s)`,
      targetPlatform: "all",
    })
    videoJobs++
    totalCredits += 10 // 10 credit/video

    // 5. Plan Audio Job
    const audioCredits = estimateAudioCredits(briefs.audioBrief)
    items.push({
      assetType: "AUDIO_MIX",
      topicId: topic.topicId,
      priority: 2,
      status: "PLANNED",
      description: `Voice + BGM phối (${arc.scenes.length} cảnh, ${briefs.audioBrief.voiceId})`,
      targetPlatform: "all",
    })
    audioJobs++
    totalCredits += audioCredits

    // 6. Plan Content Jobs
    const contentInputs = bridgeToContentInputs(briefs.contentBrief, brief.productContext, {
      title: topic.topicTitle,
      angle: topic.topicAngle,
      hook: topic.topicHook,
      cta: topic.topicCta,
      emotionalTone: topic.topicEmotionalTone,
    })
    for (const ci of contentInputs) {
      items.push({
        assetType: "CONTENT_CAPTION",
        topicId: topic.topicId,
        priority: 3,
        status: "PLANNED",
        description: `Caption ${ci.platform} (${brief.mode === "AUTHENTIC" ? "chân thật" : "viral"})`,
        targetPlatform: ci.platform,
      })
      contentJobs++
      totalCredits += 1 // 1 credit/caption
    }
  }

  return {
    mediaPlan: {
      briefId: `brief-${Date.now()}`,
      mode: brief.mode,
      items,
      estimatedCredits: totalCredits,
      estimatedTimeMinutes: estimateProductionTime(items),
    },
    totalEstimatedCredits: totalCredits,
    jobsSummary: {
      imageJobs,
      videoJobs,
      audioJobs,
      contentJobs,
    },
  }
}

// ============================================================
// HELPERS
// ============================================================

function estimateProductionTime(items: readonly MediaPlanItem[]): number {
  let minutes = 0
  for (const item of items) {
    switch (item.assetType) {
      case "IMAGE_VARIANT": minutes += 2; break    // ~2 phút/variant
      case "IMAGE_CROP": minutes += 0.1; break     // Gần tức thì
      case "VIDEO_STORY": minutes += 5; break      // ~5 phút/video
      case "VIDEO_OVERLAY": minutes += 3; break    // ~3 phút
      case "AUDIO_MIX": minutes += 1; break        // ~1 phút
      case "AUDIO_VOICEOVER": minutes += 0.5; break
      case "CONTENT_CAPTION": minutes += 0.5; break
      case "CONTENT_POST": minutes += 1; break
      default: minutes += 1
    }
  }
  return Math.ceil(minutes)
}
