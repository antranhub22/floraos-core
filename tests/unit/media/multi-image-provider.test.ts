import { describe, it, expect } from "vitest"
import { MultiImageProviderRouter } from "@/modules/media/adapters/multi-image-provider-router"
import { PhotoroomImageProvider } from "@/modules/media/adapters/photoroom-image-provider"
import { GoogleImagenImageProvider } from "@/modules/media/adapters/google-imagen-image-provider"
import { FalFluxImageProvider } from "@/modules/media/adapters/fal-flux-image-provider"

// JPEG tối giản hợp lệ (magic bytes FF D8) cho test
function createMinimalJpeg(): Uint8Array {
  const base64 =
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkS" +
    "Ew8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJ" +
    "CQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy" +
    "MjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf" +
    "/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAA" +
    "AAAAAAAAAAA//aAAwDAQACEQMRAD8AKwA//9k="
  const binaryStr = atob(base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return bytes
}

describe("MultiImageProviderRouter & Adapters", () => {
  it("khởi tạo đầy đủ các provider con", () => {
    const router = new MultiImageProviderRouter()

    const photoroom = router.getProvider("photoroom")!
    expect(photoroom).toBeInstanceOf(PhotoroomImageProvider)
    expect(photoroom.name).toBe("photoroom")

    const imagen = router.getProvider("google_imagen")!
    expect(imagen).toBeInstanceOf(GoogleImagenImageProvider)
    expect(imagen.name).toBe("google_imagen")

    const fal = router.getProvider("fal_flux")!
    expect(fal).toBeInstanceOf(FalFluxImageProvider)
    expect(fal.name).toBe("fal_flux")
  })

  it("Photoroom throw lỗi rõ ràng khi không có API key", async () => {
    // Sau khi bỏ mock, Photoroom throw ngay khi thiếu API key — đây là behavior đúng.
    const photoroom = new PhotoroomImageProvider({ apiKey: undefined })

    await expect(
      photoroom.edit({
        imageRef: { assetId: "ast-01", storageKey: "org/test/img.jpg" },
        prompt: "A luxury studio background",
        aspectRatio: "1:1",
      })
    ).rejects.toThrow("Thiếu API key")
  })

  it("Google Imagen throw lỗi rõ ràng khi không có imageBytes", async () => {
    const imagen = new GoogleImagenImageProvider({ apiKey: "fake-key" })

    await expect(
      imagen.edit({
        imageRef: { assetId: "ast-02", storageKey: "org/test/img2.jpg" },
        prompt: "A modern scandinavian background",
      })
    ).rejects.toThrow("imageBytes")
  })

  it("Fal FLUX throw lỗi rõ ràng khi không có imageBytes", async () => {
    const fal = new FalFluxImageProvider({ apiKey: "fake-key" })

    await expect(
      fal.edit({
        imageRef: { assetId: "ast-03", storageKey: "org/test/img3.jpg" },
        prompt: "Dramatic evening light in flower boutique",
      })
    ).rejects.toThrow("imageBytes")
  })

  it("router fallback đến studio_local khi các provider cloud đều thiếu key/bytes", { timeout: 15_000 }, async () => {
    // Tất cả provider cloud đều throw (thiếu API key hoặc imageBytes).
    // studio_local không cần key → luôn thành công → router fallback đến nó.
    const FAKE_JPEG = createMinimalJpeg()
    const router = new MultiImageProviderRouter({
      defaultProvider: "photoroom",
      fallbackChain: ["photoroom", "google_imagen", "fal_flux", "studio_local"],
    })

    const result = await router.edit({
      imageRef: { assetId: "ast-04", storageKey: "org/test/flower.jpg" },
      prompt: "A clean minimalist studio setting",
      aspectRatio: "1:1",
      imageBytes: FAKE_JPEG,
    })

    expect(result).toBeDefined()
    // studio_local trả lại imageBytes gốc (bảo tồn pixel) → bytes hợp lệ
    expect(result.bytes instanceof Uint8Array).toBe(true)
    if (result.bytes instanceof Uint8Array) {
      expect(result.bytes.length).toBeGreaterThan(0)
    }
    expect(router.lastUsedProvider).toBe("studio_local")
  })
})
