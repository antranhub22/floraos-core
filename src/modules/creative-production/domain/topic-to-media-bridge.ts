/**
 * Topic → Media Bridge — Map TopicContentBriefs → CreativeStudioJobInput.
 *
 * Chỉ CREATIVE mode mới gọi M04b (ảnh biến thể).
 * AUTHENTIC mode xuất ImageCropRequest[] (crop gốc, không qua AI).
 *
 * Thuần TypeScript — Zero external dependencies.
 * Đảm bảo output khớp 100% với input contract của M04b.
 */

import type { TopicContentBriefs, ImageBrief, ImageVariantRequest } from "./content-brief-builder"
import type { ProductContext } from "./production-types"

// ============================================================
// M04b INPUT CONTRACT (từ src/modules/media/)
// ============================================================

/**
 * Contract đầu vào cho M04b Creative Studio.
 * Tham chiếu: src/modules/media/use-cases/execute-cloud-creative.ts
 */
export interface VariantJobInput {
  /** Ảnh gốc (Data URL hoặc storage URL) */
  readonly sourceImage: string
  /** Storage key ảnh gốc */
  readonly sourceImageStorageKey?: string | undefined
  /** Passport sản phẩm */
  readonly productPassport: {
    readonly productName: string
    readonly category: string
    readonly style: string
    readonly components: readonly string[]
    readonly colors: readonly string[]
  }
  /** Preset bối cảnh */
  readonly sceneConfig: {
    readonly preset: string
    readonly lighting: string
    readonly surface: string
    readonly backgroundColor?: string | undefined
  }
  /** Cấu hình visual story */
  readonly visualStoryConfig?: {
    readonly cameraAngle?: string | undefined
    readonly includeHuman?: boolean | undefined
  } | undefined
  /** Topic metadata */
  readonly topicId: string
  readonly topicTitle: string
  readonly beat: string
  readonly sceneIndex: number
}

// ============================================================
// BRIDGE FUNCTION
// ============================================================

/**
 * Map ImageBrief → VariantJobInput[] (chỉ cho CREATIVE mode).
 *
 * Output: mảng VariantJobInput[] — mỗi phần tử = 1 ảnh biến thể cần sinh.
 * Truyền thẳng sang enqueueJob("media.variant").
 */
export function bridgeToVariantJobs(
  imageBrief: ImageBrief,
  productCtx: ProductContext,
  topicTitle: string,
): readonly VariantJobInput[] {
  // AUTHENTIC mode: không gọi M04b
  if (imageBrief.mode === "AUTHENTIC") {
    return []
  }

  // CREATIVE mode: 1 request = 1 variant job
  return imageBrief.variantRequests.map((req) =>
    mapVariantRequest(req, productCtx, imageBrief.topicId, topicTitle)
  )
}

function mapVariantRequest(
  req: ImageVariantRequest,
  ctx: ProductContext,
  topicId: string,
  topicTitle: string,
): VariantJobInput {
  return {
    sourceImage: ctx.sourceImageUrl,
    sourceImageStorageKey: ctx.sourceImageStorageKey,
    productPassport: {
      productName: ctx.commercialPassport.productName,
      category: ctx.commercialPassport.category,
      style: ctx.commercialPassport.style,
      components: ctx.commercialPassport.components,
      colors: ctx.commercialPassport.colors,
    },
    sceneConfig: {
      preset: req.preset,
      lighting: req.lighting,
      surface: req.surface,
    },
    topicId,
    topicTitle,
    beat: req.beat,
    sceneIndex: req.sceneIndex,
  }
}

/**
 * Đếm số lượng variant jobs cần sinh.
 * Dùng để tính credit trước khi dispatch.
 */
export function countVariantJobs(briefs: readonly TopicContentBriefs[]): number {
  return briefs.reduce(
    (sum, b) => sum + b.imageBrief.variantRequests.length,
    0
  )
}
