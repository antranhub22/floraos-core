import { describe, expect, it } from "vitest";
import {
  calculateTrendScore,
  calculateViralScore,
  calculateCommercialScore,
  calculateContentOpportunityScore,
  CURRENT_SCORING_MODEL_VERSION,
} from "@/modules/market-intelligence/domain/scoring";

describe("Domain Scoring — Market Intelligence Engine", () => {
  it("phiên bản mô hình tính điểm là v1_florist", () => {
    expect(CURRENT_SCORING_MODEL_VERSION).toBe("v1_florist");
  });

  it("tính Trend Score chuẩn xác trong khoảng 0 - 100", () => {
    const scoreNormal = calculateTrendScore({
      baselineInterest: 60,
      velocity: 2.0,
      growthRate: 15,
      acceleration: 0.5,
    });
    expect(scoreNormal).toBeGreaterThan(50);
    expect(scoreNormal).toBeLessThanOrEqual(100);

    // Kiểm tra giới hạn kẹp (clamp)
    const scoreMax = calculateTrendScore({
      baselineInterest: 100,
      velocity: 50,
      growthRate: 200,
      acceleration: 10,
    });
    expect(scoreMax).toBe(100);

    const scoreMin = calculateTrendScore({
      baselineInterest: 0,
      velocity: -20,
      growthRate: -50,
      acceleration: -5,
    });
    expect(scoreMin).toBe(0);
  });

  it("tính Viral Score với breakout bonus", () => {
    const withoutBreakout = calculateViralScore({
      socialSignals: 50,
      engagementRate: 5,
      isBreakout: false,
    });

    const withBreakout = calculateViralScore({
      socialSignals: 50,
      engagementRate: 5,
      isBreakout: true,
    });

    expect(withBreakout).toBe(withoutBreakout + 25);
  });

  it("tính Commercial Score dựa trên ý định mua và mùa vụ", () => {
    const highCommercial = calculateCommercialScore({
      buyingIntent: 90,
      seasonalityFit: 85,
      priceAlignment: 80,
    });
    expect(highCommercial).toBeGreaterThanOrEqual(80);

    const lowCommercial = calculateCommercialScore({
      buyingIntent: 20,
      seasonalityFit: 30,
      priceAlignment: 40,
    });
    expect(lowCommercial).toBeLessThan(40);
  });

  it("tính Content Opportunity Score theo đúng trọng số cấu hình", () => {
    const trend = 80;
    const viral = 60;
    const commercial = 90;

    // Trọng số mặc định: 0.35 * 80 + 0.25 * 60 + 0.40 * 90 = 28 + 15 + 36 = 79
    const totalScore = calculateContentOpportunityScore(trend, viral, commercial);
    expect(totalScore).toBe(79);
  });
});
