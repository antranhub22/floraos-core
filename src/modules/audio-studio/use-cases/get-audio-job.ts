import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { AudioJobRepository } from "@/modules/audio-studio/infra/audio-job-repository"

const AUDIO_URL_EXPIRES_IN = 3600

/**
 * `GET /api/v1/audio/jobs/:id` (`I1`) — trạng thái + URL ký có hạn của bản phối
 * (23/09/2026). Trước ngày này Khu vực C chỉ nhận phản hồi lúc TẠO job và
 * không có đường nào đọc kết quả.
 */
export async function getAudioJob(ctx: TenantContext, jobId: string) {
  const job = await new AudioJobRepository().findById(ctx, jobId)
  if (!job) throw notFound()

  const audioUrl = job.mixedAudioStorageKey
    ? await getStorageProvider().signedUrl(job.mixedAudioStorageKey, AUDIO_URL_EXPIRES_IN)
    : null

  return {
    job_id: job.id,
    stage: job.stage,
    task_type: job.taskType,
    voice_id: job.voiceId,
    music_mood: job.musicMood,
    total_duration_seconds: job.totalDurationSeconds,
    audio_url: audioUrl,
    audio_storage_key: job.mixedAudioStorageKey,
    error: job.errorMessage,
    created_at: job.createdAt,
  }
}
