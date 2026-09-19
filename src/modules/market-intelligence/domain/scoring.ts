/**
 * Logic tính điểm xu hướng và cơ hội nội dung (Domain Scoring Solvers).
 * Thuần TypeScript — KHÔNG import Prisma hay dịch vụ ngoài.
 */

export const CURRENT_SCORING_MODEL_VERSION = "v1_florist";

export interface TrendScoreInput {
  velocity?: number | null; // Tốc độ tăng trưởng (điểm số / ngày)
  acceleration?: number | null; // Gia tốc tăng trưởng
  growthRate?: number | null; // % tăng trưởng so với kỳ trước
  baselineInterest?: number | null; // 0 - 100
}

export interface ViralScoreInput {
  socialSignals?: number | null; // Lượng đề cập trên mạng xã hội
  engagementRate?: number | null; // % tương tác
  isBreakout?: boolean; // Tín hiệu bùng nổ đột biến
}

export interface CommercialScoreInput {
  buyingIntent?: number | null; // Ý định mua sắm (0 - 100)
  seasonalityFit?: number | null; // Độ phù hợp thời điểm/dịp lễ (0 - 100)
  priceAlignment?: number | null; // Mức độ tương thích phân khúc giá tiệm (0 - 100)
}

export interface OpportunityWeights {
  trendWeight: number; // Mặc định 0.35
  viralWeight: number; // Mặc định 0.25
  commercialWeight: number; // Mặc định 0.40
}

export const DEFAULT_OPPORTUNITY_WEIGHTS: OpportunityWeights = {
  trendWeight: 0.35,
  viralWeight: 0.25,
  commercialWeight: 0.4,
};

function clamp(value: number, min: number = 0, max: number = 100): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value * 10) / 10));
}

/**
 * Tính điểm xu hướng (Trend Score: 0 - 100).
 * Dựa trên mức độ quan tâm cơ bản, tốc độ (velocity) và gia tốc (acceleration).
 */
export function calculateTrendScore(input: TrendScoreInput): number {
  const base = input.baselineInterest ?? 50;
  const vel = input.velocity ?? 0;
  const acc = input.acceleration ?? 0;
  const growth = input.growthRate ?? 0;

  // Base chiếm 50%, tốc độ và tăng trưởng chiếm 50%
  const velocityContribution = vel * 10;
  const growthContribution = growth * 0.5;
  const accBonus = acc > 0 ? acc * 5 : 0;

  const raw = base * 0.5 + velocityContribution + growthContribution + accBonus;
  return clamp(raw);
}

/**
 * Tính điểm lan tỏa (Viral Score: 0 - 100).
 * Dựa trên tín hiệu tương tác mạng xã hội và trạng thái đột biến (breakout).
 */
export function calculateViralScore(input: ViralScoreInput): number {
  let score = 40; // Điểm nền mặc định

  if (input.socialSignals != null) {
    score += Math.min(30, input.socialSignals * 0.1);
  }

  if (input.engagementRate != null) {
    score += Math.min(20, input.engagementRate * 2);
  }

  if (input.isBreakout) {
    score += 25; // Thưởng điểm đột biến
  }

  return clamp(score);
}

/**
 * Tính điểm thương mại (Commercial Score: 0 - 100).
 * Đánh giá khả năng chuyển đổi thành đơn hàng hoa thực tế.
 */
export function calculateCommercialScore(input: CommercialScoreInput): number {
  const intent = input.buyingIntent ?? 50;
  const seasonality = input.seasonalityFit ?? 50;
  const priceAlign = input.priceAlignment ?? 50;

  const raw = intent * 0.4 + seasonality * 0.35 + priceAlign * 0.25;
  return clamp(raw);
}

/**
 * Tính điểm cơ hội nội dung tổng hợp (Content Opportunity Score: 0 - 100).
 * Kết hợp theo trọng số có cấu hình giữa xu hướng, lan tỏa và giá trị thương mại.
 */
export function calculateContentOpportunityScore(
  trendScore: number,
  viralScore: number,
  commercialScore: number,
  weights: OpportunityWeights = DEFAULT_OPPORTUNITY_WEIGHTS
): number {
  const totalWeight = weights.trendWeight + weights.viralWeight + weights.commercialWeight;
  const normalizedTrendW = weights.trendWeight / (totalWeight || 1);
  const normalizedViralW = weights.viralWeight / (totalWeight || 1);
  const normalizedCommercialW = weights.commercialWeight / (totalWeight || 1);

  const raw =
    trendScore * normalizedTrendW +
    viralScore * normalizedViralW +
    commercialScore * normalizedCommercialW;

  return clamp(raw);
}

export interface ContextualMetrics {
  trendScore: number;
  viralScore: number;
  commercialScore: number;
  contentOpportunityScore: number;
  buyingIntent: number;
  seasonalityFit: number;
}

/**
 * Phân tích và dự phóng chỉ số ngữ cảnh thông minh cho từng chủ đề/loài hoa
 * dựa trên: Mùa vụ tháng hiện tại, Dịp lễ (Occasion), Độ sốt dẻo Visual/TikTok và Phân khúc giá.
 */
export function estimateTopicContextMetrics(
  topicName: string,
  options?: { month?: number; priceSegment?: string }
): ContextualMetrics {
  const lower = topicName.toLowerCase();
  const month = options?.month ?? new Date().getMonth() + 1;
  const isHighEnd = options?.priceSegment === "cao_cap";

  let buyingIntent = 72;
  let seasonalityFit = 68;
  let baseViral = 58;
  let baseTrend = 62;

  // 1. Phân loại theo Dịp lễ & Nhu cầu (Occasion & Intent)
  if (lower.includes("cưới") || lower.includes("cầu hôn") || lower.includes("anniversary")) {
    buyingIntent = 92;
    seasonalityFit = month >= 9 && month <= 12 ? 94 : 70;
    baseViral = 78;
    baseTrend = month >= 9 && month <= 12 ? 86 : 68;
  } else if (lower.includes("khai trương") || lower.includes("đối tác") || lower.includes("thăng chức") || lower.includes("hội nghị")) {
    buyingIntent = 88;
    seasonalityFit = 80;
    baseViral = 52;
    baseTrend = 72;
  } else if (lower.includes("tốt nghiệp") || lower.includes("cử nhân")) {
    buyingIntent = 85;
    seasonalityFit = month === 9 || month === 10 || month === 5 || month === 6 ? 96 : 45;
    baseViral = 76;
    baseTrend = month === 9 || month === 10 || month === 5 || month === 6 ? 88 : 50;
  } else if (lower.includes("20/10") || lower.includes("phụ nữ")) {
    buyingIntent = 95;
    seasonalityFit = month === 10 ? 98 : month === 9 ? 86 : 30;
    baseViral = 84;
    baseTrend = month === 10 ? 96 : month === 9 ? 84 : 40;
  } else if (lower.includes("8/3") || lower.includes("valentine")) {
    buyingIntent = 95;
    seasonalityFit = month === 2 || month === 3 ? 98 : 35;
    baseViral = 82;
    baseTrend = month === 2 || month === 3 ? 95 : 42;
  } else if (lower.includes("sinh nhật")) {
    buyingIntent = 86;
    seasonalityFit = 82;
    baseViral = 68;
    baseTrend = 74;
  } else if (lower.includes("mẹ") || lower.includes("bố") || lower.includes("gia đình")) {
    buyingIntent = 84;
    seasonalityFit = month === 5 || month === 10 ? 92 : 75;
    baseViral = 64;
    baseTrend = 70;
  }

  // 2. Đặc tính Visual & Viral trên Mạng xã hội (TikTok/Reels/Pinterest)
  if (
    lower.includes("pastel") ||
    lower.includes("tulip") ||
    lower.includes("hàn quốc") ||
    lower.includes("gấu bông") ||
    lower.includes("tiktok") ||
    lower.includes("cam cháy") ||
    lower.includes("khổng lồ")
  ) {
    baseViral = Math.min(95, baseViral + 16);
    baseTrend = Math.min(95, baseTrend + 8);
  }
  if (lower.includes("nhập khẩu") || lower.includes("mẫu đơn") || lower.includes("ohara") || lower.includes("ecuador")) {
    buyingIntent = Math.min(96, buyingIntent + 6);
    baseViral = Math.min(92, baseViral + 8);
  }

  // 3. Phù hợp phân khúc tiệm
  const priceAlignment = isHighEnd ? 88 : 76;

  const commercialScore = calculateCommercialScore({
    buyingIntent,
    seasonalityFit,
    priceAlignment,
  });

  const trendScore = clamp(baseTrend);
  const viralScore = clamp(baseViral);
  const oppScore = calculateContentOpportunityScore(trendScore, viralScore, commercialScore);

  return {
    trendScore,
    viralScore,
    commercialScore,
    contentOpportunityScore: oppScore,
    buyingIntent,
    seasonalityFit,
  };
}
