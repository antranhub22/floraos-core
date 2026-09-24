import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { readIdempotencyKey } from "@/modules/jobs/domain/idempotency"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { MAX_VOICE_SCRIPT_LENGTH } from "@/modules/audio-studio/domain/audio-task-rules"
import { createAudioJob } from "@/modules/audio-studio/use-cases/create-audio-job"

const postSchema = z.object({
  taskType: z.enum(["VOICEOVER", "MUSIC_SELECT", "AUDIO_MIX", "VOICE_CLONE"]).optional(),
  scenes: z
    .array(
      z.object({
        sceneIndex: z.number().int().min(0).max(20),
        voiceScript: z.string().max(MAX_VOICE_SCRIPT_LENGTH),
        targetDurationSeconds: z.number().positive().max(60),
      })
    )
    .max(12),
  totalDurationSeconds: z.number().positive().max(300).optional(),
  voiceId: z.string().max(80).optional(),
  voiceCloneId: z.string().uuid().optional(),
  // `google_cloud` (worker chưa có) và `local_fallback` (macOS `say`) bị loại
  // khỏi bản thương mại từ 24/09/2026 — use-case trả 422 nếu nhận.
  providerKey: z.enum(["openai", "elevenlabs", "minimax", "edge_tts", "google_cloud", "local_fallback"]).optional(),
  qualityTier: z.enum(["standard", "hd", "premium"]).optional(),
  musicTrackId: z.string().max(80).optional(),
  musicMood: z.enum(["romantic", "upbeat", "chill", "warm", "luxury", "none"]).optional(),
  topicAngleCategory: z.string().max(60).optional(),
})

/**
 * `POST /api/v1/audio/jobs` (`I1`) — tạo job `audio.generate`.
 * 24/09/2026: bốn loại tác vụ ra kết quả khác nhau thật; credit trừ theo bảng
 * `audio-pricing-guard.ts` (MUSIC_SELECT = 0). Xem IO Spec §4.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")

  const idempotencyKey = readIdempotencyKey(request)
  if (!idempotencyKey) {
    throw validationFailed({ "idempotency-key": "Bắt buộc trên mọi endpoint tạo job (YC-U7)" })
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const d = parsed.data

  const calculatedDuration =
    d.totalDurationSeconds ?? Math.max(1, d.scenes.reduce((sum, s) => sum + s.targetDurationSeconds, 0))

  const result = await createAudioJob(ctx, {
    taskType: d.taskType,
    scenes: d.scenes,
    totalDurationSeconds: calculatedDuration,
    voiceId: d.voiceId,
    voiceCloneId: d.voiceCloneId,
    providerKey: d.providerKey,
    qualityTier: d.qualityTier,
    musicTrackId: d.musicTrackId,
    musicMood: d.musicMood,
    topicAngleCategory: d.topicAngleCategory,
    idempotencyKey,
  })

  return jsonResponse(result, { status: 201 })
})
