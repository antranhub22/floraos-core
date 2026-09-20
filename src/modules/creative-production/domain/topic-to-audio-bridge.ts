/**
 * Topic → Audio Bridge — Map AudioBrief → AudioJobInput.
 *
 * Cả AUTHENTIC và CREATIVE đều cần Audio — khác tone:
 * - AUTHENTIC: giọng ấm, chậm rãi, nhạc acoustic/piano
 * - CREATIVE: giọng năng động, tiết tấu nhanh, nhạc upbeat
 *
 * Thuần TypeScript — Zero external dependencies.
 * Output khớp 100% input contract của Audio Studio.
 */

import type { AudioBrief } from "./content-brief-builder"
import type {
  AudioJobInput,
  AudioSceneInput,
  TtsProviderKey,
  AudioQualityTier,
  MusicMood,
} from "@/modules/audio-studio/domain/audio-types"

// ============================================================
// BRIDGE FUNCTION
// ============================================================

/**
 * Map AudioBrief → AudioJobInput.
 *
 * Truyền thẳng sang createAudioJob() use-case.
 *
 * @param audioBrief — từ content-brief-builder
 * @param organizationId — tenant isolation
 * @param providerKey — TTS provider (để tự chọn thì bỏ qua)
 * @param qualityTier — chất lượng audio
 */
export function bridgeToAudioJob(
  audioBrief: AudioBrief,
  organizationId: string,
  providerKey?: TtsProviderKey,
  qualityTier?: AudioQualityTier,
): AudioJobInput {
  const scenes: AudioSceneInput[] = audioBrief.scenes.map((s) => ({
    sceneIndex: s.sceneIndex,
    voiceScript: s.voiceScript,
    targetDurationSeconds: s.targetDurationSeconds,
  }))

  // Resolve music mood
  const musicMood = resolveMusicMood(audioBrief.musicMood, audioBrief.mode)

  return {
    organizationId,
    taskType: "AUDIO_MIX",
    scenes,
    totalDurationSeconds: audioBrief.totalDurationSeconds,
    voiceId: audioBrief.voiceId,
    providerKey,
    qualityTier: qualityTier ?? (audioBrief.mode === "CREATIVE" ? "hd" : "standard"),
    musicMood,
    // Âm lượng phân nhánh theo mode
    voiceVolume: 1.0,
    bgmDuckingVolume: audioBrief.mode === "AUTHENTIC" ? 0.18 : 0.25,
    bgmNormalVolume: audioBrief.mode === "AUTHENTIC" ? 0.55 : 0.70,
  }
}

/**
 * Tính credit dự kiến cho audio job.
 */
export function estimateAudioCredits(audioBrief: AudioBrief): number {
  // Base: 1 credit/scene cho OpenAI standard
  // CREATIVE hd = 2x credit
  const perScene = audioBrief.mode === "CREATIVE" ? 2 : 1
  return audioBrief.scenes.length * perScene
}

// ============================================================
// HELPERS
// ============================================================

function resolveMusicMood(briefMood: string, mode: "AUTHENTIC" | "CREATIVE"): MusicMood {
  const moodMap: Record<string, MusicMood> = {
    romantic: "romantic",
    warm: "warm",
    upbeat: "upbeat",
    chill: "chill",
    luxury: "luxury",
    none: "none",
  }

  const resolved = moodMap[briefMood]
  if (resolved) return resolved

  // Auto-select dựa trên mode
  return mode === "AUTHENTIC" ? "warm" : "upbeat"
}
