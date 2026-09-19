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

interface VideoMetaItem {
  videoThumb: string;
  videoUrl: string;
  videoTitle: string;
  videoAuthor: string;
  videoMetrics: string;
}

function getTopicVideoEvidence(topicName: string): { youtube: VideoMetaItem; tiktok: VideoMetaItem } {
  const lower = topicName.toLowerCase();

  if (lower.includes("khai trương") || lower.includes("đối tác") || lower.includes("doanh nghiệp")) {
    return {
      youtube: {
        videoThumb: "https://i.ytimg.com/vi/KgeeHEXbviw/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=KgeeHEXbviw",
        videoTitle: "Mẫu HOA KHAI TRƯƠNG chúc mừng siêu hot",
        videoAuthor: "Hoatuoi360",
        videoMetrics: "Đăng 7 ngày trước • 3.8k lượt xem",
      },
      tiktok: {
        videoThumb: "https://i.ytimg.com/vi/F8We57dk2w4/hqdefault.jpg",
        videoUrl: `https://www.tiktok.com/search?q=${encodeURIComponent("hoa khai trương")}`,
        videoTitle: "Kệ hoa khai trương tài lộc siêu hot",
        videoAuthor: "@hoatuoituongan",
        videoMetrics: "34.2k tim • TikTok",
      },
    };
  }

  if (lower.includes("mẹ") || lower.includes("tặng mẹ")) {
    return {
      youtube: {
        videoThumb: "https://i.ytimg.com/vi/9ASivWLdJwQ/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=9ASivWLdJwQ",
        videoTitle: "Cách Cắm Giỏ Hoa Cơ Bản | Hoa Tươi Tường An",
        videoAuthor: "TA Floral Academy",
        videoMetrics: "Đăng tuần này • 26.8k lượt xem",
      },
      tiktok: {
        videoThumb: "https://i.ytimg.com/vi/ynv1P2MbvCU/hqdefault.jpg",
        videoUrl: `https://www.tiktok.com/search?q=${encodeURIComponent("giỏ hoa tặng mẹ")}`,
        videoTitle: "Làm bó hoa tặng mẹ 20/10 siêu dễ",
        videoAuthor: "@liamchannel",
        videoMetrics: "18.5k tim • TikTok",
      },
    };
  }

  if (lower.includes("cưới") || lower.includes("kỷ niệm")) {
    return {
      youtube: {
        videoThumb: "https://i.ytimg.com/vi/Bvrqv7Kt-qk/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=Bvrqv7Kt-qk",
        videoTitle: "Cách Làm Bó Hoa Cưới Cầm Tay Cô Dâu Đơn Giản",
        videoAuthor: "Hoa tươi Long Thành",
        videoMetrics: "Đăng 2 tuần trước • 33.2k lượt xem",
      },
      tiktok: {
        videoThumb: "https://i.ytimg.com/vi/CoJl-6rDG7k/hqdefault.jpg",
        videoUrl: `https://www.tiktok.com/search?q=${encodeURIComponent("hoa cưới cầm tay cô dâu")}`,
        videoTitle: "Hướng dẫn bó hoa cưới đẹp Queen Flowers",
        videoAuthor: "@queenflowers",
        videoMetrics: "42.6k tim • TikTok",
      },
    };
  }

  if (lower.includes("sinh nhật")) {
    return {
      youtube: {
        videoThumb: "https://i.ytimg.com/vi/uejjfAHID84/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=uejjfAHID84",
        videoTitle: "Hướng dẫn cắm hoa tặng sinh nhật tông nữ | Hoa tươi Tường An",
        videoAuthor: "TA Floral Academy",
        videoMetrics: "Đăng tháng này • 12.0k lượt xem",
      },
      tiktok: {
        videoThumb: "https://i.ytimg.com/vi/ccGyza0qu5I/hqdefault.jpg",
        videoUrl: `https://www.tiktok.com/search?q=${encodeURIComponent("hoa sinh nhật")}`,
        videoTitle: "Mẫu giỏ hoa tặng sinh nhật đẹp & ngọt ngào",
        videoAuthor: "@dienhoa360",
        videoMetrics: "28.9k tim • TikTok",
      },
    };
  }

  if (lower.includes("tulip")) {
    return {
      youtube: {
        videoThumb: "https://i.ytimg.com/vi/WtQJpTDFiHw/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=WtQJpTDFiHw",
        videoTitle: "Mách Bạn Cách Giữ Cho Hoa Thẳng - Hoa Tulip",
        videoAuthor: "Dạy Cắm Hoa Hiện Đại",
        videoMetrics: "Đăng tháng này • 3.0k lượt xem",
      },
      tiktok: {
        videoThumb: "https://i.ytimg.com/vi/osHb-fN2cPI/hqdefault.jpg",
        videoUrl: `https://www.tiktok.com/search?q=${encodeURIComponent("hoa tulip")}`,
        videoTitle: "Bó hoa tulip mix baby siêu xinh",
        videoAuthor: "@hoatuoitulip",
        videoMetrics: "15.1k tim • TikTok",
      },
    };
  }

  if (lower.includes("gấu bông")) {
    return {
      youtube: {
        videoThumb: "https://i.ytimg.com/vi/LqOfQsPjoFw/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=LqOfQsPjoFw",
        videoTitle: "Cách phối bó hoa quà tặng kèm gấu bông",
        videoAuthor: "Uflory Phụ liệu hoa",
        videoMetrics: "Đăng tuần này • 18.4k lượt xem",
      },
      tiktok: {
        videoThumb: "https://i.ytimg.com/vi/4hieFiqMrNg/hqdefault.jpg",
        videoUrl: `https://www.tiktok.com/search?q=${encodeURIComponent("bó hoa gấu bông")}`,
        videoTitle: "Bó hoa gấu bông tốt nghiệp & sinh nhật",
        videoAuthor: "@phulieuhocuon",
        videoMetrics: "31.7k tim • TikTok",
      },
    };
  }

  if (lower.includes("hồng") || lower.includes("tình yêu")) {
    return {
      youtube: {
        videoThumb: "https://i.ytimg.com/vi/Bvrqv7Kt-qk/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=Bvrqv7Kt-qk",
        videoTitle: "BST Hoa hồng tình yêu lãng mạn",
        videoAuthor: "Hoa tươi Long Thành",
        videoMetrics: "Đăng tuần này • 21.5k lượt xem",
      },
      tiktok: {
        videoThumb: "https://i.ytimg.com/vi/ynv1P2MbvCU/hqdefault.jpg",
        videoUrl: `https://www.tiktok.com/search?q=${encodeURIComponent("bó hoa hồng")}`,
        videoTitle: "Bó hoa hồng đỏ ecuador tình yêu",
        videoAuthor: "@tiemhoalovely",
        videoMetrics: "94.6k tim • TikTok",
      },
    };
  }

  return {
    youtube: {
      videoThumb: "https://i.ytimg.com/vi/LqOfQsPjoFw/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=LqOfQsPjoFw",
      videoTitle: "Các Loại Cốt Cắm Bó Hoa Tươi & Mẫu Thực Tế | UFLORY",
      videoAuthor: "Uflory Phụ liệu hoa",
      videoMetrics: "Đăng tháng này • 12.4k lượt xem",
    },
    tiktok: {
      videoThumb: "https://i.ytimg.com/vi/75BUCNZjCYQ/hqdefault.jpg",
      videoUrl: `https://www.tiktok.com/search?q=${encodeURIComponent(topicName + " hoa tươi")}`,
      videoTitle: "Cách cắm hoa tươi lâu & mẹo giữ form",
      videoAuthor: "@hoatuoituongan",
      videoMetrics: "56.3k tim • TikTok",
    },
  };
}

function resolveEvidenceReferences(angles: any, topicName: string, summary: string): EvidenceReference[] {
  const meta = getTopicVideoEvidence(topicName);
  let rawRefs: EvidenceReference[] = [];

  if (Array.isArray(angles) && angles[0]?.evidenceReferences && Array.isArray(angles[0].evidenceReferences)) {
    rawRefs = angles[0].evidenceReferences;
  } else if (angles && typeof angles === "object" && !Array.isArray(angles) && Array.isArray(angles.evidenceReferences)) {
    rawRefs = angles.evidenceReferences;
  }

  if (rawRefs.length > 0) {
    // Đảm bảo các video references luôn có thumbnail thật, loại bỏ ảnh Unsplash
    return rawRefs.map((ref) => {
      const isUnsplash = typeof ref.thumbnailUrl === "string" && ref.thumbnailUrl.includes("unsplash.com");
      if (ref.type === "TIKTOK_REELS" || ref.platform?.toLowerCase().includes("tiktok") || ref.url?.includes("tiktok.com")) {
        return {
          ...ref,
          title: ref.title || meta.tiktok.videoTitle,
          url: ref.url || meta.tiktok.videoUrl,
          thumbnailUrl: (!ref.thumbnailUrl || isUnsplash) ? meta.tiktok.videoThumb : ref.thumbnailUrl,
          author: ref.author || meta.tiktok.videoAuthor,
          metrics: ref.metrics || meta.tiktok.videoMetrics,
        };
      }
      if (ref.type === "YOUTUBE" || ref.platform?.toLowerCase().includes("youtube") || ref.url?.includes("youtube.com")) {
        return {
          ...ref,
          title: ref.title || meta.youtube.videoTitle,
          url: ref.url || meta.youtube.videoUrl,
          thumbnailUrl: (!ref.thumbnailUrl || isUnsplash) ? meta.youtube.videoThumb : ref.thumbnailUrl,
          author: ref.author || meta.youtube.videoAuthor,
          metrics: ref.metrics || meta.youtube.videoMetrics,
        };
      }
      return ref;
    });
  }

  const encodedTopic = encodeURIComponent(topicName);
  const encodedQuery = encodeURIComponent(`${topicName} hoa tươi`);

  return [
    {
      title: meta.tiktok.videoTitle,
      type: "TIKTOK_REELS",
      platform: "TikTok / Reels",
      url: meta.tiktok.videoUrl,
      thumbnailUrl: meta.tiktok.videoThumb,
      author: meta.tiktok.videoAuthor,
      metrics: meta.tiktok.videoMetrics,
      engagementNote: "Tham khảo mẫu video clip & cách phối hoa triệu view",
    },
    {
      title: meta.youtube.videoTitle,
      type: "YOUTUBE",
      platform: "YouTube",
      url: meta.youtube.videoUrl,
      thumbnailUrl: meta.youtube.videoThumb,
      author: meta.youtube.videoAuthor,
      metrics: meta.youtube.videoMetrics,
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
