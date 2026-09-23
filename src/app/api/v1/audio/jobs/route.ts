import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { readIdempotencyKey } from "@/modules/jobs/domain/idempotency"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { createAudioJob } from "@/modules/audio-studio/use-cases/create-audio-job"

const postSchema = z.object({
  taskType: z.enum(["VOICEOVER", "MUSIC_SELECT", "AUDIO_MIX", "VOICE_CLONE"]).optional(),
  scenes: z.array(z.object({
    sceneIndex: z.number().int().min(0),
    voiceScript: z.string(),
    targetDurationSeconds: z.number().positive(),
  })),
  totalDurationSeconds: z.number().positive().optional(),
  voiceId: z.string().optional(),
  providerKey: z.enum(["openai", "elevenlabs", "minimax", "edge_tts", "google_cloud", "local_fallback"]).optional(),
  qualityTier: z.enum(["standard", "hd", "premium"]).optional(),
  musicTrackId: z.string().optional(),
  musicMood: z.enum(["romantic", "upbeat", "chill", "warm", "luxury", "none"]).optional(),
  topicAngleCategory: z.string().optional(),
})

/**
 * `POST /api/v1/audio/jobs` — Tạo job âm thanh Audio Studio.
 *
 * Năng lực: `I1` (sáng tạo nội dung đa phương tiện).
 * Gọi `createAudioJob()` — enqueueJob("audio.generate"), usage ghi ở core.
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

  const calculatedDuration =
    parsed.data.totalDurationSeconds ??
    Math.max(1, parsed.data.scenes.reduce((sum, s) => sum + s.targetDurationSeconds, 0))

  const result = await createAudioJob(ctx, {
    taskType: parsed.data.taskType,
    scenes: parsed.data.scenes,
    totalDurationSeconds: calculatedDuration,
    voiceId: parsed.data.voiceId,
    providerKey: parsed.data.providerKey,
    qualityTier: parsed.data.qualityTier,
    musicTrackId: parsed.data.musicTrackId,
    musicMood: parsed.data.musicMood,
    topicAngleCategory: parsed.data.topicAngleCategory,
    idempotencyKey,
  })

  return jsonResponse(result, { status: 201 })
})