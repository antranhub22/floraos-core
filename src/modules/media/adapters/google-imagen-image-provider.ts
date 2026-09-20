/**
 * Google Gemini Image Provider — Adapter kết nối Google Gemini API cho chỉnh sửa ảnh.
 *
 * Chức năng:
 * - Gửi ảnh gốc + prompt → nhận ảnh đã chỉnh sửa bối cảnh từ Gemini 2.0 Flash.
 * - Bảo toàn chủ thể hoa nguyên vẹn, chỉ thay đổi phông nền.
 *
 * Cổng: Implements ImageProvider (src/core/ports/image-provider.ts).
 *
 * KHÔNG CÓ MOCK — mọi lỗi đều throw rõ ràng để router fallback hoặc user biết.
 */

import type { ImageProvider, ImageGenerationInput, ImageEditInput } from "@/core/ports/image-provider"
import type { ProviderMedia } from "@/core/ports/shared-media"

export interface GoogleImagenConfig {
  readonly apiKey?: string | undefined
  readonly model?: string | undefined
  readonly timeoutMs?: number | undefined
}

export class GoogleImagenImageProvider implements ImageProvider {
  readonly name = "google_imagen"
  readonly modelVersion: string

  private readonly apiKey: string | undefined
  private readonly timeoutMs: number

  constructor(config?: GoogleImagenConfig) {
    this.apiKey = config?.apiKey || process.env.GOOGLE_VERTEX_API_KEY || process.env.GEMINI_API_KEY
    this.modelVersion = config?.model || "gemini-2.5-flash-image"
    this.timeoutMs = config?.timeoutMs || 30_000
  }

  async generate(input: ImageGenerationInput): Promise<ProviderMedia> {
    if (!this.apiKey) {
      throw new Error(
        "[GoogleImagenImageProvider] Thiếu API key. " +
        "Đặt GEMINI_API_KEY hoặc GOOGLE_VERTEX_API_KEY trong .env"
      )
    }

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelVersion}:generateContent?key=${this.apiKey}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input.prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const body = await res.text().catch(() => "")
        throw new Error(
          `[GoogleImagenImageProvider] API lỗi ${res.status}: ${body.slice(0, 300)}`
        )
      }

      const data = await res.json() as GeminiGenerateResponse
      const imageBytes = extractImageFromResponse(data)

      return {
        bytes: imageBytes,
        mimeType: "image/png",
        modelVersion: this.modelVersion,
        costUsd: 0.03,
        providerFlags: { generative_fill_used: true },
      }
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  async edit(input: ImageEditInput): Promise<ProviderMedia> {
    if (!this.apiKey) {
      throw new Error(
        "[GoogleImagenImageProvider] Thiếu API key. " +
        "Đặt GEMINI_API_KEY hoặc GOOGLE_VERTEX_API_KEY trong .env"
      )
    }

    if (!input.imageBytes || input.imageBytes.length === 0) {
      throw new Error(
        "[GoogleImagenImageProvider] Không có imageBytes — " +
        "cần truyền ảnh gốc thật dạng Uint8Array vào input.imageBytes"
      )
    }

    // Chuyển imageBytes sang base64 để gửi qua Gemini API
    const base64Image = Buffer.from(input.imageBytes).toString("base64")

    // Xác định MIME type từ magic bytes
    const mimeType = detectMimeType(input.imageBytes)

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelVersion}:generateContent?key=${this.apiKey}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
              {
                text: input.prompt,
              },
            ],
          }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const body = await res.text().catch(() => "")
        throw new Error(
          `[GoogleImagenImageProvider] API lỗi ${res.status}: ${body.slice(0, 500)}`
        )
      }

      const data = await res.json() as GeminiGenerateResponse
      const imageBytes = extractImageFromResponse(data)

      return {
        bytes: imageBytes,
        mimeType: "image/png",
        modelVersion: this.modelVersion,
        costUsd: 0.04,
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
          `[GoogleImagenImageProvider] Timeout sau ${this.timeoutMs}ms`
        )
      }
      throw err
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        inlineData?: { mimeType: string; data: string }
      }>
    }
  }>
  error?: { message: string; code: number }
}

function extractImageFromResponse(data: GeminiGenerateResponse): Uint8Array {
  if (data.error) {
    throw new Error(
      `[GoogleImagenImageProvider] Gemini API error: ${data.error.message} (code ${data.error.code})`
    )
  }

  const parts = data.candidates?.[0]?.content?.parts
  if (!parts || parts.length === 0) {
    throw new Error(
      "[GoogleImagenImageProvider] Gemini API không trả về content parts nào"
    )
  }

  // Tìm phần chứa inlineData (ảnh)
  const imagePart = parts.find((p) => p.inlineData?.data)
  if (!imagePart?.inlineData?.data) {
    // Log text parts nếu có để debug
    const textParts = parts.filter((p) => p.text).map((p) => p.text).join(" | ")
    throw new Error(
      `[GoogleImagenImageProvider] Gemini API không trả về ảnh. ` +
      `Text response: "${textParts.slice(0, 200)}"`
    )
  }

  const binaryStr = atob(imagePart.inlineData.data)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  if (bytes.length < 100) {
    throw new Error(
      `[GoogleImagenImageProvider] Ảnh trả về quá nhỏ (${bytes.length} bytes) — ` +
      `có thể API trả text thay vì ảnh`
    )
  }

  return bytes
}

function detectMimeType(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png"
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "image/webp"
  return "image/jpeg"
}
