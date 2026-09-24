/**
 * Luật của 4 loại tác vụ Khu vực C (24/09/2026).
 *
 * Trước ngày này worker KHÔNG đọc `taskType`: bấm Voiceover, Music Select,
 * Audio Mix hay Voice Clone đều ra cùng một bản TTS + nhạc, và Voice Clone
 * vẫn trừ credit dù không nhân bản gì. Tệp này chốt mỗi loại cần gì, ra gì
 * và tốn bao nhiêu — cùng một nguồn cho route, use-case và giao diện.
 *
 * Thuần TypeScript — không import hạ tầng.
 */

import type { AudioQualityTier, AudioSceneInput, AudioTaskType, TtsProviderKey } from "./audio-types"
import { calculateAudioCreditCost } from "./audio-pricing-guard"

export interface AudioTaskSpec {
  readonly taskType: AudioTaskType
  readonly label: string
  /** Mô tả ngắn hiện trên thẻ chọn tác vụ. */
  readonly description: string
  /** Có đọc lời thoại (TTS) không. */
  readonly needsVoice: boolean
  /** Có nhạc nền không (bắt buộc với MUSIC_SELECT, tuỳ chọn với VOICE_CLONE). */
  readonly music: "none" | "required" | "optional"
  /** Kết quả ra. */
  readonly output: "voice_only" | "music_only" | "voice_and_music"
}

export const AUDIO_TASK_SPECS: Readonly<Record<AudioTaskType, AudioTaskSpec>> = {
  VOICEOVER: {
    taskType: "VOICEOVER",
    label: "Voiceover",
    description: "Chỉ giọng đọc lời thoại từng cảnh, không nhạc nền.",
    needsVoice: true,
    music: "none",
    output: "voice_only",
  },
  MUSIC_SELECT: {
    taskType: "MUSIC_SELECT",
    label: "Music Select",
    description: "Chọn và cắt nhạc nền đủ thời lượng, không giọng đọc. Miễn phí.",
    needsVoice: false,
    music: "required",
    output: "music_only",
  },
  AUDIO_MIX: {
    taskType: "AUDIO_MIX",
    label: "Audio Mix",
    description: "Giọng đọc + nhạc nền, nhạc tự hạ khi có giọng, chuẩn hoá độ to cho mạng xã hội.",
    needsVoice: true,
    music: "required",
    output: "voice_and_music",
  },
  VOICE_CLONE: {
    taskType: "VOICE_CLONE",
    label: "Voice Clone",
    description: "Đọc lời thoại bằng giọng nhân bản của chủ tiệm (ElevenLabs), nhạc nền tuỳ chọn.",
    needsVoice: true,
    music: "optional",
    output: "voice_and_music",
  },
} as const

export const AUDIO_TASK_TYPES = Object.keys(AUDIO_TASK_SPECS) as AudioTaskType[]

/** Nhà cung cấp người dùng chọn được trong bản thương mại. `local_fallback`
 *  (lệnh `say` của macOS: giọng tiếng Anh đọc tiếng Việt) và `google_cloud`
 *  (worker chưa có) không nằm trong danh sách này. */
export const SELECTABLE_TTS_PROVIDERS: readonly TtsProviderKey[] = ["openai", "elevenlabs", "minimax", "edge_tts"]

/** Nhà cung cấp duy nhất cho giọng nhân bản. */
export const VOICE_CLONE_PROVIDER: TtsProviderKey = "elevenlabs"

export const MAX_VOICE_SCRIPT_LENGTH = 600

/** Câu cam kết bắt buộc trước khi nhân bản giọng — lưu nguyên văn vào `voice_clones.consent_text`. */
export const VOICE_CLONE_CONSENT_TEXT =
  "Tôi xác nhận giọng trong tệp mẫu là giọng của chính tôi, hoặc tôi có sự đồng ý bằng văn bản của người sở hữu giọng, " +
  "cho phép tiệm dùng giọng này để tạo nội dung quảng cáo. Tôi hiểu giọng nhân bản chỉ được dùng trong tổ chức này."

/** Giới hạn tệp mẫu giọng (ElevenLabs IVC nhận tới ~10MB/tệp; mẫu tốt 1–3 phút). */
export const VOICE_SAMPLE_MIN_BYTES = 50 * 1024
export const VOICE_SAMPLE_MAX_BYTES = 10 * 1024 * 1024
/** Giới hạn tệp nhạc tiệm tự tải. */
export const MUSIC_UPLOAD_MAX_BYTES = 20 * 1024 * 1024

export const AUDIO_UPLOAD_MIME_TYPES: Readonly<Record<string, string>> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "m4a",
}

/**
 * Nhận diện tệp âm thanh bằng byte đầu (không tin `Content-Type` của trình
 * duyệt). Trả phần mở rộng hoặc `null` nếu không phải MP3/WAV/M4A.
 */
export function sniffAudioExtension(bytes: Uint8Array): "mp3" | "wav" | "m4a" | null {
  if (bytes.length < 12) return null
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))
  if (ascii(0, 3) === "ID3") return "mp3"
  if (bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0) return "mp3"
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return "wav"
  if (ascii(4, 8) === "ftyp") return "m4a"
  return null
}

export const MUSIC_LICENSE_TYPES = ["owned", "royalty_free", "licensed", "creative_commons"] as const
export type MusicLicenseType = (typeof MUSIC_LICENSE_TYPES)[number]

export const UPLOAD_MUSIC_MOODS = ["romantic", "upbeat", "chill", "warm", "luxury"] as const

/** Mã nhạc: bài hệ thống dùng `trackId` của `music-catalog.ts`; bài tiệm tải dùng `org:<uuid>`. */
export const ORG_TRACK_PREFIX = "org:"

export function isOrgTrackId(trackId: string | null | undefined): trackId is string {
  return typeof trackId === "string" && trackId.startsWith(ORG_TRACK_PREFIX)
}

export function orgTrackUuid(trackId: string): string {
  return trackId.slice(ORG_TRACK_PREFIX.length)
}

/**
 * Ước lượng số giây đọc một câu tiếng Việt ở tốc độ tự nhiên (~ 14 ký tự/giây
 * gồm khoảng trắng, đo trên giọng OpenAI/Edge). Dùng để cảnh báo trước khi
 * gửi: worker không còn tăng tốc giọng lên gấp đôi mà kéo dài cảnh.
 */
export function estimateSpeechSeconds(text: string): number {
  const n = text.trim().length
  if (n === 0) return 0
  return Math.round((n / 14 + 0.4) * 10) / 10
}

export interface AudioTaskValidationInput {
  readonly taskType: AudioTaskType
  readonly scenes: readonly AudioSceneInput[]
  readonly musicTrackId?: string | null | undefined
  readonly voiceCloneId?: string | null | undefined
}

/** Trả danh sách lỗi (trường → thông điệp); rỗng là hợp lệ. */
export function validateAudioTask(input: AudioTaskValidationInput): Record<string, string> {
  const spec = AUDIO_TASK_SPECS[input.taskType]
  const errors: Record<string, string> = {}
  const scripts = input.scenes.filter((s) => s.voiceScript.trim().length > 0)
  if (spec.needsVoice && scripts.length === 0) {
    errors.scenes = "Cần ít nhất một cảnh có lời thoại"
  }
  if (input.scenes.some((s) => s.voiceScript.length > MAX_VOICE_SCRIPT_LENGTH)) {
    errors.voiceScript = `Mỗi lời thoại tối đa ${MAX_VOICE_SCRIPT_LENGTH} ký tự`
  }
  if (spec.music === "required" && !input.musicTrackId) {
    errors.musicTrackId = "Chọn một bài nhạc nền"
  }
  if (input.taskType === "VOICE_CLONE" && !input.voiceCloneId) {
    errors.voiceCloneId = "Chọn giọng nhân bản đã sẵn sàng"
  }
  return errors
}

/**
 * Credit THẬT của một lượt (truyền vào `enqueueJob({ costCredit })`) — đúng
 * bảng `audio-pricing-guard.ts`, quyết định PO 24/09/2026. MUSIC_SELECT = 0,
 * VOICE_CLONE tính theo ElevenLabs, số cảnh = số cảnh CÓ lời thoại.
 */
export function audioJobCreditCost(input: {
  taskType: AudioTaskType
  providerKey: TtsProviderKey
  qualityTier: AudioQualityTier
  scenes: readonly AudioSceneInput[]
}): number {
  const spec = AUDIO_TASK_SPECS[input.taskType]
  if (!spec.needsVoice) return 0
  const provider = input.taskType === "VOICE_CLONE" ? VOICE_CLONE_PROVIDER : input.providerKey
  const sceneCount = input.scenes.filter((s) => s.voiceScript.trim().length > 0).length
  return calculateAudioCreditCost({
    taskType: input.taskType,
    provider,
    qualityTier: input.qualityTier,
    sceneCount,
  }).totalCredits
}
