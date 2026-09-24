import { afterEach, beforeEach, describe, it, expect, vi } from "vitest"
import type { TenantContext } from "@/core/tenancy"
import { executeCloudCreative } from "@/modules/media/use-cases/execute-cloud-creative"

// Tạo 1x1 JPEG hợp lệ nhỏ nhất (fake nhưng có magic bytes đúng) để test
// Bytes: FF D8 FF E0 ... (JPEG SOI + APP0 marker)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Test đơn vị KHÔNG được gọi nhà cung cấp thật: `tests/setup.ts` nạp `.env`
  // của máy dev, có khoá thật thì Stability trả ảnh thật (tốn credit) và ca
  // "mọi nhà cung cấp lỗi" không còn đúng (sự cố 24/09/2026 trên máy anh Tony).
  // Xoá khoá + chặn mạng để chuỗi nhà cung cấp lỗi một cách tất định.
  const PROVIDER_KEYS = [
    "STABILITY_API_KEY",
    "FAL_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_VERTEX_API_KEY",
    "OPENAI_API_KEY",
    "PHOTOROOM_API_KEY",
  ]
  beforeEach(() => {
    for (const k of PROVIDER_KEYS) vi.stubEnv(k, "")
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Mạng bị chặn trong test đơn vị")))
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  // 23/09/2026 — `studio_local` KHÔNG còn trả lại bytes ảnh gốc (bản trước
  // khiến ảnh gốc bị ghi thành "ảnh đã tối ưu"/"biến thể" giống hệt nhau).
  // Hết chuỗi nhà cung cấp cloud thì người gọi nhận LỖI, không nhận ảnh giả.
  it("hết chuỗi nhà cung cấp cloud thì ném lỗi, không trả ảnh gốc giả làm kết quả", async () => {
    await expect(
      executeCloudCreative(mockCtx, {
        assetId: "mock-asset-id",
        taskType: "OPTIMIZE_MASTER",
        providerKey: "photoroom",
        cameraAngle: "front_view",
        humanInteraction: "none",
      })
    ).rejects.toThrow()
  }, 15000)

  it("nhánh Storytelling cũng không lùi về ảnh gốc khi mọi nhà cung cấp lỗi", async () => {
    await expect(
      executeCloudCreative(mockCtx, {
        assetId: "mock-asset-id",
        taskType: "GENERATE_SCENE_VARIANT",
        providerKey: "fal",
        cameraAngle: "three_quarter_45",
        humanInteraction: "female_holding",
        targetRatios: ["9:16"],
      })
    ).rejects.toThrow()
  }, 15000)
})
