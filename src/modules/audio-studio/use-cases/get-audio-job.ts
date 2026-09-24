import { notFound } from "@/core/http/errors"
import { log } from "@/core/observability/log"
import type { TenantContext } from "@/core/tenancy"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { AudioJobRepository } from "@/modules/audio-studio/infra/audio-job-repository"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { refundJob } from "@/modules/usage/use-cases/refund-job"

const AUDIO_URL_EXPIRES_IN = 3600

/**
 * `GET /api/v1/audio/jobs/:id` (`I1`) — trạng thái + URL ký có hạn của bản phối
 * (23/09/2026).
 *
 * 24/09/2026: thêm nhà cung cấp THẬT đã đọc (`provider_used` — worker có
 * chuỗi lùi, người dùng phải thấy khi giọng bị thay), bản chỉ-giọng, thời
 * lượng thật từng cảnh, nhạc đã dùng; job `FAILED` tự hoàn credit ngay ở lần
 * đọc này (idempotent) thay vì chờ `npm run hoan-credit`.
 */
export async function getAudioJob(ctx: TenantContext, jobId: string) {
  const job = await new AudioJobRepository().findById(ctx, jobId)
  if (!job) throw notFound()

  const raw = await new GenerationJobRepository().findById(ctx, jobId)
  const payload = ((raw?.payload ?? {}) as Record<string, unknown>) || {}
  const output = ((raw?.output ?? {}) as Record<string, unknown>) || {}

  let refunded = false
  if (job.stage === "FAILED") {
    const r = await refundJob(ctx, jobId).catch((err: unknown) => {
      log.warn("audio_job.refund_failed", { job_id: jobId, error: String(err) })
      return null
    })
    refunded = Boolean(r && (r.refunded || r.reason === "da-hoan-truoc-do"))
  }

  const storage = getStorageProvider()
  const audioUrl = job.mixedAudioStorageKey ? await storage.signedUrl(job.mixedAudioStorageKey, AUDIO_URL_EXPIRES_IN) : null
  const voiceOnlyKey = typeof output.voice_only_storage_key === "string" ? output.voice_only_storage_key : null
  const voiceOnlyUrl = voiceOnlyKey ? await storage.signedUrl(voiceOnlyKey, AUDIO_URL_EXPIRES_IN) : null

  const providerKey = (payload.providerKey as string | null | undefined) ?? null
  const providerUsed = (output.provider_used as string | null | undefined) ?? null

  return {
    job_id: job.id,
    stage: job.stage,
    task_type: job.taskType,
    voice_id: (payload.voiceId as string | null | undefined) ?? null,
    voice_display_name: (payload.voiceDisplayName as string | null | undefined) ?? null,
    voice_clone_id: (payload.voiceCloneId as string | null | undefined) ?? null,
    provider_key: providerKey,
    provider_used: providerUsed,
    provider_fallback: Boolean(providerKey && providerUsed && providerUsed !== "none" && providerUsed !== providerKey),
    quality_tier: (payload.qualityTier as string | null | undefined) ?? null,
    music_track_id:
      (payload.musicTrackRef as string | null | undefined) ?? (payload.musicTrackId as string | null | undefined) ?? null,
    music_track_name: (payload.musicTrackName as string | null | undefined) ?? null,
    music_mood: job.musicMood,
    has_voice: Boolean(output.has_voice),
    total_duration_seconds: job.totalDurationSeconds,
    loudness_lufs: (output.loudness_lufs as number | null | undefined) ?? null,
    scenes: (output.scenes as unknown[] | undefined) ?? [],
    audio_url: audioUrl,
    audio_storage_key: job.mixedAudioStorageKey,
    voice_only_url: voiceOnlyUrl,
    voice_only_storage_key: voiceOnlyKey,
    credits_cost: (payload.creditsCost as number | undefined) ?? 0,
    scene_plan_id: (payload.scenePlanId as string | null | undefined) ?? null,
    scene_plan_revision: (payload.scenePlanRevision as number | null | undefined) ?? null,
    refunded,
    error: job.errorMessage,
    created_at: job.createdAt,
  }
}
