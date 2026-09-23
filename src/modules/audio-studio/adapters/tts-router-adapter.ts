/**
 * TTS Router Adapter — Điều phối TTS qua chuỗi fallback đa nhà cung cấp.
 *
 * Triển khai TTS Router: thử provider ưu tiên trước,
 * nếu lỗi thì duyệt chuỗi fallback cho đến khi thành công.
 *
 * Adapter layer — ĐƯỢC PHÉP import SDK nhà cung cấp.
 * Business logic (use-cases) chỉ gọi qua ITtsProvider port.
 */

import type {
  ITtsProvider,
  TtsGenerateInput,
  TtsGenerateOutput,
  TtsRouterConfig,
} from "../domain/tts-provider-port"
import type { TtsProviderKey } from "../domain/audio-types"
import { DEFAULT_TTS_ROUTER_CONFIG } from "../domain/tts-provider-port"

// ============================================================
// TTS ROUTER — Điều phối + Fallback
// ============================================================

export class TtsRouterAdapter implements ITtsProvider {
  readonly providerKey: TtsProviderKey = "openai" // Logical key

  private readonly providers: Map<TtsProviderKey, ITtsProvider>
  private readonly config: TtsRouterConfig

  constructor(
    providers: ITtsProvider[],
    config: TtsRouterConfig,
  ) {
    this.providers = new Map(providers.map((p) => [p.providerKey, p]))
    this.config = config
  }

  async isAvailable(): Promise<boolean> {
    // Router sẵn sàng nếu ít nhất 1 provider sẵn sàng
    for (const key of [this.config.preferredProvider, ...this.config.fallbackChain]) {
      const provider = this.providers.get(key)
      if (provider) {
        const avail = await provider.isAvailable()
        if (avail) return true
      }
    }
    return false
  }

  async generate(input: TtsGenerateInput): Promise<TtsGenerateOutput> {
    const errors: Array<{ provider: TtsProviderKey; error: string }> = []

    // Thử preferred provider trước
    const chain = [this.config.preferredProvider, ...this.config.fallbackChain]

    for (const key of chain) {
      const provider = this.providers.get(key)
      if (!provider) continue

      try {
        const available = await provider.isAvailable()
        if (!available) {
          errors.push({ provider: key, error: "Provider not available" })
          continue
        }

        const result = await provider.generate(input)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push({ provider: key, error: message })
        console.warn(`[TtsRouter] Provider ${key} thất bại: ${message}`)
        continue
      }
    }

    throw new Error(
      `[TtsRouter] Tất cả TTS providers đều thất bại: ${JSON.stringify(errors)}`
    )
  }

  listVoices(): string[] {
    const voices = new Set<string>()
    for (const provider of this.providers.values()) {
      for (const v of provider.listVoices()) {
        voices.add(v)
      }
    }
    return [...voices]
  }

  /**
   * Thử sinh voice từ một provider cụ thể (bỏ qua fallback chain).
   * Dùng khi user chỉ định provider chính xác.
   */
  async generateWithProvider(
    providerKey: TtsProviderKey,
    input: TtsGenerateInput,
  ): Promise<TtsGenerateOutput> {
    const provider = this.providers.get(providerKey)
    if (!provider) {
      throw new Error(`[TtsRouter] Provider "${providerKey}" chưa được đăng ký`)
    }

    const available = await provider.isAvailable()
    if (!available) {
      throw new Error(`[TtsRouter] Provider "${providerKey}" không khả dụng`)
    }

    return provider.generate(input)
  }
}

// ============================================================
// INDIVIDUAL PROVIDER ADAPTERS
// ============================================================

/**
 * OpenAI TTS Adapter — tts-1 / tts-1-hd.
 */
export class OpenAiTtsAdapter implements ITtsProvider {
  readonly providerKey: TtsProviderKey = "openai"

  async isAvailable(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY
  }

  async generate(input: TtsGenerateInput): Promise<TtsGenerateOutput> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("OPENAI_API_KEY missing")

    const model = input.qualityTier === "hd" ? "tts-1-hd" : "tts-1"

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice: input.providerVoiceCode || "nova",
        input: input.text,
        speed: input.speed ?? 1.0,
        response_format: "mp3",
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI TTS API error: ${response.status} ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    return {
      audioBytes: new Uint8Array(buffer),
      mimeType: "audio/mpeg",
      providerKey: "openai",
      modelVersion: model,
    }
  }

  listVoices(): string[] {
    return ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
  }
}

/**
 * ElevenLabs TTS Adapter — multilingual_v2.
 */
export class ElevenLabsTtsAdapter implements ITtsProvider {
  readonly providerKey: TtsProviderKey = "elevenlabs"

  async isAvailable(): Promise<boolean> {
    return !!process.env.ELEVENLABS_API_KEY
  }

  async generate(input: TtsGenerateInput): Promise<TtsGenerateOutput> {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing")

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${input.providerVoiceCode}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: input.text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    return {
      audioBytes: new Uint8Array(buffer),
      mimeType: "audio/mpeg",
      providerKey: "elevenlabs",
      modelVersion: "eleven_multilingual_v2",
    }
  }

  listVoices(): string[] {
    return ["Rachel", "Domi", "Bella", "Antoni", "Elli", "Josh", "Arnold", "Adam", "Sam"]
  }
}

/**
 * MiniMax TTS Adapter.
 */
export class MiniMaxTtsAdapter implements ITtsProvider {
  readonly providerKey: TtsProviderKey = "minimax"

  async isAvailable(): Promise<boolean> {
    return !!process.env.MINIMAX_API_KEY && !!process.env.MINIMAX_GROUP_ID
  }

  async generate(input: TtsGenerateInput): Promise<TtsGenerateOutput> {
    const apiKey = process.env.MINIMAX_API_KEY
    const groupId = process.env.MINIMAX_GROUP_ID
    if (!apiKey || !groupId) throw new Error("MINIMAX_API_KEY / MINIMAX_GROUP_ID missing")

    const response = await fetch(
      `https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "speech-01-turbo",
          text: input.text,
          voice_setting: {
            voice_id: input.providerVoiceCode || "male-qn-qingse",
            speed: input.speed ?? 1.0,
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: "mp3",
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.status} ${response.statusText}`)
    }

    const json = await response.json() as { data?: { audio?: string } }
    const audioBase64 = json.data?.audio
    if (!audioBase64) throw new Error("MiniMax returned no audio data")

    const buffer = Buffer.from(audioBase64, "base64")

    return {
      audioBytes: new Uint8Array(buffer),
      mimeType: "audio/mpeg",
      providerKey: "minimax",
      modelVersion: "speech-01-turbo",
    }
  }

  listVoices(): string[] {
    return ["male-qn-qingse", "female-shaonv", "female-yujie", "male-qn-jingying"]
  }
}

/**
 * Edge TTS Adapter — Miễn phí, dùng edge-tts CLI hoặc HTTP.
 * Chạy trên Python worker (không gọi từ TypeScript).
 * Adapter này chỉ đánh dấu availability cho router.
 */
export class EdgeTtsFallbackAdapter implements ITtsProvider {
  readonly providerKey: TtsProviderKey = "edge_tts"

  async isAvailable(): Promise<boolean> {
    // Edge TTS chạy trên Python worker, luôn sẵn sàng khi worker chạy
    return true
  }

  async generate(_input: TtsGenerateInput): Promise<TtsGenerateOutput> {
    // Edge TTS được xử lý ở Python worker, không gọi từ TypeScript
    throw new Error(
      "[EdgeTts] Edge TTS xử lý ở Python audio worker, không gọi từ TypeScript. " +
      "Đặt providerKey='edge_tts' trong AudioJobInput để worker Python xử lý."
    )
  }

  listVoices(): string[] {
    return ["vi-VN-HoaiMyNeural", "vi-VN-NamMinhNeural"]
  }
}

// ============================================================
// FACTORY — Tạo router với các provider có sẵn
// ============================================================

export function createDefaultTtsRouter(): TtsRouterAdapter {

  const providers: ITtsProvider[] = [
    new OpenAiTtsAdapter(),
    new ElevenLabsTtsAdapter(),
    new MiniMaxTtsAdapter(),
    new EdgeTtsFallbackAdapter(),
  ]

  return new TtsRouterAdapter(providers, DEFAULT_TTS_ROUTER_CONFIG)
}
