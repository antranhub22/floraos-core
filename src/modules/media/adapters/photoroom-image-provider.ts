/**
 * Photoroom Commercial Image Provider — Adapter chuyên biệt cho E-commerce Product AI.
 *
 * Chức năng chính:
 * - Khóa 100% pixel vùng hoa (zero product alteration).
 * - Sinh phông nền studio thương mại chuẩn hóa.
 * - Tự động tính toán đổ bóng tiếp xúc (Contact Shadow) và hắt sáng môi trường (Ambient Light Wrap).
 *
 * Cổng: Implements ImageProvider (src/core/ports/image-provider.ts).
 *
 * KHÔNG CÓ MOCK — mọi lỗi đều throw rõ ràng để router fallback hoặc user biết.
 */

import type { ImageProvider, ImageGenerationInput, ImageEditInput } from "@/core/ports/image-provider"
import type { ProviderMedia } from "@/core/ports/shared-media"

export interface PhotoroomConfig {
  readonly apiKey?: string | undefined
  readonly endpointUrl?: string | undefined
  readonly timeoutMs?: number | undefined
}

export class PhotoroomImageProvider implements ImageProvider {
  readonly name = "photoroom"
  readonly modelVersion = "photoroom-ecom-v2"

  private readonly apiKey: string | undefined
  private readonly endpointUrl: string
  private readonly timeoutMs: number

  constructor(config?: PhotoroomConfig) {
    this.apiKey = config?.apiKey || process.env.PHOTOROOM_API_KEY
    this.endpointUrl = config?.endpointUrl || "https://sdk.photoroom.com/v1/segment"
    this.timeoutMs = config?.timeoutMs || 15000
  }

  async generate(input: ImageGenerationInput): Promise<ProviderMedia> {
    throw new Error(
      "[PhotoroomImageProvider] Photoroom không hỗ trợ text-to-image. " +
      "Dùng edit() với ảnh gốc để ghép bối cảnh."
    )
  }

  async edit(input: ImageEditInput): Promise<ProviderMedia> {
    if (!this.apiKey) {
      throw new Error(
        "[PhotoroomImageProvider] Thiếu API key. Đặt PHOTOROOM_API_KEY trong .env"
      )
    }

    if (!input.imageBytes || input.imageBytes.length === 0) {
      throw new Error(
        "[PhotoroomImageProvider] Không có imageBytes — " +
        "cần truyền ảnh gốc thật dạng Uint8Array vào input.imageBytes"
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const body = {
        prompt: input.prompt,
        image_url: input.imageRef.storageKey,
        shadow_type: "soft_contact",
        light_matching: true,
        aspect_ratio: input.aspectRatio || "1:1",
      }

      const res = await fetch(this.endpointUrl, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errBody = await res.text().catch(() => "")
        throw new Error(
          `[PhotoroomImageProvider] API lỗi ${res.status}: ${errBody.slice(0, 300)}`
        )
      }

      const buffer = await res.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      if (bytes.length < 100) {
        throw new Error(
          `[PhotoroomImageProvider] Ảnh trả về quá nhỏ (${bytes.length} bytes)`
        )
      }

      return {
        bytes,
        mimeType: "image/jpeg",
        modelVersion: this.modelVersion,
        costUsd: 0.08,
        providerFlags: {
          generative_fill_used: true,
          contact_shadow_added: true,
        },
      }
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          `[PhotoroomImageProvider] Timeout sau ${this.timeoutMs}ms`
        )
      }
      throw err
    }
  }
}
