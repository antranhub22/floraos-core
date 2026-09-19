import { marketIntelligenceRepo } from "../infra/market-intelligence-repository";

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
  engagementNote?: string;
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

function resolveEvidenceReferences(angles: any, topicName: string, summary: string): EvidenceReference[] {
  if (Array.isArray(angles) && angles[0]?.evidenceReferences && Array.isArray(angles[0].evidenceReferences)) {
    return angles[0].evidenceReferences;
  }
  if (angles && typeof angles === "object" && !Array.isArray(angles) && Array.isArray(angles.evidenceReferences)) {
    return angles.evidenceReferences;
  }

  const encodedTopic = encodeURIComponent(topicName);
  const encodedQuery = encodeURIComponent(`${topicName} hoa tươi`);

  return [
    {
      title: `Biểu đồ Google Trends: ${topicName}`,
      type: "GOOGLE_TRENDS",
      platform: "Google Trends",
      url: `https://trends.google.com/trends/explore?q=${encodedTopic}&geo=VN`,
      engagementNote: "Dữ liệu nhu cầu tìm kiếm trực tiếp tại Việt Nam",
    },
    {
      title: `Video thịnh hành: ${topicName}`,
      type: "TIKTOK_REELS",
      platform: "TikTok / Reels",
      url: `https://www.tiktok.com/search?q=${encodedQuery}`,
      engagementNote: "Tham khảo mẫu video clip & cách phối hoa triệu view",
    },
    {
      title: `Mẫu thiết kế phong cách: ${topicName}`,
      type: "IMAGE_PINTEREST",
      platform: "Pinterest",
      url: `https://www.pinterest.com/search/pins/?q=${encodedQuery}`,
      engagementNote: "Kho cảm hứng hình ảnh cắm hoa chuẩn phong cách",
    },
    {
      title: `Video review cắm hoa: ${topicName}`,
      type: "YOUTUBE",
      platform: "YouTube",
      url: `https://www.youtube.com/results?search_query=${encodedTopic}+cam+hoa`,
      engagementNote: "Video hướng dẫn & mẫu cắm hoa thực tế",
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
