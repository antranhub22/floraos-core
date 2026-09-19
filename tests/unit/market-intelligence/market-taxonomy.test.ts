import { describe, it, expect } from "vitest";
import {
  MARKET_TAXONOMY_CATEGORIES,
  ALL_CORE_KEYWORDS,
  COMMERCIAL_MODIFIERS,
  OCCASION_KEYWORDS,
  SEASONAL_KEYWORDS,
  PRODUCT_FORM_KEYWORDS,
  FLOWER_MATERIAL_KEYWORDS,
  STYLE_AESTHETIC_KEYWORDS,
  COLOR_VISUAL_KEYWORDS,
  WRAPPING_MATERIAL_KEYWORDS,
  NOVELTY_ADDON_KEYWORDS,
  SOCIAL_VIRAL_KEYWORDS,
  getSeasonalRecommendedKeywords,
} from "@/modules/market-intelligence/domain/market-taxonomy";

describe("Market Taxonomy & 210 Core Keywords SSOT", () => {
  it("chứa đủ 9 nhóm danh mục cốt lõi", () => {
    expect(MARKET_TAXONOMY_CATEGORIES).toHaveLength(9);
    const codes = MARKET_TAXONOMY_CATEGORIES.map((c) => c.code);
    expect(codes).toEqual([
      "OCCASION",
      "SEASONAL",
      "PRODUCT_FORM",
      "FLOWER_MATERIAL",
      "STYLE_AESTHETIC",
      "COLOR_VISUAL",
      "WRAPPING_MATERIAL",
      "NOVELTY_ADDON",
      "SOCIAL_VIRAL",
    ]);
  });

  it("mỗi nhóm danh mục có đúng số lượng từ khóa theo đặc tả", () => {
    expect(OCCASION_KEYWORDS).toHaveLength(30);
    expect(SEASONAL_KEYWORDS).toHaveLength(20);
    expect(PRODUCT_FORM_KEYWORDS).toHaveLength(25);
    expect(FLOWER_MATERIAL_KEYWORDS).toHaveLength(30);
    expect(STYLE_AESTHETIC_KEYWORDS).toHaveLength(30);
    expect(COLOR_VISUAL_KEYWORDS).toHaveLength(25);
    expect(WRAPPING_MATERIAL_KEYWORDS).toHaveLength(15);
    expect(NOVELTY_ADDON_KEYWORDS).toHaveLength(20);
    expect(SOCIAL_VIRAL_KEYWORDS).toHaveLength(15);

    // Tổng số lượng 9 nhóm
    const sum =
      OCCASION_KEYWORDS.length +
      SEASONAL_KEYWORDS.length +
      PRODUCT_FORM_KEYWORDS.length +
      FLOWER_MATERIAL_KEYWORDS.length +
      STYLE_AESTHETIC_KEYWORDS.length +
      COLOR_VISUAL_KEYWORDS.length +
      WRAPPING_MATERIAL_KEYWORDS.length +
      NOVELTY_ADDON_KEYWORDS.length +
      SOCIAL_VIRAL_KEYWORDS.length;
    expect(sum).toBe(210);
  });

  it("ALL_CORE_KEYWORDS chứa chính xác 210 từ khóa cốt lõi", () => {
    expect(ALL_CORE_KEYWORDS).toHaveLength(210);
    // Kiểm tra một số từ khóa tiêu biểu của từng nhóm
    expect(ALL_CORE_KEYWORDS).toContain("Hoa sinh nhật đẹp");
    expect(ALL_CORE_KEYWORDS).toContain("Hoa 20/10");
    expect(ALL_CORE_KEYWORDS).toContain("Bó hoa đẹp");
    expect(ALL_CORE_KEYWORDS).toContain("Hoa hồng Ecuador");
    expect(ALL_CORE_KEYWORDS).toContain("Hoa phong cách Hàn Quốc");
    expect(ALL_CORE_KEYWORDS).toContain("Hoa tone pastel");
    expect(ALL_CORE_KEYWORDS).toContain("Bó hoa giấy kraft");
    expect(ALL_CORE_KEYWORDS).toContain("Bó hoa kèm gấu bông");
    expect(ALL_CORE_KEYWORDS).toContain("Hoa viral TikTok");
  });

  it("COMMERCIAL_MODIFIERS chứa đầy đủ 4 nhóm ý định thương mại", () => {
    expect(COMMERCIAL_MODIFIERS.demand).toHaveLength(5);
    expect(COMMERCIAL_MODIFIERS.price).toHaveLength(5);
    expect(COMMERCIAL_MODIFIERS.purchaseIntent).toHaveLength(5);
    expect(COMMERCIAL_MODIFIERS.content).toHaveLength(5);
  });

  it("getSeasonalRecommendedKeywords gợi ý đúng từ khóa cho mùa thu (tháng 9-10)", () => {
    const autumnKeywords = getSeasonalRecommendedKeywords(10);
    expect(autumnKeywords).toContain("Hoa 20/10");
    expect(autumnKeywords).toContain("Bó hoa tốt nghiệp hướng dương");
    expect(autumnKeywords).toContain("Hoa cưới mùa thu");
    expect(autumnKeywords.length).toBeGreaterThanOrEqual(5);
  });
});
