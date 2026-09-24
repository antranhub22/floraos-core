/**
 * Nền tảng đăng → tỉ lệ khung → khuôn video → kênh bài đăng (24/09/2026).
 *
 * Quyết định PO: ảnh/video sinh theo NỀN TẢNG người dùng chọn ở Chặng 05
 * (chỉ chọn TikTok thì chỉ làm dạng TikTok, chỉ chọn YouTube thì chỉ làm dạng
 * YouTube). Hiện tại mặc định 9:16 để tránh sinh nhiều tỉ lệ, nhưng bảng dưới
 * dựng sẵn cấu hình cho mọi tỉ lệ (9:16, 4:5, 1:1, 16:9).
 *
 * Thuần — không import hạ tầng.
 */

export const PUBLISH_PLATFORMS = [
  "tiktok",
  "instagram_reels",
  "facebook_reels",
  "youtube_shorts",
  "zalo_video",
  "youtube",
  "facebook_feed",
  "instagram_feed",
] as const
export type PublishPlatform = (typeof PUBLISH_PLATFORMS)[number]

export const PUBLISH_RATIOS = ["9:16", "4:5", "1:1", "16:9"] as const
export type PublishRatio = (typeof PUBLISH_RATIOS)[number]

/** Khuôn video (khớp enum `video_format` của Prisma). */
export type PublishVideoFormat = "REEL_15S" | "TIKTOK_30S" | "STORY_15S" | "SLIDESHOW" | "PRODUCT_PAGE" | "AD_MOTION"

/** Kênh bài đăng của gói chiến dịch (`PACKAGE_CHANNELS`). */
export type PublishPostChannel = "facebook" | "instagram" | "tiktok" | "zalo"

export interface PlatformSpec {
  readonly platform: PublishPlatform
  readonly label: string
  readonly ratio: PublishRatio
  readonly videoFormat: PublishVideoFormat
  /** Thời lượng video khuyến nghị cho nền tảng (giây). */
  readonly targetSeconds: number
  /** Kênh bài đăng đi kèm (chú thích/caption khi đăng). */
  readonly postChannel: PublishPostChannel | null
}

export const PLATFORM_SPECS: Readonly<Record<PublishPlatform, PlatformSpec>> = {
  tiktok: { platform: "tiktok", label: "TikTok", ratio: "9:16", videoFormat: "TIKTOK_30S", targetSeconds: 20, postChannel: "tiktok" },
  instagram_reels: { platform: "instagram_reels", label: "Instagram Reels", ratio: "9:16", videoFormat: "REEL_15S", targetSeconds: 15, postChannel: "instagram" },
  facebook_reels: { platform: "facebook_reels", label: "Facebook Reels", ratio: "9:16", videoFormat: "REEL_15S", targetSeconds: 15, postChannel: "facebook" },
  youtube_shorts: { platform: "youtube_shorts", label: "YouTube Shorts", ratio: "9:16", videoFormat: "TIKTOK_30S", targetSeconds: 20, postChannel: null },
  zalo_video: { platform: "zalo_video", label: "Zalo Video", ratio: "9:16", videoFormat: "STORY_15S", targetSeconds: 15, postChannel: "zalo" },
  youtube: { platform: "youtube", label: "YouTube (ngang)", ratio: "16:9", videoFormat: "SLIDESHOW", targetSeconds: 20, postChannel: null },
  facebook_feed: { platform: "facebook_feed", label: "Facebook Feed", ratio: "4:5", videoFormat: "SLIDESHOW", targetSeconds: 15, postChannel: "facebook" },
  instagram_feed: { platform: "instagram_feed", label: "Instagram Feed", ratio: "4:5", videoFormat: "SLIDESHOW", targetSeconds: 15, postChannel: "instagram" },
}

/** Mặc định hiện tại (PO 24/09): video dọc 9:16 cho TikTok + Reels. */
export const DEFAULT_PLATFORMS: readonly PublishPlatform[] = ["tiktok", "instagram_reels", "facebook_reels"]
export const DEFAULT_RATIO: PublishRatio = "9:16"

export function isPublishPlatform(v: unknown): v is PublishPlatform {
  return typeof v === "string" && (PUBLISH_PLATFORMS as readonly string[]).includes(v)
}

export interface PublishingPlan {
  readonly platforms: readonly PublishPlatform[]
  /** Tỉ lệ khung SINH ẢNH + VIDEO. */
  readonly aspectRatio: PublishRatio
  readonly videoFormat: PublishVideoFormat
  /** Thời lượng video mục tiêu (giây). */
  readonly targetSeconds: number
  /** Kênh bài đăng cần viết (theo nền tảng đã chọn, không trùng). */
  readonly postChannels: readonly PublishPostChannel[]
  /** Nền tảng đã chọn nhưng khác tỉ lệ chính — chưa sinh (cấu hình sẵn cho sau này). */
  readonly otherRatios: readonly { platform: PublishPlatform; ratio: PublishRatio }[]
}

/**
 * Suy phương án đăng từ nền tảng đã chọn: cùng một tỉ lệ thì dùng tỉ lệ đó;
 * nhiều tỉ lệ thì ưu tiên 9:16 (mặc định hiện tại), không có 9:16 thì tỉ lệ
 * của nền tảng đầu tiên. Thời lượng = ngắn nhất trong các nền tảng cùng tỉ lệ
 * (một video dùng được cho mọi nền tảng đó).
 */
export function resolvePublishing(input: readonly unknown[] | null | undefined): PublishingPlan {
  const picked = Array.from(new Set((input ?? []).filter(isPublishPlatform)))
  const platforms = picked.length > 0 ? picked : [...DEFAULT_PLATFORMS]
  const ratios = Array.from(new Set(platforms.map((p) => PLATFORM_SPECS[p].ratio)))
  const aspectRatio: PublishRatio =
    ratios.length === 1 ? ratios[0]! : ratios.includes(DEFAULT_RATIO) ? DEFAULT_RATIO : PLATFORM_SPECS[platforms[0]!].ratio
  const main = platforms.filter((p) => PLATFORM_SPECS[p].ratio === aspectRatio).map((p) => PLATFORM_SPECS[p])
  const shortest = main.reduce((a, b) => (b.targetSeconds < a.targetSeconds ? b : a))
  const postChannels = Array.from(
    new Set(platforms.map((p) => PLATFORM_SPECS[p].postChannel).filter((c): c is PublishPostChannel => c !== null))
  )
  return {
    platforms,
    aspectRatio,
    videoFormat: shortest.videoFormat,
    targetSeconds: shortest.targetSeconds,
    postChannels: postChannels.length > 0 ? postChannels : ["facebook"],
    otherRatios: platforms
      .filter((p) => PLATFORM_SPECS[p].ratio !== aspectRatio)
      .map((p) => ({ platform: p, ratio: PLATFORM_SPECS[p].ratio })),
  }
}
