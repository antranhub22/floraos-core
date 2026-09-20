/**
 * Multi Image Provider Router — Điều phối và phân luồng nhiều Provider AI xử lý ảnh.
 *
 * Cho phép linh hoạt chuyển đổi giữa:
 * 1. Photoroom (E-commerce chuẩn hóa, shadow tự nhiên)
 * 2. Google Imagen 3 (Độ nét cao, không gian rộng)
 * 3. Fal.ai FLUX + IC-Light (Thẩm mỹ cao cấp, hắt sáng môi trường)
 *
 * Cung cấp cơ chế tự động Fallback bảo vệ hệ thống (Aegis Resource Protection).
 * Ghi log cảnh báo khi provider lỗi và chuyển sang provider tiếp theo.
 */

import type { ImageProvider, ImageGenerationInput, ImageEditInput } from "@/core/ports/image-provider"
import type { ProviderMedia } from "@/core/ports/shared-media"
import { PhotoroomImageProvider } from "./photoroom-image-provider"
import { GoogleImagenImageProvider } from "./google-imagen-image-provider"
import { FalFluxImageProvider } from "./fal-flux-image-provider"
import { StudioLocalImageProvider } from "./studio-local-image-provider"
import { OpenAIImageProvider } from "./openai-image-provider"
import { StabilityAIImageProvider } from "./stability-ai-image-provider"

export type SupportedImageProviderKey =
  | "photoroom"
  | "google_imagen"
  | "fal_flux"
  | "studio_local"
  | "openai"
  | "stability_ai"

export interface MultiProviderRouterOptions {
  readonly defaultProvider?: SupportedImageProviderKey
  readonly fallbackChain?: readonly SupportedImageProviderKey[]
}

export interface ProviderRouterResult extends ProviderMedia {
  /** Provider nào đã thật sự trả kết quả thành công. */
  readonly usedProvider: SupportedImageProviderKey
  /** `true` nếu kết quả là mock/placeholder (provider không có API key). */
  readonly isMock: boolean
}

/** Nhận diện response mock: bytes quá nhỏ hoặc chứa chuỗi đánh dấu MOCK_. */
function detectMock(media: ProviderMedia): boolean {
  if (!media.bytes) return true
  if (!(media.bytes instanceof Uint8Array)) return false
  if (media.bytes.length < 100) return true
  try {
    const head = new TextDecoder().decode(media.bytes.slice(0, 40))
    if (head.includes("MOCK_")) return true
  } catch { /* binary — không phải mock text */ }
  return false
}

export class MultiImageProviderRouter implements ImageProvider {
  readonly name = "multi_provider_router"
  readonly modelVersion = "floraos-router-v1"

  /** Provider cuối cùng đã trả kết quả thành công (dùng cho ghi log/audit). */
  lastUsedProvider: SupportedImageProviderKey | null = null
  /** `true` nếu lần `edit`/`generate` gần nhất trả về mock response. */
  lastResultIsMock = false

  private readonly providers: Map<SupportedImageProviderKey, ImageProvider>
  private readonly defaultProviderKey: SupportedImageProviderKey
  private readonly fallbackChain: readonly SupportedImageProviderKey[]

  constructor(options?: MultiProviderRouterOptions) {
    this.defaultProviderKey = options?.defaultProvider || "fal_flux"
    this.fallbackChain = options?.fallbackChain || [
      "fal_flux",
      "stability_ai",
      "google_imagen",
      "photoroom",
      "studio_local",
    ]

    this.providers = new Map()
    this.providers.set("photoroom", new PhotoroomImageProvider())
    this.providers.set("google_imagen", new GoogleImagenImageProvider())
    this.providers.set("fal_flux", new FalFluxImageProvider())
    this.providers.set("studio_local", new StudioLocalImageProvider())
    this.providers.set("openai", new OpenAIImageProvider())
    this.providers.set("stability_ai", new StabilityAIImageProvider())
  }

  getProvider(key: SupportedImageProviderKey): ImageProvider | undefined {
    return this.providers.get(key)
  }

  async generate(input: ImageGenerationInput, targetProvider?: SupportedImageProviderKey): Promise<ProviderMedia> {
    const key = targetProvider || this.defaultProviderKey
    const provider = this.getProvider(key)
    if (!provider) throw new Error(`Provider "${key}" not found`)
    const result = await provider.generate(input)
    this.lastUsedProvider = key
    this.lastResultIsMock = detectMock(result)
    return result
  }

  async edit(input: ImageEditInput, targetProvider?: SupportedImageProviderKey): Promise<ProviderMedia> {
    const primaryKey = targetProvider || this.defaultProviderKey
    // Xây chuỗi fallback: provider được chọn đứng đầu, còn lại theo thứ tự ưu tiên
    const chain = [primaryKey, ...this.fallbackChain.filter((k) => k !== primaryKey)]

    let lastError: Error | null = null
    const triedProviders: string[] = []

    for (const key of chain) {
      const provider = this.providers.get(key)
      if (!provider) continue

      try {
        const result = await provider.edit(input)
        this.lastUsedProvider = key
        this.lastResultIsMock = detectMock(result)

        if (triedProviders.length > 0) {
          console.warn(
            `[MultiImageProviderRouter] Fallback thành công: ${key}. ` +
            `Đã thử trước đó: ${triedProviders.join(" → ")} (đều lỗi).`
          )
        }

        return result
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        triedProviders.push(key)
        console.warn(
          `[MultiImageProviderRouter] Provider "${key}" lỗi: ${lastError.message}. ` +
          `Chuyển sang provider tiếp theo trong chuỗi fallback...`
        )
      }
    }

    this.lastUsedProvider = null
    this.lastResultIsMock = false
    throw lastError || new Error(
      `Toàn bộ ${chain.length} provider trong chuỗi fallback đều thất bại: ${chain.join(" → ")}`
    )
  }
}
