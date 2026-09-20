import { describe, it, expect, vi } from "vitest"
import type { TenantContext } from "@/core/tenancy"
import { executeCloudCreative } from "@/modules/media/use-cases/execute-cloud-creative"

// Tạo 1x1 JPEG hợp lệ nhỏ nhất (fake nhưng có magic bytes đúng) để test
// Bytes: FF D8 FF E0 ... (JPEG SOI + APP0 marker)
function createMinimalJpeg(): Uint8Array {
  // JPEG tối thiểu: SOI + JFIF APP0 + DQT + SOF0 + DHT + SOS + EOI
  // Dùng một ảnh 1x1 pixel JPEG thật tối giản (285 bytes)
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

const FAKE_JPEG = createMinimalJpeg()

vi.mock("@/modules/assets/infra/asset-repository", () => {
  return {
    AssetRepository: vi.fn().mockImplementation(() => ({
      findById: vi.fn().mockResolvedValue({
        id: "mock-asset-id",
        storage_key: "org/test/product/sample.jpg",
        product_id: "prod-1",
        version: 1,
        mime_type: "image/jpeg",
        metadata: {
          primaryFlowers: [{ name: "Hoa hồng đỏ", quantity: 10, color: "đỏ", role: "chinh" }],
        },
      }),
      create: vi.fn().mockImplementation((_ctx, data) => Promise.resolve({ ...data, id: data.id || "new-asset-1" })),
    })),
  }
})

vi.mock("@/modules/assets/adapters/storage-provider-factory", () => {
  // Tạo JPEG tối giản ở đây thay vì bên ngoài vì vi.mock() được hoisted
  // trước mọi khai báo module-level → FAKE_JPEG chưa khởi tạo kịp.
  const base64 =
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkS" +
    "Ew8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJ" +
    "CQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy" +
    "MjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf" +
    "/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAA" +
    "AAAAAAAAAAA//aAAwDAQACEQMRAD8AKwA//9k="
  const binaryStr = atob(base64)
  const fakeJpeg = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    fakeJpeg[i] = binaryStr.charCodeAt(i)
  }
  return {
    getStorageProvider: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue(fakeJpeg),
      signedUrl: vi.fn().mockResolvedValue("https://storage.floraos.local/sample.jpg"),
      put: vi.fn().mockResolvedValue(undefined),
    }),
  }
})

describe("Decoupled Engine Architecture — Creative Studio Isolation", () => {
  const mockCtx = {
    organizationId: "org-test-1",
    userId: "user-test-1",
    role: "owner",
    permissions: [],
  } as unknown as TenantContext

  it("thực thi Cloud Provider với fallback đến studio_local khi provider cloud thiếu key", async () => {
    // Photoroom, Google Imagen, Fal FLUX đều throw vì thiếu API key (KHÔNG có mock).
    // Router fallback chain kết thúc ở studio_local → thành công với ảnh gốc bảo tồn pixel.
    const result = await executeCloudCreative(mockCtx, {
      assetId: "mock-asset-id",
      taskType: "OPTIMIZE_MASTER",
      providerKey: "photoroom",
      cameraAngle: "front_view",
      humanInteraction: "none",
    })

    expect(result.success).toBe(true)
    // studio_local không dùng generative fill — bảo tồn 100% pixel gốc
    expect(result.provider).toBe("studio_local")
    expect(result.isMock).toBe(false)
  })

  it("thực thi AI Visual Storytelling qua fallback studio_local với góc chụp và người mẫu", async () => {
    // Fal FLUX và các provider cloud khác throw → fallback đến studio_local.
    // Prompt compiler vẫn biên dịch đầy đủ (camera angle + human interaction)
    // ngay cả khi studio_local chỉ trả ảnh gốc.
    const result = await executeCloudCreative(mockCtx, {
      assetId: "mock-asset-id",
      taskType: "GENERATE_SCENE_VARIANT",
      providerKey: "fal",
      cameraAngle: "three_quarter_45",
      humanInteraction: "female_holding",
      targetRatios: ["9:16"],
    })

    expect(result.success).toBe(true)
    // Prompt biên dịch có chứa thông tin camera angle và human interaction
    expect(result.promptSummary?.positivePrompt).toContain("three-quarter")
    expect(result.promptSummary?.positivePrompt).toContain("woman")
  })
})
