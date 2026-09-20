import { describe, it, expect, vi } from "vitest";
import { analyzeProductVision } from "@/modules/market-intelligence/use-cases/analyze-product-vision";
import { synthesizeProductResearchQueries } from "@/modules/market-intelligence/domain/synthesize-product-queries";
import { analyzeProductIntelligence } from "@/modules/market-intelligence/use-cases/analyze-product-intelligence";

describe("FloraOS Product Intelligence Pipeline Handshake (Output N -> Perfect Input N+1)", () => {
  const organizationId = "org_test_florist_01";

  it("chạy mượt mà chuỗi khép kín 5 bước từ Ảnh -> Vision AI -> Query Synthesizer -> Trend Fit -> 10 Topics", async () => {
    // BƯỚC 1 & 2: Vision AI trích xuất thuộc tính cấu trúc nguyên tử
    const visionOutput = await analyzeProductVision({
      organizationId,
      productTitle: "Bó hoa tulip tone cam cháy vintage",
      imageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9",
    });

    expect(visionOutput.components.length).toBeGreaterThanOrEqual(1);
    expect(visionOutput.components[0]?.flowerType).toContain("tulip");
    expect(visionOutput.attributes.mainColors).toContain("Cam cháy");
    expect(visionOutput.context.suggestedPrice).toBeGreaterThan(0);

    // MẮC XÍCH ĐỒNG BỘ: Chuyển Vision Output thành bộ từ khóa nghiên cứu sát sườn
    const synthesized = synthesizeProductResearchQueries({
      productName: visionOutput.productName,
      components: visionOutput.components,
      attributes: visionOutput.attributes,
      packaging: visionOutput.packaging,
      context: visionOutput.context,
    });

    expect(synthesized.flowerColorQuery).toContain("tulip");
    expect(synthesized.primaryKeywords.length).toBeGreaterThanOrEqual(2);
    expect(synthesized.primaryKeywords.some((k) => k.includes("tulip"))).toBe(true);

    // BƯỚC 3 & 4: Đối soát thị trường và sinh Báo cáo Product Intelligence
    const report = await analyzeProductIntelligence({
      organizationId,
      productName: visionOutput.productName,
      imageUrl: visionOutput.imageUrl,
      components: visionOutput.components,
      attributes: visionOutput.attributes,
      packaging: visionOutput.packaging,
      context: visionOutput.context,
    });

    expect(report.productName).toBe(visionOutput.productName);
    expect(report.trendFitMatrix.length).toBeGreaterThanOrEqual(4);
    expect(report.trendFitScore).toBeGreaterThanOrEqual(50);
    expect(report.topics).toHaveLength(10);

    // BƯỚC 5: Kiểm tra tiêu chuẩn Dẫn chứng Video Kép (Dual Video Evidence) trên các chủ đề
    const firstTopic = report.topics[0]!;
    expect(firstTopic.dualVideoEvidence).toBeDefined();
    expect(firstTopic.dualVideoEvidence?.tiktok).toBeDefined();
    expect(firstTopic.dualVideoEvidence?.youtube).toBeDefined();

    expect(firstTopic.dualVideoEvidence?.tiktok.videoUrl).toContain("tiktok.com");
    expect(firstTopic.dualVideoEvidence?.youtube.videoUrl).toContain("youtube.com");
    expect(firstTopic.dualVideoEvidence?.tiktok.thumbnailUrl).toBeDefined();
    expect(firstTopic.dualVideoEvidence?.youtube.thumbnailUrl).toBeDefined();
  });

  it("xử lý an toàn khi phân tích mẫu hoa mẫu đơn cao cấp", async () => {
    const visionOutput = await analyzeProductVision({
      organizationId,
      productTitle: "Giỏ hoa mẫu đơn sang trọng chúc mừng khai trương",
      imageUrl: "/images/peony-basket.jpg",
    });

    expect(visionOutput.components[0]?.flowerType).toContain("mẫu đơn");
    expect(visionOutput.attributes.style).toContain("Sang trọng");
    expect(visionOutput.context.likelyOccasions).toContain("Chúc mừng khai trương");

    const report = await analyzeProductIntelligence({
      organizationId,
      productName: visionOutput.productName,
      imageUrl: visionOutput.imageUrl,
      components: visionOutput.components,
      attributes: visionOutput.attributes,
      packaging: visionOutput.packaging,
      context: visionOutput.context,
    });

    expect(report.overallFit).toBeDefined();
    expect(report.topics.length).toBe(10);
    // Topic về khai trương có dẫn chứng video liên quan
    const grandOpeningTopic = report.topics.find((t) => t.title.toLowerCase().includes("khai trương") || t.title.toLowerCase().includes("mẫu đơn"));
    expect(grandOpeningTopic?.dualVideoEvidence?.youtube.title).toBeDefined();
  });

  it("phân tích chính xác mẫu bó hoa hồng đỏ không bị rơi vào fallback kem dâu mặc định", async () => {
    const visionOutput = await analyzeProductVision({
      organizationId,
      productTitle: "Bó hoa hồng đỏ giấy gói trắng nơ xanh rêu",
      imageUrl: "/images/red-roses-bouquet.jpg",
    });

    expect(visionOutput.components[0]?.flowerType).toContain("hồng đỏ");
    expect(visionOutput.attributes.mainColors).toContain("Đỏ nhung");
    expect(visionOutput.packaging.wrappingColor).toContain("Trắng");
    expect(visionOutput.packaging.ribbon).toContain("xanh rêu");

    const synthesized = synthesizeProductResearchQueries({
      productName: visionOutput.productName,
      components: visionOutput.components,
      attributes: visionOutput.attributes,
      packaging: visionOutput.packaging,
      context: visionOutput.context,
    });

    expect(synthesized.primaryKeywords.some((k) => k.includes("hồng đỏ"))).toBe(true);
  });
});
