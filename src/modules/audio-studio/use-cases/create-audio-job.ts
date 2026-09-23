/**
 * Use-case: Tạo Audio Job — Đưa công việc âm thanh vào hàng đợi.
 *
 * Tuân thủ kiến trúc job: enqueueJob("audio.generate") → Worker Python
 * lấy việc bằng SELECT FOR UPDATE SKIP LOCKED + LISTEN/NOTIFY.
 *
 * Usage ghi ở phía core TẠI ĐIỂM TẠO JOB, không ghi ở worker.
 */

import { type TenantContext } from "@/core/tenancy"
import { requireCapability } from "@/core/rbac/capabilities"
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job"
import type {
  AudioJobInput,
  AudioTaskType,
  TtsProviderKey,
  AudioQualityTier,
  AudioSceneInput,
  MusicMood,
} from "../domain/audio-types"
import { calculateAudioCreditCost } from "../domain/audio-pricing-guard"
import { getVoiceSpec, resolveProviderVoiceCode } from "../domain/voice-catalog"
import { suggestMusicTrack, getMusicTrack, suggestMoodForTopicAngle } from "../domain/music-catalog"

// ============================================================
// INPUT / OUTPUT
// ============================================================

export interface CreateAudioJobInput {
  /** Loại công việc */
  readonly taskType?: AudioTaskType | undefined
  /** Danh sách cảnh cần sinh voice */
  readonly scenes: readonly AudioSceneInput[]
  /** Tổng thời lượng mục tiêu (giây) */
  readonly totalDurationSeconds: number
  /** Voice ID từ SSOT catalog */
  readonly voiceId?: string | undefined
  /** Provider TTS (để tự chọn thì bỏ qua) */
  readonly providerKey?: TtsProviderKey | undefined
  /** Chất lượng */
  readonly qualityTier?: AudioQualityTier | undefined
  /** Track nhạc nền cụ thể */
  readonly musicTrackId?: string | undefined
  /** Mood nhạc nền (auto-select track) */
  readonly musicMood?: MusicMood | undefined
  /** Góc topic (để auto-select mood) */
  readonly topicAngleCategory?: string | undefined
  /** `Idempotency-Key` của client (YC-U7). Bắt buộc: trước 23/09/2026 khoá
   *  sinh phía máy chủ bằng Date.now()+random — bấm đúp là trừ credit hai lần. */
  readonly idempotencyKey: string
}

export interface CreateAudioJobResult {
  readonly jobId: string
  readonly generationJobId: string
  readonly creditsCost: number
  readonly voiceDisplayName: string
  readonly providerKey: TtsProviderKey
  readonly musicTrackName: string | null
  /** Credit THỰC SỰ bị trừ bởi `enqueueJob` (0 khi deduped hoặc dùng thử). */
  readonly usage: { readonly costCredit: number; readonly balanceAfter: number | null }
  readonly deduped: boolean
}

// ============================================================
// USE-CASE
// ============================================================

export async function createAudioJob(
  ctx: TenantContext,
  input: CreateAudioJobInput
): Promise<CreateAudioJobResult> {
  // 1. Kiểm tra quyền sáng tạo nội dung đa phương tiện
  requireCapability(ctx, "I1")

  // 2. Giải quyết voice spec
  const voiceId = input.voiceId ?? "flora-nu-truyen-cam"
  const voiceSpec = getVoiceSpec(voiceId)

  // 3. Giải quyết provider
  const providerKey = input.providerKey ?? voiceSpec.defaultProvider
  const providerVoiceCode = resolveProviderVoiceCode(voiceId, providerKey)

  // 4. Giải quyết quality tier
  const qualityTier = input.qualityTier ?? "standard"

  // 5. Giải quyết nhạc nền
  let musicMood: MusicMood = input.musicMood ?? "warm"
  if (!input.musicMood && input.topicAngleCategory) {
    musicMood = suggestMoodForTopicAngle(input.topicAngleCategory)
  }

  let musicTrackId = input.musicTrackId ?? undefined
  let musicTrackName: string | null = null

  if (musicTrackId) {
    const track = getMusicTrack(musicTrackId)
    musicTrackName = track?.displayName ?? null
  } else if (musicMood !== "none") {
    const suggested = suggestMusicTrack(musicMood)
    if (suggested) {
      musicTrackId = suggested.trackId
      musicTrackName = suggested.displayName
    }
  }

  // 6. Tính credit
  const taskType = input.taskType ?? "AUDIO_MIX"
  const creditEstimate = calculateAudioCreditCost({
    taskType,
    provider: providerKey,
    qualityTier,
    sceneCount: input.scenes.length,
  })

  // 7. Đưa vào hàng đợi generation_jobs
  const idempotencyKey = input.idempotencyKey

  const enqueued = await enqueueJob(ctx, {
    feature: "audio.generate",
    idempotencyKey,
    productId: null,
    payload: {
      taskType,
      scenes: input.scenes.map((s) => ({
        sceneIndex: s.sceneIndex,
        voiceScript: s.voiceScript,
        targetDurationSeconds: s.targetDurationSeconds,
      })),
      totalDurationSeconds: input.totalDurationSeconds,
      voiceId,
      voiceDisplayName: voiceSpec.displayName,
      providerKey,
      providerVoiceCode,
      qualityTier,
      musicTrackId: musicTrackId ?? null,
      musicMood,
      voiceVolume: 1.0,
      bgmDuckingVolume: 0.22,
      bgmNormalVolume: 0.65,
      creditsCost: creditEstimate.totalCredits,
    },
  })

  return {
    jobId: enqueued.job.id,
    generationJobId: enqueued.job.id,
    creditsCost: creditEstimate.totalCredits,
    voiceDisplayName: voiceSpec.displayName,
    providerKey,
    musicTrackName,
    usage: enqueued.usage,
    deduped: enqueued.deduped,
  }
}
