/**
 * Topic → Content Bridge — Map ContentBrief → Dữ liệu sinh caption/posts.
 *
 * Cả AUTHENTIC và CREATIVE đều cần content — khác tone:
 * - AUTHENTIC: voice chân thật, gần gũi, giữ nguyên ảnh gốc
 * - CREATIVE: voice năng lượng, hook mạnh, ảnh AI biến thể
 *
 * Thuần TypeScript — Zero external dependencies.
 */

import type { ContentBrief, CaptionRequest } from "./content-brief-builder"
import type { ProductContext } from "./production-types"

// ============================================================
// CONTENT ENGINE INPUT CONTRACT
// ============================================================

/**
 * Đầu vào cho Content Generation Engine.
 * Sẽ được gửi tới AI để sinh caption thực tế.
 */
export interface ContentGenerationInput {
  /** Nền tảng */
  readonly platform: "facebook" | "tiktok" | "instagram" | "zalo"
  /** Mode sản xuất (ảnh hưởng tone) */
  readonly mode: "AUTHENTIC" | "CREATIVE"
  /** Thông tin sản phẩm */
  readonly product: {
    readonly name: string
    readonly category: string
    readonly style: string
    readonly components: readonly string[]
    readonly colors: readonly string[]
    readonly priceRange?: string | undefined
    readonly occasions?: readonly string[] | undefined
  }
  /** Thông tin topic */
  readonly topic: {
    readonly title: string
    readonly angle: string
    readonly hook: string
    readonly cta: string
    readonly emotionalTone: string
  }
  /** Yêu cầu caption */
  readonly captionSpec: {
    readonly tone: string
    readonly maxLength: number
    readonly hashtags: readonly string[]
  }
}

/**
 * Đầu ra sau khi AI sinh caption.
 */
export interface ContentGenerationOutput {
  readonly platform: string
  readonly caption: string
  readonly hashtags: readonly string[]
  readonly callToAction: string
  /** Ước tính engagement score (0-100) */
  readonly estimatedEngagement?: number | undefined
}

// ============================================================
// BRIDGE FUNCTION
// ============================================================

/**
 * Map ContentBrief → ContentGenerationInput[] (1 per platform).
 *
 * Output: mảng ContentGenerationInput[] — gửi tới AI content generator.
 *
 * @param contentBrief — từ content-brief-builder
 * @param productCtx — carry-forward context
 * @param topicInfo — topic đã chọn
 */
export function bridgeToContentInputs(
  contentBrief: ContentBrief,
  productCtx: ProductContext,
  topicInfo: {
    title: string
    angle: string
    hook: string
    cta: string
    emotionalTone: string
  },
): readonly ContentGenerationInput[] {
  return contentBrief.captionRequests.map((req) =>
    mapCaptionRequest(req, contentBrief, productCtx, topicInfo)
  )
}

function mapCaptionRequest(
  req: CaptionRequest,
  contentBrief: ContentBrief,
  ctx: ProductContext,
  topicInfo: {
    title: string
    angle: string
    hook: string
    cta: string
    emotionalTone: string
  },
): ContentGenerationInput {
  return {
    platform: req.platform,
    mode: contentBrief.mode,
    product: {
      name: ctx.commercialPassport.productName,
      category: ctx.commercialPassport.category,
      style: ctx.commercialPassport.style,
      components: ctx.commercialPassport.components,
      colors: ctx.commercialPassport.colors,
      priceRange: ctx.commercialPassport.priceRange,
      occasions: ctx.commercialPassport.suggestedOccasions,
    },
    topic: topicInfo,
    captionSpec: {
      tone: req.tone,
      maxLength: req.maxLength,
      hashtags: [...contentBrief.hashtagSuggestions],
    },
  }
}

/**
 * Sinh prompt AI cho content generation.
 * Phân nhánh hoàn toàn theo mode.
 */
export function buildContentPrompt(input: ContentGenerationInput): string {
  if (input.mode === "AUTHENTIC") {
    return buildAuthenticPrompt(input)
  }
  return buildCreativePrompt(input)
}

function buildAuthenticPrompt(input: ContentGenerationInput): string {
  return [
    `Viết caption ${input.platform} cho sản phẩm hoa "${input.product.name}".`,
    `Phong cách: Chân thật, gần gũi, như lời chia sẻ từ chủ tiệm hoa.`,
    `Tone: ${input.captionSpec.tone}.`,
    `Chủ đề: ${input.topic.title} — ${input.topic.angle}.`,
    `Thành phần hoa: ${input.product.components.join(", ")}.`,
    `Màu sắc: ${input.product.colors.join(", ")}.`,
    input.product.priceRange ? `Giá: ${input.product.priceRange}.` : "",
    `Hook mở đầu gợi ý: "${input.topic.hook}".`,
    `CTA kết thúc: "${input.topic.cta}".`,
    `Hashtags gợi ý: ${input.captionSpec.hashtags.join(" ")}.`,
    `Độ dài tối đa: ${input.captionSpec.maxLength} ký tự.`,
    `QUAN TRỌNG: Không dùng ngôn ngữ quảng cáo. Viết như đang kể chuyện thật.`,
    `Không emoji quá nhiều. Tối đa 2-3 emoji phù hợp.`,
  ].filter(Boolean).join("\n")
}

function buildCreativePrompt(input: ContentGenerationInput): string {
  return [
    `Viết caption ${input.platform} viral cho sản phẩm hoa "${input.product.name}".`,
    `Phong cách: Sáng tạo, năng lượng cao, thu hút người xem cuộn dừng lại.`,
    `Tone: ${input.captionSpec.tone}.`,
    `Chủ đề: ${input.topic.title} — ${input.topic.angle}.`,
    `Thành phần hoa: ${input.product.components.join(", ")}.`,
    `Màu sắc: ${input.product.colors.join(", ")}.`,
    `Hook giật tít: "${input.topic.hook}" — câu đầu tiên phải khiến người xem DỪNG LẠI.`,
    `CTA: "${input.topic.cta}".`,
    `Hashtags: ${input.captionSpec.hashtags.join(" ")}.`,
    `Độ dài tối đa: ${input.captionSpec.maxLength} ký tự.`,
    `YÊU CẦU: Hook mạnh dòng đầu, emoji sinh động, CTA rõ ràng cuối bài.`,
    `Viết cho ${input.platform}: ${getPlatformGuideline(input.platform)}.`,
  ].filter(Boolean).join("\n")
}

function getPlatformGuideline(platform: string): string {
  switch (platform) {
    case "tiktok": return "ngắn gọn, trend-friendly, hashtag trending"
    case "instagram": return "aesthetic, storytelling, carousel-friendly"
    case "facebook": return "dài hơn, community-oriented, share-worthy"
    case "zalo": return "gần gũi, tin nhắn style, giá rõ ràng"
    default: return "general social media"
  }
}
