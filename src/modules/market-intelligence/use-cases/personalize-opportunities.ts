import { marketIntelligenceRepo } from "../infra/market-intelligence-repository";
import {
  calculateCommercialScore,
  calculateContentOpportunityScore,
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
  topicIds?: string[]
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
      const latestScore = topic.scores[0];
      const trendScore = latestScore?.trend_score ?? 60;
      const viralScore = latestScore?.viral_score ?? 50;

      // Tính lại commercial score riêng theo khoảng giá của tiệm
      const priceAlignment = priceSegment === "cao_cap" ? 85 : 70;
      const commercialScore = calculateCommercialScore({
        buyingIntent: 75,
        seasonalityFit: 70,
        priceAlignment,
      });

      const oppScore = calculateContentOpportunityScore(trendScore, viralScore, commercialScore);

      const encodedTopic = encodeURIComponent(topic.canonical_name);
      // Trích xuất tính từ tự nhiên đầu tiên từ tone giọng (ví dụ "tinh tế" thay vì "Trang nhã, tinh tế, chân thành")
      const primaryToneWord = tone ? (tone.split(/[,;\n]/)[0] ?? "").trim() : "";
      const socialSearchTerm =
        primaryToneWord && primaryToneWord.length <= 15
          ? `${topic.canonical_name} ${primaryToneWord}`
          : topic.canonical_name;
      const encodedSocial = encodeURIComponent(socialSearchTerm);

      const evidence = [
        {
          title: `Biểu đồ Google Trends: ${topic.canonical_name}`,
          type: "GOOGLE_TRENDS",
          platform: "Google Trends",
          url: `https://trends.google.com/trends/explore?q=${encodedTopic}&geo=VN`,
          engagementNote: "Dữ liệu nhu cầu tìm kiếm trực tiếp tại Việt Nam",
        },
        {
          title: `Video thịnh hành: ${topic.canonical_name}`,
          type: "TIKTOK_REELS",
          platform: "TikTok / Reels",
          url: `https://www.tiktok.com/search?q=${encodedSocial}`,
          engagementNote: "Tham khảo mẫu video clip & cách phối hoa triệu view",
        },
        {
          title: `Mẫu thiết kế phong cách: ${topic.canonical_name}`,
          type: "IMAGE_PINTEREST",
          platform: "Pinterest",
          url: `https://www.pinterest.com/search/pins/?q=${encodedSocial}`,
          engagementNote: "Kho cảm hứng hình ảnh cắm hoa chuẩn phong cách",
        },
        {
          title: `Video review cắm hoa: ${topic.canonical_name}`,
          type: "YOUTUBE",
          platform: "YouTube",
          url: `https://www.youtube.com/results?search_query=${encodedTopic}+cam+hoa`,
          engagementNote: "Video hướng dẫn & mẫu cắm hoa thực tế",
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
      const hooks = [
        `Bật mí bí quyết chọn ${topic.canonical_name} không phải ai cũng biết`,
        `Gợi ý món quà tinh tế với ${topic.canonical_name}`,
      ];

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
