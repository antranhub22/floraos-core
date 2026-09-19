"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductUploadCard } from "./product-upload-card";
import { ProductConfirmationCard } from "./product-confirmation-card";
import { ProductTrendFitMatrix } from "./product-trend-fit-matrix";
import { ProductImprovementCard } from "./product-improvement-card";
import { ProductTopicsList } from "./product-topics-list";
import { ProductReadinessCard } from "./product-readiness-card";
import type {
  ProductFlowerComponent,
  ProductVisualAttributes,
  ProductPackaging,
  ProductInferredContext,
  ProductIntelligenceReport,
  ConcreteTopic,
} from "@/modules/market-intelligence/domain/product-intelligence-types";

export function ProductIntelligenceWorkspace() {
  const router = useRouter();

  // State Step 1: Image & Upload
  const [selectedImage, setSelectedImage] = useState(
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80"
  );
  const [productTitle, setProductTitle] = useState("Bó hoa hồng pastel phong cách Hàn Quốc");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State Step 2: Confirmation
  const [hasExtracted, setHasExtracted] = useState(false);
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);

  const [components, setComponents] = useState<ProductFlowerComponent[]>([
    { flowerType: "Hoa hồng kem dâu", quantityEstimate: 12, unit: "cành", role: "dominant" },
    { flowerType: "Hoa baby trắng", quantityEstimate: 5, unit: "nhánh", role: "supporting" },
    { flowerType: "Lá bạc Eucalyptus", quantityEstimate: 3, unit: "cành", role: "foliage" },
  ]);

  const [attributes, setAttributes] = useState<ProductVisualAttributes>({
    mainColors: ["Pastel hồng", "Trắng kem"],
    secondaryColors: ["Xanh bạc lá cây"],
    style: "Romantic & Tinh tế",
    shape: "Bó tròn tự nhiên",
    sizeEstimate: "Tiêu chuẩn (M)",
  });

  const [packaging, setPackaging] = useState<ProductPackaging>({
    wrappingMaterial: "Giấy lụa mờ Kraft",
    wrappingColor: "Hồng phấn & Trắng",
    ribbon: "Ruy băng voan trắng",
    accessories: ["Thiệp chúc mừng thiết kế"],
  });

  const [context, setContext] = useState<ProductInferredContext>({
    likelyOccasions: ["Sinh nhật bạn gái", "Kỷ niệm ngày cưới", "Chúc mừng"],
    likelyAudience: "Nữ giới 20–35 tuổi hoặc Nam giới mua tặng",
    suggestedPrice: 599000,
    confidence: 0.94,
  });

  // State Step 3+: Report
  const [report, setReport] = useState<ProductIntelligenceReport | null>(null);

  // Trigger Analyze Vision (M01 Integration)
  const handleAnalyzeVision = async () => {
    setIsAnalyzing(true);
    // Giả lập bóc tách từ M01 Vision Analyzer
    setTimeout(() => {
      setHasExtracted(true);
      setIsAnalyzing(false);
    }, 1000);
  };

  // Trigger Match Trends (Use case / API call)
  const handleConfirmAndMatch = async (data: {
    components: ProductFlowerComponent[];
    attributes: ProductVisualAttributes;
    packaging: ProductPackaging;
    context: ProductInferredContext;
  }) => {
    try {
      setIsSubmittingMatch(true);
      const res = await fetch("/api/v1/market-intelligence/product-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productTitle,
          image_url: selectedImage,
          components: data.components,
          attributes: data.attributes,
          packaging: data.packaging,
          context: data.context,
        }),
      });

      if (res.ok) {
        const result: ProductIntelligenceReport = await res.json();
        setReport(result);
        // Scroll nhẹ xuống kết quả
        setTimeout(() => {
          const el = document.getElementById("product-report-results");
          el?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    } catch (err) {
      console.error("Lỗi đối soát Product Intelligence:", err);
    } finally {
      setIsSubmittingMatch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Upload & Chọn ảnh */}
      <ProductUploadCard
        selectedImage={selectedImage}
        onSelectImage={(url, name) => {
          setSelectedImage(url);
          setProductTitle(name);
          setHasExtracted(false);
          setReport(null);
        }}
        onAnalyze={handleAnalyzeVision}
        isAnalyzing={isAnalyzing}
      />

      {/* 2. Màn hình xác nhận thuộc tính bóc tách */}
      {hasExtracted && (
        <ProductConfirmationCard
          components={components}
          attributes={attributes}
          packaging={packaging}
          context={context}
          onConfirm={handleConfirmAndMatch}
          isSubmitting={isSubmittingMatch}
        />
      )}

      {/* 3. Báo cáo Product Intelligence khi có kết quả */}
      {report && (
        <div id="product-report-results" className="space-y-6 pt-2">
          {/* Ma trận đối soát */}
          <ProductTrendFitMatrix
            matrix={report.trendFitMatrix}
            trendFitScore={report.trendFitScore}
            audienceFitScore={report.audienceFitScore}
            contentFitScore={report.contentFitScore}
            overallFit={report.overallFit}
          />

          {/* Khuyến nghị cải tiến sản phẩm KEEP / IMPROVE / TEST */}
          <ProductImprovementCard
            improvements={report.improvements}
            onCreateVariation={() => router.push("/tai-anh" as any)}
          />

          {/* Top 10 chủ đề nội dung cụ thể */}
          <ProductTopicsList
            topics={report.topics}
            onOpenVideoStudio={(topic) => router.push(`/video?prompt=${encodeURIComponent(topic.title)}` as any)}
            onOpenMediaStudio={(topic) => router.push(`/tai-anh?topic=${encodeURIComponent(topic.title)}` as any)}
          />

          {/* Thước đo sẵn sàng & Nút hành động */}
          <ProductReadinessCard
            readiness={report.readiness}
            onGoToMedia={() => router.push("/tai-anh" as any)}
            onGoToVideo={() => router.push("/video" as any)}
          />
        </div>
      )}
    </div>
  );
}
