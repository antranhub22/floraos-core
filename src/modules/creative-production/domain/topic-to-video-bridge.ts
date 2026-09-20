/**
 * Topic → Video Bridge — Map VideoBrief → CreateVideoJobUseCaseInput.
 *
 * Cả AUTHENTIC và CREATIVE đều tạo video, nhưng khác nhau:
 * - AUTHENTIC: ảnh gốc + Ken Burns nhẹ + voice + nhạc
 * - CREATIVE: ảnh biến thể + transition effects phong phú + voice sáng tạo
 *
 * Thuần TypeScript — Zero external dependencies.
 * Output khớp 100% input contract của Video Studio (M04c).
 */

import type { VideoBrief, VideoSceneBrief } from "./content-brief-builder"
import type { ProductContext, VideoMotionEffect, TransitionEffect } from "./production-types"

// ============================================================
// M04c INPUT CONTRACT (từ src/modules/video-studio/)
// ============================================================

/**
 * Contract đầu vào cho M04c Video Studio.
 * Tham chiếu: src/modules/video-studio/use-cases/create-video-job.ts
 */
export interface VideoJobInput {
  /** Thông tin sản phẩm */
  readonly productInfo: {
    readonly name: string
    readonly category: string
  }
  /** Khuôn video */
  readonly videoFormat: "9:16" | "1:1" | "16:9"
  /** Tổng thời lượng (giây) */
  readonly totalDurationSeconds: number
  /** Voice code cho TTS */
  readonly voiceCode: string
  /** Tên track nhạc nền */
  readonly musicTrack: string | null
  /** Phong cách phụ đề */
  readonly subtitleStyle: string
  /** Danh sách cảnh */
  readonly scenes: readonly VideoSceneInput[]
  /** Topic metadata */
  readonly topicId: string
  readonly topicTitle: string
  /** Mode sản xuất */
  readonly productionMode: "AUTHENTIC" | "CREATIVE"
}

export interface VideoSceneInput {
  /** Thứ tự cảnh */
  readonly sceneIndex: number
  /** URL ảnh cho cảnh này */
  readonly imageUrl: string
  /** Script giọng đọc */
  readonly voiceScript: string
  /** Caption overlay */
  readonly textOverlay: string
  /** Thời lượng (giây) */
  readonly durationSeconds: number
  /** Hiệu ứng chuyển động */
  readonly motionEffect: VideoMotionEffect
  /** Hiệu ứng chuyển cảnh */
  readonly transitionEffect: TransitionEffect
}

// ============================================================
// BRIDGE FUNCTION
// ============================================================

/**
 * Map VideoBrief → VideoJobInput.
 *
 * Cần resolvedImageUrls: map từ sceneIndex → URL ảnh thực tế.
 * - AUTHENTIC: tất cả scene dùng sourceImageUrl gốc
 * - CREATIVE: mỗi scene dùng URL ảnh biến thể đã sinh xong
 *
 * @param videoBrief — từ content-brief-builder
 * @param productCtx — carry-forward context
 * @param resolvedImageUrls — Map<sceneIndex, imageUrl>
 * @param topicTitle — để ghi vào metadata
 */
export function bridgeToVideoJob(
  videoBrief: VideoBrief,
  productCtx: ProductContext,
  resolvedImageUrls: ReadonlyMap<number, string>,
  topicTitle: string,
): VideoJobInput {
  const scenes: VideoSceneInput[] = videoBrief.scenes.map((s) => {
    // AUTHENTIC: luôn dùng ảnh gốc
    // CREATIVE: dùng ảnh biến thể (fallback ảnh gốc nếu chưa sinh)
    const imageUrl =
      s.imageSource === "original"
        ? productCtx.sourceImageUrl
        : (resolvedImageUrls.get(s.sceneIndex) ?? productCtx.sourceImageUrl)

    return {
      sceneIndex: s.sceneIndex,
      imageUrl,
      voiceScript: s.voiceScript,
      textOverlay: s.textOverlay,
      durationSeconds: s.durationSeconds,
      motionEffect: s.motionEffect,
      transitionEffect: s.transitionEffect,
    }
  })

  // Phong cách phụ đề phân nhánh theo mode
  const subtitleStyle =
    videoBrief.mode === "AUTHENTIC" ? "MINIMAL_ELEGANT" : "MODERN_BADGE"

  // Map voice ID → voice code (Video Studio dùng voice code legacy)
  const voiceCode = mapVoiceIdToCode(videoBrief.voiceId)

  // Map music mood → track name (Video Studio dùng track name legacy)
  const musicTrack = mapMusicMoodToTrack(videoBrief.musicMood)

  return {
    productInfo: {
      name: productCtx.commercialPassport.productName,
      category: productCtx.commercialPassport.category,
    },
    videoFormat: videoBrief.videoFormat,
    totalDurationSeconds: videoBrief.totalDurationSeconds,
    voiceCode,
    musicTrack,
    subtitleStyle,
    scenes,
    topicId: videoBrief.topicId,
    topicTitle,
    productionMode: videoBrief.mode,
  }
}

// ============================================================
// HELPERS
// ============================================================

function mapVoiceIdToCode(voiceId: string): string {
  const map: Record<string, string> = {
    "flora-nu-truyen-cam": "nova",
    "flora-nam-am-ap": "onyx",
    "flora-nu-tre-trung": "shimmer",
    "flora-nam-nang-dong": "echo",
    "flora-nu-chuyen-nghiep": "alloy",
    "flora-nam-ke-chuyen": "fable",
  }
  return map[voiceId] ?? "nova"
}

function mapMusicMoodToTrack(mood: string): string | null {
  const map: Record<string, string> = {
    romantic: "Romantic Piano Melody",
    warm: "Acoustic Warm Guitar",
    upbeat: "Upbeat Cheerful Pop",
    chill: "Lo-Fi Chill Beats",
    luxury: "Romantic Piano Melody",
    none: "",
  }
  const track = map[mood]
  return track || null
}
