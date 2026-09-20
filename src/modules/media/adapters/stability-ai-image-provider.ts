/**
 * Stability AI Image Provider — Adapter kết nối Stability AI REST API v2beta.
 *
 * Chức năng:
 * - Text-to-Image: Sinh ảnh mới từ prompt qua Stable Image Core.
 * - Image Edit (Search & Replace): Thay nền ảnh, giữ nguyên chủ thể hoa.
 *
 * Cổng: Implements ImageProvider (src/core/ports/image-provider.ts).
 *
 * KHÔNG CÓ MOCK — mọi lỗi đều throw rõ ràng để router fallback hoặc user biết.
 */

import type { ImageProvider, ImageGenerationInput, ImageEditInput } from "@/core/ports/image-provider"
import type { ProviderMedia } from "@/core/ports/shared-media"

export interface StabilityAIConfig {
  readonly apiKey?: string | undefined
  readonly timeoutMs?: number | undefined
}

export class StabilityAIImageProvider implements ImageProvider {
  readonly name = "stability_ai"
  readonly modelVersion = "stable-image-core-v2beta"

  private readonly apiKey: string | undefined
  private readonly timeoutMs: number

  constructor(config?: StabilityAIConfig) {
    this.apiKey = config?.apiKey || process.env.STABILITY_API_KEY
    this.timeoutMs = config?.timeoutMs || 60_000
  }

  async generate(input: ImageGenerationInput): Promise<ProviderMedia> {
    if (!this.apiKey) {
      throw new Error(
        "[StabilityAIImageProvider] Thiếu API key. Đặt STABILITY_API_KEY trong .env"
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const endpoint = "https://api.stability.ai/v2beta/stable-image/generate/core"

      // Stability AI v2beta yêu cầu multipart/form-data
      const formData = new FormData()
      formData.append("prompt", input.prompt)
      formData.append("output_format", "png")

      // Map aspect ratio sang format Stability AI hỗ trợ
      const aspectRatio = mapAspectRatio(input.aspectRatio)
      if (aspectRatio) {
        formData.append("aspect_ratio", aspectRatio)
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "image/*",
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const body = await res.text().catch(() => "")
        throw new Error(
          `[StabilityAIImageProvider] API lỗi ${res.status}: ${body.slice(0, 500)}`
        )
      }

      // Response là raw binary image khi Accept: image/*
      const buffer = await res.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      validateImageBytes(bytes)

      return {
        bytes,
        mimeType: "image/png",
        modelVersion: this.modelVersion,
        costUsd: 0.03,
        providerFlags: { generative_fill_used: true },
      }
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          `[StabilityAIImageProvider] Timeout sau ${this.timeoutMs}ms`
        )
      }
      throw err
    }
  }

  async edit(input: ImageEditInput): Promise<ProviderMedia> {
    if (!this.apiKey) {
      throw new Error(
        "[StabilityAIImageProvider] Thiếu API key. Đặt STABILITY_API_KEY trong .env"
      )
    }

    if (!input.imageBytes || input.imageBytes.length === 0) {
      throw new Error(
        "[StabilityAIImageProvider] Không có imageBytes — " +
        "cần truyền ảnh gốc thật dạng Uint8Array vào input.imageBytes"
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      // Sử dụng Image-to-Image qua /generate/sd3 thay vì search-and-replace.
      // search-and-replace chỉ thay nền — KHÔNG THỂ thêm người mẫu hoặc
      // thay đổi bố cục ảnh. Image-to-Image dùng ảnh nguồn làm tham chiếu
      // và sinh ảnh mới hoàn toàn theo prompt (bao gồm cả người mẫu tương tác).
      const endpoint =
        "https://api.stability.ai/v2beta/stable-image/generate/sd3"

      const mimeType = detectMimeType(input.imageBytes)
      const imageBuffer = Buffer.from(input.imageBytes)
      const imageBlob = new Blob([imageBuffer], { type: mimeType })

      const formData = new FormData()
      formData.append("image", imageBlob, `source.${mimeType === "image/png" ? "png" : "jpg"}`)
      formData.append("prompt", input.prompt)
      formData.append("mode", "image-to-image")
      // Tự động điều chỉnh strength theo loại biến thể:
      // - Prompt có "HUMAN INTERACTION:" → cần nhiều thay đổi hơn để thêm người mẫu (0.55)
      // - Prompt chỉ đổi nền → giữ sản phẩm nguyên vẹn tối đa (0.35)
      const hasHuman = input.prompt.includes("HUMAN INTERACTION:")
      const strength = hasHuman ? "0.55" : "0.35"
      formData.append("strength", strength)
      formData.append("output_format", "png")
      formData.append("model", "sd3.5-large")

      // Lưu ý: aspect_ratio KHÔNG ĐƯỢC phép khi mode=image-to-image.
      // Kết quả sẽ theo kích thước ảnh nguồn.

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "image/*",
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const body = await res.text().catch(() => "")
        throw new Error(
          `[StabilityAIImageProvider] API lỗi ${res.status}: ${body.slice(0, 500)}`
        )
      }

      // Response là raw binary image khi Accept: image/*
      const buffer = await res.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      validateImageBytes(bytes)

      return {
        bytes,
        mimeType: "image/png",
        modelVersion: "sd3.5-large-image-to-image",
        costUsd: 0.065,
        providerFlags: {
          generative_fill_used: true,
          subject_preserved: true,
        },
      }
    } catch (err) {
      clearTimeout(timeoutId)
      // KHÔNG nuốt lỗi — throw lên để router fallback sang provider khác
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          `[StabilityAIImageProvider] Timeout sau ${this.timeoutMs}ms`
        )
      }
      throw err
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Map aspect ratio từ format FloraOS sang Stability AI.
 * Stability AI hỗ trợ: 16:9, 1:1, 21:9, 2:3, 3:2, 4:5, 5:4, 9:16, 9:21
 */
function mapAspectRatio(ratio: string): string | undefined {
  const mapping: Record<string, string> = {
    "1:1": "1:1",
    "4:5": "4:5",
    "9:16": "9:16",
    "16:9": "16:9",
    "3:4": "3:4",
    "4:3": "4:3",
    "2:3": "2:3",
    "3:2": "3:2",
    "5:4": "5:4",
  }
  return mapping[ratio]
}

function detectMimeType(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png"
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "image/webp"
  return "image/jpeg"
}

function validateImageBytes(bytes: Uint8Array): void {
  if (bytes.length < 100) {
    throw new Error(
      `[StabilityAIImageProvider] Ảnh trả về quá nhỏ (${bytes.length} bytes) — ` +
      `có thể API trả text thay vì ảnh`
    )
  }

  // Kiểm tra magic bytes
  const isValidImage =
    (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) || // JPEG
    (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) || // PNG
    (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) // WEBP

  if (!isValidImage) {
    // Thử đọc vài byte đầu để debug
    const head = new TextDecoder().decode(bytes.slice(0, 200))
    throw new Error(
      `[StabilityAIImageProvider] Response không phải ảnh hợp lệ. ` +
      `Header: "${head.slice(0, 100)}"`
    )
  }
}
