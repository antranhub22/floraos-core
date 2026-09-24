import type { VideoEvidenceSnippet } from "@/core/ports/trend-provider";
import { marketIntelligenceRepo } from "../infra/market-intelligence-repository";
import { getTopicDualRealVideoEvidence } from "../domain/video-evidence-catalog";
import {
  calculateCommercialScore,
  calculateContentOpportunityScore,
  estimateTopicContextMetrics,
  CURRENT_SCORING_MODEL_VERSION,
} from "../domain/scoring";

export interface PersonalizeResult {
  organizationsProcessed: number;
  opportunitiesCreated: number;
}

/**
 * Cá nhân hóa gợi ý cơ hội nội dung (Content Opportunities) cho từng tenant.
 *
 * Đợt A (mục 2):
 * - Tính `price_range` động từ `products` / `pricing_rules`.
 * - Lấy `customers.tier` làm proxy audience.
 * - Đọc `brand_profiles` (tone_of_voice, hashtags, default_offers).
 * - Ghi `content_opportunities` luôn kèm `organization_id`.
 */
export async function personalizeOpportunitiesForTenants(
  topicIds?: string[],
  topicEvidenceMap?: Record<string, VideoEvidenceSnippet[]>
): Promise<PersonalizeResult> {
  const orgs = await marketIntelligenceRepo.getTenantsForPersonalization();

  // Lấy các chủ đề có điểm số mới nhất
  const topics = await marketIntelligenceRepo.getScoredTopics(topicIds);

  let totalCreated = 0;

  for (const org of orgs) {
    // 1. Tính giá trung bình / khoảng giá của tiệm
    let avgPrice = 500_000;
    const mucThuRule = org.pricing_rules.find((r) => r.key === "muc_thu");
    if (mucThuRule && typeof mucThuRule.value === "object" && mucThuRule.value !== null) {
      const val = (mucThuRule.value as Record<string, unknown>).base_price;
      if (typeof val === "number" && val > 0) avgPrice = val;
    }

    const priceSegment =
      avgPrice >= 1_500_000 ? "cao_cap" : avgPrice >= 700_000 ? "tam_trung" : "pho_thong";

    // 2. Phân tầng khách hàng chủ đạo
    const vipCount = org.customers.filter((c) => c.tier === "VIP" || c.tier === "GOLD").length;
    const audienceProxy =
      vipCount > 5 ? "Khách hàng doanh nghiệp & quà tặng VIP" : "Khách hàng cá nhân, sinh nhật & sự kiện";

    const tone = org.brand_profile?.tone_of_voice ?? "Trang nhã, tinh tế, chân thành";
    const hashtags = Array.isArray(org.brand_profile?.hashtags)
      ? (org.brand_profile.hashtags as string[])
      : ["#hoatuoi", "#flower", `#${org.name.replace(/\s+/g, "").toLowerCase()}`];

    for (const topic of topics) {
      const context = estimateTopicContextMetrics(topic.canonical_name, {
        priceSegment,
      });

      const latestScore = topic.scores[0];
      const trendScore = latestScore?.trend_score
        ? Math.round((latestScore.trend_score * 0.4 + context.trendScore * 0.6) * 10) / 10
        : context.trendScore;
      const viralScore = latestScore?.viral_score
        ? Math.round((latestScore.viral_score * 0.3 + context.viralScore * 0.7) * 10) / 10
        : context.viralScore;
      const commercialScore = context.commercialScore;
      const oppScore = calculateContentOpportunityScore(trendScore, viralScore, commercialScore);

      const encodedTopic = encodeURIComponent(topic.canonical_name);
      // Trích xuất tính từ tự nhiên đầu tiên từ tone giọng (ví dụ "tinh tế" thay vì "Trang nhã, tinh tế, chân thành")
      const primaryToneWord = tone ? (tone.split(/[,;\n]/)[0] ?? "").trim() : "";
      const socialSearchTerm =
        primaryToneWord && primaryToneWord.length <= 15
          ? `${topic.canonical_name} ${primaryToneWord}`
          : topic.canonical_name;
      const encodedSocial = encodeURIComponent(socialSearchTerm);

      const catalogEvidence = getTopicDualRealVideoEvidence(topic.canonical_name);
      const snippets = topicEvidenceMap?.[topic.id] || [];
      const tiktokSnippet = snippets.find((s) => s.platform === "TIKTOK_REELS");
      const ytSnippet = snippets.find((s) => s.platform === "YOUTUBE");

      const evidence = [
        {
          title: tiktokSnippet?.title ?? catalogEvidence.tiktok.title,
          type: "TIKTOK_REELS",
          platform: "TikTok / Reels",
          url: tiktokSnippet?.url ?? catalogEvidence.tiktok.videoUrl,
          thumbnailUrl: tiktokSnippet?.thumbnailUrl ?? catalogEvidence.tiktok.thumbnailUrl,
          author: tiktokSnippet?.author ?? catalogEvidence.tiktok.author,
          metrics: tiktokSnippet?.metrics ?? catalogEvidence.tiktok.metrics,
          engagementNote: tiktokSnippet?.snippet ?? "Tham khảo mẫu video clip & cách phối hoa triệu view",
        },
        {
          title: ytSnippet?.title ?? catalogEvidence.youtube.title,
          type: "YOUTUBE",
          platform: "YouTube",
          url: ytSnippet?.url ?? catalogEvidence.youtube.videoUrl,
          thumbnailUrl: ytSnippet?.thumbnailUrl ?? catalogEvidence.youtube.thumbnailUrl,
          author: ytSnippet?.author ?? catalogEvidence.youtube.author,
          metrics: ytSnippet?.metrics ?? catalogEvidence.youtube.metrics,
          engagementNote: ytSnippet?.snippet ?? "Video hướng dẫn & mẫu cắm hoa thực tế",
        },
        {
          title: `Biểu đồ Google Trends: ${topic.canonical_name}`,
          type: "GOOGLE_TRENDS",
          platform: "Google Trends",
          url: `https://trends.google.com/trends/explore?q=${encodedTopic}&geo=VN`,
          engagementNote: "Dữ liệu nhu cầu tìm kiếm trực tiếp tại Việt Nam",
        },
        {
          title: `Mẫu thiết kế phong cách: ${topic.canonical_name}`,
          type: "IMAGE_PINTEREST",
          platform: "Pinterest",
          url: `https://www.pinterest.com/search/pins/?q=${encodedSocial}`,
          engagementNote: "Kho cảm hứng hình ảnh cắm hoa chuẩn phong cách",
        },
      ];

      const angles = [
        {
          angleTitle: `Ý nghĩa thông điệp cùng ${topic.canonical_name}`,
          perspective: `Thể hiện phong cách ${tone}`,
          targetAudience: audienceProxy,
          evidenceReferences: evidence,
        },
        {
          angleTitle: `Mẹo chọn ${topic.canonical_name} phù hợp ngân sách`,
          perspective: `Tối ưu chi phí cho phân khúc ${priceSegment}`,
          targetAudience: "Người mua hoa sự kiện",
        },
      ];

      const formats = ["REEL_15S", "TIKTOK_30S", "IMAGE_POST"];
      const hooks = generateDynamicHooks(topic.canonical_name, tone);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Hết hạn sau 7 ngày

      await marketIntelligenceRepo.createContentOpportunity({
        organizationId: org.id,
        topicId: topic.id,
        audience: audienceProxy,
        opportunitySummary: `Cơ hội nội dung theo xu hướng ${topic.canonical_name} phù hợp phong cách ${tone}`,
        contentAngles: angles,
        recommendedFormats: formats,
        recommendedHooks: hooks,
        trendScore: trendScore,
        viralScore: viralScore,
        commercialScore: commercialScore,
        contentOpportunityScore: oppScore,
        confidence: 0.9,
        expiresAt: expiresAt,
      });

      totalCreated++;
    }
  }

  return {
    organizationsProcessed: orgs.length,
    opportunitiesCreated: totalCreated,
  };
}

function generateDynamicHooks(topicName: string, tone: string): string[] {
  const lower = topicName.toLowerCase();

  if (lower.includes("tốt nghiệp") || lower.includes("cử nhân")) {
    return [
      `Top thiết kế ${topicName} rực rỡ chúc mừng tân cử nhân`,
      `Bí quyết chọn ${topicName} chụp ảnh kỷ yếu cực ăn ảnh`,
      `Gợi ý món quà tinh tế với ${topicName}`,
    ];
  }

  if (lower.includes("khai trương") || lower.includes("thăng chức") || lower.includes("đối tác")) {
    return [
      `Gợi ý kệ ${topicName} sang trọng chiêu tài lộc mừng hồng phát`,
      `Mẫu ${topicName} đẳng cấp thể hiện uy tín và sự thịnh vượng`,
      `Bí quyết chọn ${topicName} chuẩn gu doanh nghiệp`,
    ];
  }

  if (lower.includes("cưới") || lower.includes("cầu hôn") || lower.includes("anniversary") || lower.includes("yêu")) {
    return [
      `BST ${topicName} thanh lịch dẫn đầu xu hướng mùa cưới`,
      `Ý tưởng thiết kế ${topicName} lãng mạn & tinh tế chuẩn gu hiện đại`,
      `Khoảnh khắc ngọt ngào trọn vẹn cùng phong cách ${topicName}`,
    ];
  }

  if (lower.includes("sinh nhật")) {
    return [
      `Gợi ý mẫu ${topicName} ngọt ngào & bất ngờ cho ngày đặc biệt`,
      `Top phối màu ${topicName} phong cách Hàn Quốc được yêu thích nhất`,
      `Bí quyết chọn ${topicName} ghi điểm trọn vẹn theo sở thích`,
    ];
  }

  if (lower.includes("mẹ") || lower.includes("bố") || lower.includes("gia đình") || lower.includes("20/10") || lower.includes("8/3")) {
    return [
      `Trao trọn yêu thương và lòng biết ơn cùng ${topicName}`,
      `Thiết kế ${topicName} trang nhã đong đầy tình cảm chân thành`,
      `Gợi ý mẫu ${topicName} ấm áp thay lời muốn nói gửi đấng sinh thành`,
    ];
  }

  if (lower.includes("pastel") || lower.includes("tulip") || lower.includes("hàn quốc") || lower.includes("nhập khẩu")) {
    return [
      `Phong cách ${topicName} nhẹ nhàng, tinh khôi chuẩn visual Hàn Quốc`,
      `Xu hướng cắm ${topicName} đang gây sốt trên mạng xã hội tuần này`,
      `Gợi ý phối hoa ${topicName} sang trọng tạo điểm nhấn nghệ thuật`,
    ];
  }

  return [
    `Xu hướng ${topicName} sang trọng dẫn đầu thị hiếu hoa tươi tuần này`,
    `Gợi ý thiết kế ${topicName} phong cách ${tone}`,
    `Bí quyết chọn ${topicName} tươi lâu & chuẩn form nghệ thuật`,
  ];
}
