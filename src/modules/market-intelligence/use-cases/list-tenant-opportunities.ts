import { marketIntelligenceRepo } from "../infra/market-intelligence-repository";
import { getTopicDualRealVideoEvidence } from "../domain/video-evidence-catalog";

export interface ListOpportunitiesParams {
  organizationId: string;
  limit?: number | undefined;
  cursor?: string | undefined;
  minScore?: number | undefined;
}

export interface EvidenceReference {
  title: string;
  type: "ARTICLE" | "TIKTOK_REELS" | "IMAGE_PINTEREST" | "GOOGLE_TRENDS" | "YOUTUBE";
  url: string;
  platform: string;
  engagementNote?: string | undefined;
  thumbnailUrl?: string | undefined;
  author?: string | undefined;
  metrics?: string | undefined;
}

export interface ListOpportunitiesResult {
  items: Array<{
    id: string;
    organizationId: string;
    topicName: string;
    audience: string | null;
    opportunitySummary: string;
    contentAngles: any;
    recommendedFormats: any;
    recommendedHooks: any;
    evidenceReferences: EvidenceReference[];
    trendScore: number;
    viralScore: number;
    commercialScore: number;
    contentOpportunityScore: number;
    confidence: number;
    expiresAt: Date | null;
    createdAt: Date;
  }>;
  nextCursor: string | null;
  total: number;
}

/**
 * Giải quyết danh sách dẫn chứng video cho mỗi cơ hội nội dung.
 * Dùng SSOT từ `video-evidence-catalog.ts` (Domain Layer) thay vì duplicate hardcoded data.
 */
function resolveEvidenceReferences(angles: any, topicName: string, _summary: string): EvidenceReference[] {
  const catalogEvidence = getTopicDualRealVideoEvidence(topicName);
  let rawRefs: EvidenceReference[] = [];

  if (Array.isArray(angles) && angles[0]?.evidenceReferences && Array.isArray(angles[0].evidenceReferences)) {
    rawRefs = angles[0].evidenceReferences;
  } else if (angles && typeof angles === "object" && !Array.isArray(angles) && Array.isArray(angles.evidenceReferences)) {
    rawRefs = angles.evidenceReferences;
  }

  if (rawRefs.length > 0) {
    // Đảm bảo các video references luôn có thumbnail thật từ SSOT catalog, loại bỏ ảnh Unsplash
    return rawRefs.map((ref) => {
      const isUnsplash = typeof ref.thumbnailUrl === "string" && ref.thumbnailUrl.includes("unsplash.com");
      if (ref.type === "TIKTOK_REELS" || ref.platform?.toLowerCase().includes("tiktok") || ref.url?.includes("tiktok.com")) {
        return {
          ...ref,
          title: ref.title || catalogEvidence.tiktok.title,
          url: ref.url || catalogEvidence.tiktok.videoUrl,
          thumbnailUrl: (!ref.thumbnailUrl || isUnsplash) ? catalogEvidence.tiktok.thumbnailUrl : ref.thumbnailUrl,
          author: ref.author || catalogEvidence.tiktok.author,
          metrics: ref.metrics || catalogEvidence.tiktok.metrics,
        };
      }
      if (ref.type === "YOUTUBE" || ref.platform?.toLowerCase().includes("youtube") || ref.url?.includes("youtube.com")) {
        return {
          ...ref,
          title: ref.title || catalogEvidence.youtube.title,
          url: ref.url || catalogEvidence.youtube.videoUrl,
          thumbnailUrl: (!ref.thumbnailUrl || isUnsplash) ? catalogEvidence.youtube.thumbnailUrl : ref.thumbnailUrl,
          author: ref.author || catalogEvidence.youtube.author,
          metrics: ref.metrics || catalogEvidence.youtube.metrics,
        };
      }
      return ref;
    });
  }

  const encodedTopic = encodeURIComponent(topicName);
  const encodedQuery = encodeURIComponent(`${topicName} hoa tươi`);

  return [
    {
      title: catalogEvidence.tiktok.title,
      type: "TIKTOK_REELS",
      platform: "TikTok / Reels",
      url: catalogEvidence.tiktok.videoUrl,
      thumbnailUrl: catalogEvidence.tiktok.thumbnailUrl,
      author: catalogEvidence.tiktok.author,
      metrics: catalogEvidence.tiktok.metrics,
      engagementNote: "Tham khảo mẫu video clip & cách phối hoa triệu view",
    },
    {
      title: catalogEvidence.youtube.title,
      type: "YOUTUBE",
      platform: "YouTube",
      url: catalogEvidence.youtube.videoUrl,
      thumbnailUrl: catalogEvidence.youtube.thumbnailUrl,
      author: catalogEvidence.youtube.author,
      metrics: catalogEvidence.youtube.metrics,
      engagementNote: "Video hướng dẫn & mẫu cắm hoa thực tế",
    },
    {
      title: `Biểu đồ Google Trends: ${topicName}`,
      type: "GOOGLE_TRENDS",
      platform: "Google Trends",
      url: `https://trends.google.com/trends/explore?q=${encodedTopic}&geo=VN`,
      engagementNote: "Dữ liệu nhu cầu tìm kiếm trực tiếp tại Việt Nam",
    },
    {
      title: `Mẫu thiết kế phong cách: ${topicName}`,
      type: "IMAGE_PINTEREST",
      platform: "Pinterest",
      url: `https://www.pinterest.com/search/pins/?q=${encodedQuery}`,
      engagementNote: "Kho cảm hứng hình ảnh cắm hoa chuẩn phong cách",
    },
  ];
}

/**
 * Truy vấn danh sách cơ hội nội dung đã cá nhân hóa cho một tổ chức.
 * Tuyệt đối cách ly theo `organizationId`.
 */
export async function listTenantOpportunities(
  params: ListOpportunitiesParams
): Promise<ListOpportunitiesResult> {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const minScore = params.minScore ?? 0;

  const [total, records] = await Promise.all([
    marketIntelligenceRepo.countOpportunities(params.organizationId, minScore),
    marketIntelligenceRepo.listOpportunitiesWithTopic(params.organizationId, {
      minScore,
      limit,
      cursor: params.cursor,
    }),
  ]);

  let nextCursor: string | null = null;
  let itemsToReturn = records;

  if (records.length > limit) {
    const nextItem = records[limit];
    if (nextItem) {
      nextCursor = nextItem.id;
    }
    itemsToReturn = records.slice(0, limit);
  }

  return {
    items: itemsToReturn.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      topicName: r.topic.canonical_name,
      audience: r.audience,
      opportunitySummary: r.opportunity_summary,
      contentAngles: r.content_angles,
      recommendedFormats: r.recommended_formats,
      recommendedHooks: r.recommended_hooks,
      evidenceReferences: resolveEvidenceReferences(r.content_angles, r.topic.canonical_name, r.opportunity_summary),
      trendScore: r.trend_score,
      viralScore: r.viral_score,
      commercialScore: r.commercial_score,
      contentOpportunityScore: r.content_opportunity_score,
      confidence: r.confidence,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    })),
    nextCursor,
    total,
  };
}
