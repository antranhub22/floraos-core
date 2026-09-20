import { describe, it, expect, vi } from "vitest";
import { analyzeProductVision } from "@/modules/market-intelligence/use-cases/analyze-product-vision";
import { synthesizeProductResearchQueries } from "@/modules/market-intelligence/domain/synthesize-product-queries";
import { analyzeProductIntelligence } from "@/modules/market-intelligence/use-cases/analyze-product-intelligence";

describe("FloraOS Product Intelligence Pipeline Handshake (Output N -> Perfect Input N+1)", () => {
  const organizationId = "org_test_florist_01";

  it("analyzeProductVision ném lỗi rõ ràng khi Vision AI không khả dụng (không fallback cứng)", async () => {
    // Khi không có DB analysis và OpenAI Vision không khả dụng,
    // hàm PHẢI throw thay vì trả dữ liệu giả "Hoa hồng kem dâu"
    await expect(
      analyzeProductVision({
        organizationId,
        productTitle: "Bó hoa tulip tone cam cháy vintage",
        imageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9",
      })
    ).rejects.toThrow("[analyzeProductVision]");
  });

  it("analyzeProductVision ném lỗi cho mẫu mẫu đơn khi Vision AI không khả dụng", async () => {
    await expect(
      analyzeProductVision({
        organizationId,
        productTitle: "Giỏ hoa mẫu đơn sang trọng chúc mừng khai trương",
        imageUrl: "/images/peony-basket.jpg",
      })
    ).rejects.toThrow("[analyzeProductVision]");
  });

  it("analyzeProductVision ném lỗi cho mẫu hồng đỏ khi Vision AI không khả dụng", async () => {
    await expect(
      analyzeProductVision({
        organizationId,
        productTitle: "Bó hoa hồng đỏ giấy gói trắng nơ xanh rêu",
        imageUrl: "/images/red-roses-bouquet.jpg",
      })
    ).rejects.toThrow("[analyzeProductVision]");
  });

  it("pipeline chạy mượt mà khi Vision AI trả dữ liệu thật (không dựa fallback)", async () => {
    // Giả lập dữ liệu Vision AI thật — đây là output thật từ OpenAI Vision
    const visionOutput = {
      productName: "Bó hoa tulip tone cam cháy vintage",
      imageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9",
      components: [
        { flowerType: "Hoa tulip Hà Lan cam", quantityEstimate: 10, unit: "cành" as const, role: "dominant" as const },
        { flowerType: "Hoa thanh liễu trắng", quantityEstimate: 4, unit: "nhánh" as const, role: "supporting" as const },
        { flowerType: "Lá chanh nhập khẩu", quantityEstimate: 3, unit: "cành" as const, role: "foliage" as const },
      ],
      attributes: {
        mainColors: ["Cam cháy", "Vàng pastel"],
        secondaryColors: ["Xanh lá olive"],
        style: "Vintage Cổ điển (Tone ấm)",
        shape: "Bó dáng dài tự nhiên",
        sizeEstimate: "Tiêu chuẩn (M)",
      },
      packaging: {
        wrappingMaterial: "Giấy xi măng Kraft vintage",
        wrappingColor: "Nâu mộc & Cam nhạt",
        ribbon: "Dây thừng gai mộc",
        accessories: ["Thiệp kraft viết tay"],
      },
      context: {
        likelyOccasions: ["Kỷ niệm ngày cưới", "Sinh nhật bạn thân", "Chúc mừng tốt nghiệp"],
        likelyAudience: "Người yêu thích phong cách Vintage, Nghệ thuật",
        suggestedPrice: 650000,
        confidence: 0.92,
      },
    };

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

    // Đối soát thị trường và sinh Báo cáo Product Intelligence
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

    // Kiểm tra tiêu chuẩn Dẫn chứng Video Kép (Dual Video Evidence) trên các chủ đề
    const firstTopic = report.topics[0]!;
    expect(firstTopic.dualVideoEvidence).toBeDefined();
    expect(firstTopic.dualVideoEvidence?.tiktok).toBeDefined();
    expect(firstTopic.dualVideoEvidence?.youtube).toBeDefined();

    expect(firstTopic.dualVideoEvidence?.tiktok.videoUrl).toContain("tiktok.com");
    expect(firstTopic.dualVideoEvidence?.youtube.videoUrl).toContain("youtube.com");
    expect(firstTopic.dualVideoEvidence?.tiktok.thumbnailUrl).toBeDefined();
    expect(firstTopic.dualVideoEvidence?.youtube.thumbnailUrl).toBeDefined();
  });

  it("analyzeProductIntelligence ném lỗi khi thiếu dữ liệu Vision AI bắt buộc", async () => {
    // Thiếu components → throw
    await expect(
      analyzeProductIntelligence({
        organizationId,
        productName: "Test",
        imageUrl: "/test.jpg",
        components: [],
      })
    ).rejects.toThrow("Thiếu components");

    // Thiếu attributes → throw
    await expect(
      analyzeProductIntelligence({
        organizationId,
        productName: "Test",
        imageUrl: "/test.jpg",
        components: [{ flowerType: "Hoa hồng", quantityEstimate: 10, unit: "cành", role: "dominant" }],
        attributes: undefined,
      })
    ).rejects.toThrow("Thiếu attributes");
  });
});
