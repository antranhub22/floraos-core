/**
 * TTS Provider Port — Giao diện cổng cho các nhà cung cấp Text-to-Speech.
 *
 * Mọi TTS provider (OpenAI, ElevenLabs, MiniMax, Edge TTS, Google Cloud)
 * phải triển khai giao diện này. Business logic KHÔNG gọi thẳng SDK provider
 * mà luôn đi qua cổng (Dependency Inversion — D15).
 *
 * Thuần TypeScript — Zero external dependencies.
 */

import type { TtsProviderKey, AudioQualityTier } from "./audio-types"

// ============================================================
// PORT INTERFACE
// ============================================================

export interface TtsGenerateInput {
  /** Văn bản cần chuyển thành giọng đọc */
  readonly text: string
  /** Mã giọng của provider (ví dụ: "nova" cho OpenAI, "Rachel" cho ElevenLabs) */
  readonly providerVoiceCode: string
  /** Chất lượng */
  readonly qualityTier: AudioQualityTier
  /** Tốc độ đọc (0.5 - 2.0, mặc định 1.0) */
  readonly speed?: number | undefined
  /** Ngôn ngữ */
  readonly language?: string | undefined
}

export interface TtsGenerateOutput {
  /** Dữ liệu âm thanh dạng bytes */
  readonly audioBytes: Uint8Array
  /** MIME type */
  readonly mimeType: "audio/mpeg" | "audio/wav" | "audio/ogg"
  /** Thời lượng thực tế (giây), nếu tính được */
  readonly durationSeconds?: number | undefined
  /** Provider đã dùng */
  readonly providerKey: TtsProviderKey
  /** Model version */
  readonly modelVersion: string
}

/**
 * Giao diện cổng TTS — mọi provider phải triển khai.
 */
export interface ITtsProvider {
  /** Khóa định danh provider */
  readonly providerKey: TtsProviderKey

  /** Kiểm tra provider có sẵn sàng (API key, quota...) */
  isAvailable(): Promise<boolean>

  /** Sinh giọng đọc từ văn bản */
  generate(input: TtsGenerateInput): Promise<TtsGenerateOutput>

  /** Danh sách giọng hỗ trợ */
  listVoices(): string[]
}

// ============================================================
// TTS PROVIDER ROUTER — Chuỗi fallback tự động
// ============================================================

export interface TtsRouterConfig {
  /** Provider ưu tiên */
  readonly preferredProvider: TtsProviderKey
  /** Chuỗi fallback nếu provider ưu tiên lỗi */
  readonly fallbackChain: readonly TtsProviderKey[]
}

/**
 * Cấu hình mặc định cho TTS Router.
 * Ưu tiên: OpenAI → ElevenLabs → MiniMax → Edge TTS → Local Fallback
 */
export const DEFAULT_TTS_ROUTER_CONFIG: TtsRouterConfig = {
  preferredProvider: "openai",
  fallbackChain: ["elevenlabs", "minimax", "edge_tts", "google_cloud", "local_fallback"],
}
