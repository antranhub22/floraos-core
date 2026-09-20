/**
 * Domain Types: Creative Production Pipeline.
 *
 * Cầu nối giữa Chặng 04 (IDEATE — 10 Topics) → Sản xuất Media.
 * Hai loại hình: AUTHENTIC (mộc/chân thật) vs CREATIVE (AI biến hóa).
 *
 * Thuần TypeScript — Zero external dependencies.
 */

// ============================================================
// 1. PRODUCTION MODE — Xuyên suốt mọi nhóm sản xuất
// ============================================================

/** Loại hình sản xuất — User chọn TRƯỚC khi bắt đầu */
export type ProductionMode = "AUTHENTIC" | "CREATIVE"

// ============================================================
// 2. NARRATIVE ARC — Cung truyện kết nối bối cảnh
// ============================================================

/** Nhịp kịch bản trong cung truyện */
export type NarrativeBeat =
  | "SETUP"       // Mở đầu, giới thiệu
  | "RISING"      // Phát triển, khám phá
  | "CLIMAX"      // Cao trào, điểm nhấn
  | "RESOLUTION"  // Kết, cảm xúc
  | "CTA"         // Kêu gọi hành động

/** Hiệu ứng chuyển động ảnh (dùng chung với Video Studio) */
export type VideoMotionEffect =
  | "zoom_in"
  | "zoom_out"
  | "pan_left"
  | "pan_right"
  | "pan_up"
  | "static"

/** Hiệu ứng chuyển cảnh */
export type TransitionEffect =
  | "fade"
  | "slide_left"
  | "slide_right"
  | "dissolve"
  | "wipe"
  | "none"

/** Tỷ lệ crop ảnh */
export type CropRatio = "1:1" | "4:5" | "9:16" | "16:9" | "3:4"

// ============================================================
// 3. SCENE SPEC — Đặc tả từng cảnh
// ============================================================

/**
 * Hiệu ứng nhẹ cho AUTHENTIC mode — giữ ảnh gốc, chỉ thêm overlay.
 */
export interface AuthenticSceneEffect {
  /** Tỷ lệ crop ảnh */
  readonly cropRatio: CropRatio
  /** Hiệu ứng Ken Burns nhẹ */
  readonly motionEffect: VideoMotionEffect
  /** Text overlay (giá, badge, CTA) */
  readonly overlayText?: string | undefined
  /** Vị trí overlay */
  readonly overlayPosition?: "top" | "bottom" | "center" | undefined
  /** Badge thương hiệu */
  readonly showBrandBadge?: boolean | undefined
  /** Hiện giá */
  readonly showPrice?: boolean | undefined
}

/**
 * Cấu hình bối cảnh mới cho CREATIVE mode — truyền sang M04b.
 */
export interface CreativeSceneConfig {
  /** Preset bối cảnh */
  readonly preset: string
  /** Ánh sáng */
  readonly lighting: string
  /** Bề mặt */
  readonly surface: string
  /** Màu nền chủ đạo */
  readonly backgroundColor?: string | undefined
  /** Phong cách visual */
  readonly visualStyle?: string | undefined
}

/**
 * Đặc tả một cảnh trong cung truyện.
 */
export interface NarrativeSceneSpec {
  /** Thứ tự cảnh (1-indexed) */
  readonly sceneIndex: number
  /** Nhịp kịch bản */
  readonly beat: NarrativeBeat
  /** Tiêu đề nhịp */
  readonly beatTitle: string
  /** Mô tả bối cảnh */
  readonly sceneDescription: string

  // ── Chung cho cả 2 mode ──
  /** Script giọng đọc — khớp với hình ảnh cảnh này */
  readonly voiceScript: string
  /** Caption overlay trên video */
  readonly textOverlay: string
  /** Thời lượng cảnh (giây) */
  readonly durationSeconds: number
  /** Hiệu ứng chuyển cảnh */
  readonly transitionEffect: TransitionEffect
  /** Hiệu ứng chuyển động */
  readonly motionEffect: VideoMotionEffect
  /** Kết nối sang cảnh tiếp theo */
  readonly connectionToNext: string

  // ── AUTHENTIC mode: hiệu ứng nhẹ trên ảnh gốc ──
  readonly authenticEffect?: AuthenticSceneEffect | undefined

  // ── CREATIVE mode: bối cảnh mới cho M04b ──
  readonly creativeConfig?: CreativeSceneConfig | undefined
}

// ============================================================
// 4. NARRATIVE ARC OUTPUT — Kết quả sinh cung truyện
// ============================================================

export interface NarrativeArcOutput {
  /** Topic ID đã chọn */
  readonly topicId: string
  /** Tiêu đề topic */
  readonly topicTitle: string
  /** Loại hình sản xuất */
  readonly mode: ProductionMode
  /** Tone cảm xúc */
  readonly emotionalTone: string
  /** AI giải thích lý do chọn cung truyện */
  readonly narrativeReasoning: string
  /** Danh sách cảnh (3–5 cảnh tùy mode) */
  readonly scenes: readonly NarrativeSceneSpec[]
  /** Tổng thời lượng dự kiến (giây) */
  readonly totalDurationSeconds: number
}

// ============================================================
// 5. TOPIC PRODUCTION BRIEF — Đầu vào cho pipeline sản xuất
// ============================================================

/**
 * Carry-forward từ Chặng 01–04: tất cả dữ liệu cần thiết.
 */
export interface ProductContext {
  /** Ảnh gốc (Base64 Data URL hoặc storage URL) */
  readonly sourceImageUrl: string
  /** Storage key ảnh gốc */
  readonly sourceImageStorageKey?: string | undefined
  /** Passport thương mại (từ Chặng 02 UNDERSTAND) */
  readonly commercialPassport: {
    readonly productName: string
    readonly category: string
    readonly style: string
    readonly components: readonly string[]
    readonly colors: readonly string[]
    readonly priceRange?: string | undefined
    readonly targetAudience?: string | undefined
    readonly suggestedOccasions?: readonly string[] | undefined
  }
  /** Video gốc (nếu user upload video) */
  readonly sourceVideoUrl?: string | undefined
  /** Thời lượng video gốc (giây) */
  readonly sourceVideoDurationSeconds?: number | undefined
}

/**
 * Topic đã chọn từ Chặng 04 (IDEATE).
 */
export interface SelectedTopicInfo {
  readonly topicId: string
  readonly topicTitle: string
  readonly topicAngle: string
  readonly topicCategory: string
  readonly topicHook: string
  readonly topicCta: string
  readonly topicEmotionalTone: string
  /** Từ khóa nghiên cứu liên quan */
  readonly researchKeywords?: readonly string[] | undefined
  /** Trend score (từ Chặng 03 DISCOVER) */
  readonly trendScore?: number | undefined
}

/**
 * Topic Production Brief — Đầu vào chính cho Creative Production Pipeline.
 *
 * Từ brief này, pipeline sẽ sinh ra tất cả tài sản marketing:
 * - Ảnh (biến thể hoặc crop gốc)
 * - Video (cốt truyện hoặc ảnh gốc + voice)
 * - Audio (voice + nhạc nền)
 * - Content (caption, hashtags, posts)
 */
export interface TopicProductionBrief {
  /** Tổ chức (tenant isolation) */
  readonly organizationId: string
  /** Sản phẩm ID */
  readonly productId?: string | undefined
  /** Loại hình sản xuất — User chọn TRƯỚC */
  readonly mode: ProductionMode
  /** Dữ liệu sản phẩm carry-forward */
  readonly productContext: ProductContext
  /** Topics đã chọn (1–3) */
  readonly selectedTopics: readonly SelectedTopicInfo[]
  /** Voice ID (từ Audio Studio catalog) */
  readonly voiceId?: string | undefined
  /** Nhạc nền mood */
  readonly musicMood?: string | undefined
  /** Tổng thời lượng video mục tiêu (giây) */
  readonly targetVideoDurationSeconds?: number | undefined
}

// ============================================================
// 6. MEDIA PLAN — Kế hoạch sản xuất
// ============================================================

/** Loại tài sản cần sản xuất */
export type MediaAssetType =
  | "IMAGE_VARIANT"     // Ảnh biến thể (CREATIVE only)
  | "IMAGE_CROP"        // Crop ảnh gốc (AUTHENTIC)
  | "VIDEO_STORY"       // Video cốt truyện
  | "VIDEO_OVERLAY"     // Video gốc + caption/voice
  | "AUDIO_VOICEOVER"   // Voice riêng lẻ
  | "AUDIO_MIX"         // Voice + BGM phối
  | "CONTENT_CAPTION"   // Caption bài viết
  | "CONTENT_HASHTAGS"  // Hashtags
  | "CONTENT_POST"      // Bài viết hoàn chỉnh

export interface MediaPlanItem {
  /** Loại tài sản */
  readonly assetType: MediaAssetType
  /** Topic liên quan */
  readonly topicId: string
  /** Ưu tiên sản xuất (1 = cao nhất) */
  readonly priority: number
  /** Trạng thái */
  readonly status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "FAILED"
  /** Job ID (sau khi dispatch) */
  readonly jobId?: string | undefined
  /** Mô tả ngắn */
  readonly description: string
  /** Nền tảng mục tiêu */
  readonly targetPlatform?: "facebook" | "tiktok" | "instagram" | "zalo" | "all" | undefined
}

export interface MediaPlan {
  /** Brief gốc */
  readonly briefId: string
  /** Mode sản xuất */
  readonly mode: ProductionMode
  /** Danh sách tài sản cần sản xuất */
  readonly items: readonly MediaPlanItem[]
  /** Tổng credit dự kiến */
  readonly estimatedCredits: number
  /** Tổng thời gian sản xuất dự kiến (phút) */
  readonly estimatedTimeMinutes: number
}

// ============================================================
// 7. CAMPAIGN PACKAGE — Gói chiến dịch hoàn chỉnh
// ============================================================

export interface CampaignPackage {
  /** ID chiến dịch */
  readonly campaignId: string
  /** Tên chiến dịch */
  readonly campaignName: string
  /** Mode sản xuất */
  readonly mode: ProductionMode
  /** Topics đã chọn */
  readonly topicIds: readonly string[]
  /** Cung truyện (nếu CREATIVE) */
  readonly narrativeArc?: NarrativeArcOutput | undefined
  /** Media plan */
  readonly mediaPlan: MediaPlan
  /** Trạng thái tổng */
  readonly status: "DRAFT" | "PRODUCING" | "READY" | "PUBLISHED"
  /** Tài sản đã sản xuất */
  readonly producedAssets: readonly ProducedAsset[]
  /** Ngày tạo */
  readonly createdAt: Date
}

export interface ProducedAsset {
  /** Loại tài sản */
  readonly assetType: MediaAssetType
  /** URL file */
  readonly url: string
  /** Storage key */
  readonly storageKey: string
  /** Topic liên quan */
  readonly topicId: string
  /** Job ID */
  readonly jobId: string
  /** Nền tảng mục tiêu */
  readonly targetPlatform?: string | undefined
  /** Trạng thái duyệt */
  readonly approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
}
