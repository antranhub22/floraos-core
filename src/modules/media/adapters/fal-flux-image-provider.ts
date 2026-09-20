/**
 * Fal.ai FLUX Image-to-Image Provider — Adapter xử lý thẩm mỹ cao cấp.
 *
 * Chức năng:
 * - FLUX.1 Dev Image-to-Image: Chỉnh sửa phông nền dựa trên prompt.
 * - Gửi ảnh gốc dạng base64 data URL, nhận ảnh mới thật từ Fal API.
 *
 * Cổng: Implements ImageProvider (src/core/ports/image-provider.ts).
 *
 * KHÔNG CÓ MOCK — mọi lỗi đều throw rõ ràng để router fallback hoặc user biết.
 */

import type { ImageProvider, ImageGenerationInput, ImageEditInput } from "@/core/ports/image-provider"
import type { ProviderMedia } from "@/core/ports/shared-media"

export interface FalFluxConfig {
  readonly apiKey?: string | undefined
  readonly timeoutMs?: number | undefined
}

export class FalFluxImageProvider implements ImageProvider {
  readonly name = "fal_flux"
  readonly modelVersion = "fal-ai/flux/dev/image-to-image"

  private readonly apiKey: string | undefined
  private readonly timeoutMs: number

  constructor(config?: FalFluxConfig) {
    this.apiKey = config?.apiKey || process.env.FAL_KEY
    this.timeoutMs = config?.timeoutMs || 60_000
  }

  async generate(input: ImageGenerationInput): Promise<ProviderMedia> {
    if (!this.apiKey) {
      throw new Error(
        "[FalFluxImageProvider] Thiếu API key. Đặt FAL_KEY trong .env"
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const endpoint = "https://fal.run/fal-ai/flux/dev"

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Key ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input.prompt,
          image_size: mapAspectRatio(input.aspectRatio),
          num_images: 1,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const body = await res.text().catch(() => "")
        throw new Error(
          `[FalFluxImageProvider] API lỗi ${res.status}: ${body.slice(0, 300)}`
        )
      }

      const data = await res.json() as FalResponse
      const imageBytes = await downloadFalImage(data)

      return {
        bytes: imageBytes,
        mimeType: "image/jpeg",
        modelVersion: this.modelVersion,
        costUsd: 0.035,
        providerFlags: { generative_fill_used: true },
      }
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`[FalFluxImageProvider] Timeout sau ${this.timeoutMs}ms`)
      }
      throw err
    }
  }

  async edit(input: ImageEditInput): Promise<ProviderMedia> {
    if (!this.apiKey) {
      throw new Error(
        "[FalFluxImageProvider] Thiếu API key. Đặt FAL_KEY trong .env"
      )
    }

    if (!input.imageBytes || input.imageBytes.length === 0) {
      throw new Error(
        "[FalFluxImageProvider] Không có imageBytes — " +
        "cần truyền ảnh gốc thật dạng Uint8Array vào input.imageBytes"
      )
    }

    // Chuyển imageBytes sang base64 data URL để gửi qua Fal API
    const mimeType = detectMimeType(input.imageBytes)
    const base64Image = Buffer.from(input.imageBytes).toString("base64")
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const endpoint = "https://fal.run/fal-ai/flux/dev/image-to-image"

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Key ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input.prompt,
          image_url: dataUrl,
          strength: 0.75,
          num_images: 1,
          image_size: mapAspectRatio(input.aspectRatio ?? "1:1"),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const body = await res.text().catch(() => "")
        throw new Error(
          `[FalFluxImageProvider] API lỗi ${res.status}: ${body.slice(0, 500)}`
        )
      }

      const data = await res.json() as FalResponse
      const imageBytes = await downloadFalImage(data)

      return {
        bytes: imageBytes,
        mimeType: "image/jpeg",
        modelVersion: this.modelVersion,
        costUsd: 0.045,
        providerFlags: {
          generative_fill_used: true,
          ic_light_relighting: true,
        },
      }
    } catch (err) {
      clearTimeout(timeoutId)
      // KHÔNG nuốt lỗi — throw lên để router fallback sang provider khác
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`[FalFluxImageProvider] Timeout sau ${this.timeoutMs}ms`)
      }
      throw err
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface FalResponse {
  images?: Array<{ url: string; content_type?: string }>
  error?: string
}

async function downloadFalImage(data: FalResponse): Promise<Uint8Array> {
  if (data.error) {
    throw new Error(`[FalFluxImageProvider] Fal API error: ${data.error}`)
  }

  const outputUrl = data.images?.[0]?.url
  if (!outputUrl) {
    throw new Error(
      "[FalFluxImageProvider] Fal API không trả về URL ảnh kết quả. " +
      `Response: ${JSON.stringify(data).slice(0, 300)}`
    )
  }

  // Tải ảnh kết quả từ URL Fal CDN
  const imgRes = await fetch(outputUrl)
  if (!imgRes.ok) {
    throw new Error(
      `[FalFluxImageProvider] Không tải được ảnh kết quả từ ${outputUrl}: ${imgRes.status}`
    )
  }

  const buffer = await imgRes.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (bytes.length < 100) {
    throw new Error(
      `[FalFluxImageProvider] Ảnh kết quả quá nhỏ (${bytes.length} bytes) — ` +
      `có thể Fal API trả về response rỗng`
    )
  }

  return bytes
}

function mapAspectRatio(ratio: string): string {
  const mapping: Record<string, string> = {
    "1:1": "square",
    "4:5": "portrait_4_3",
    "9:16": "portrait_16_9",
    "16:9": "landscape_16_9",
    "3:4": "portrait_4_3",
    "4:3": "landscape_4_3",
  }
  return mapping[ratio] || "square"
}

function detectMimeType(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png"
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "image/webp"
  return "image/jpeg"
}
