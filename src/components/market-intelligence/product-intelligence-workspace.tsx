"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, ArrowRight, Layers, Flame, Video, AlertCircle } from "lucide-react";
import { ProductUploadCard } from "./product-upload-card";
import { ProductConfirmationCard } from "./product-confirmation-card";
import { CommercialPassportCard } from "./commercial-passport-card";
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
  CommercialPassport,
} from "@/modules/market-intelligence/domain/product-intelligence-types";

export function ProductIntelligenceWorkspace() {
  const router = useRouter();

  // State Chặng 01: Ảnh & Tên
  const [selectedImage, setSelectedImage] = useState(
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80"
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();
  const [productTitle, setProductTitle] = useState("Bó hoa hồng pastel phong cách Hàn Quốc");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // State Chặng 02: Xác nhận thuộc tính Vision bóc tách
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

  // State Chặng 03+: Báo cáo Product Intelligence
  const [report, setReport] = useState<ProductIntelligenceReport | null>(null);

  // Chặng 02: Kích hoạt Vision AI trích xuất thực tế qua API route
  const handleAnalyzeVision = async () => {
    setIsAnalyzing(true);
    setExtractError(null);
    try {
      const res = await fetch("/api/v1/market-intelligence/vision-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: selectedImage,
          asset_id: selectedAssetId,
          product_title: productTitle,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể bóc tách ảnh bằng Vision AI");
      }

      const data = await res.json();
      if (data.productName) setProductTitle(data.productName);
      if (data.components) setComponents(data.components);
      if (data.attributes) setAttributes(data.attributes);
      if (data.packaging) setPackaging(data.packaging);
      if (data.context) setContext(data.context);

      setHasExtracted(true);
      setTimeout(() => {
        const el = document.getElementById("confirmation-step-section");
        el?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (err: any) {
      setExtractError(err?.message || "Lỗi khi chạy Vision AI bóc tách sản phẩm");
      // Cho phép tiếp tục nếu có dữ liệu sẵn
      setHasExtracted(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Chặng 03: Chuyển dữ liệu Vision xác nhận sang Research Engine đối soát xu hướng
  const handleConfirmAndMatch = async (data: {
    components: ProductFlowerComponent[];
    attributes: ProductVisualAttributes;
    packaging: ProductPackaging;
    context: ProductInferredContext;
    commercialPassport?: CommercialPassport;
  }) => {
    try {
      setIsSubmittingMatch(true);
      const res = await fetch("/api/v1/market-intelligence/product-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productTitle,
          image_url: selectedImage,
          asset_id: selectedAssetId,
          components: data.components,
          attributes: data.attributes,
          packaging: data.packaging,
          context: data.context,
          commercial_passport: data.commercialPassport,
        }),
      });

      if (res.ok) {
        const result: ProductIntelligenceReport = await res.json();
        setReport(result);
        setTimeout(() => {
          const el = document.getElementById("product-report-results");
          el?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }
    } catch (err) {
      console.error("Lỗi đối soát Product Intelligence:", err);
    } finally {
      setIsSubmittingMatch(false);
    }
  };

  // Pipeline Steps Indicator
  const currentStep = report ? 4 : hasExtracted ? 2 : 1;

  return (
    <div className="space-y-6">
      {/* Visual Pipeline Header Indicator */}
      <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold overflow-x-auto gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${currentStep >= 1 ? "bg-rose-50 text-rose-700" : "text-stone-400"}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px]">1</span>
            <span>01. Tải ảnh hoa (BRING)</span>
          </div>
          <ArrowRight size={14} className="text-stone-300 shrink-0" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${currentStep >= 2 ? "bg-rose-50 text-rose-700" : "text-stone-400"}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px]">2</span>
            <span>02. Vision AI bóc tách & Hồ sơ M01b (UNDERSTAND)</span>
          </div>
          <ArrowRight size={14} className="text-stone-300 shrink-0" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${currentStep >= 3 ? "bg-rose-50 text-rose-700" : "text-stone-400"}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px]">3</span>
            <span>03. Khám phá Trend Fit (DISCOVER)</span>
          </div>
          <ArrowRight size={14} className="text-stone-300 shrink-0" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${currentStep >= 4 ? "bg-rose-50 text-rose-700" : "text-stone-400"}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px]">4</span>
            <span>04. 10 Chủ đề & Dẫn chứng Video (IDEATE)</span>
          </div>
        </div>
      </div>

      {extractError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span>{extractError} (Đã chuyển sang cấu hình chỉnh sửa thủ công nguyên tử).</span>
        </div>
      )}

      {/* 1. Upload & Chọn ảnh */}
      <ProductUploadCard
        selectedImage={selectedImage}
        selectedAssetId={selectedAssetId}
        productTitle={productTitle}
        onUpdateProductTitle={setProductTitle}
        onSelectImage={(url, name, assetId) => {
          setSelectedImage(url);
          setProductTitle(name);
          setSelectedAssetId(assetId);
          setHasExtracted(false);
          setReport(null);
        }}
        onAnalyze={handleAnalyzeVision}
        isAnalyzing={isAnalyzing}
      />

      {/* 2. Màn hình xác nhận thuộc tính bóc tách & Hồ sơ thương mại */}
      {hasExtracted && (
        <div id="confirmation-step-section">
          <ProductConfirmationCard
            productTitle={productTitle}
            components={components}
            attributes={attributes}
            packaging={packaging}
            context={context}
            onConfirm={handleConfirmAndMatch}
            isSubmitting={isSubmittingMatch}
          />
        </div>
      )}

      {/* 3. Báo cáo Product Intelligence khi có kết quả */}
      {report && (
        <div id="product-report-results" className="space-y-6 pt-2">
          {/* Hồ sơ thương mại đã duyệt */}
          {report.commercialPassport && (
            <CommercialPassportCard passport={report.commercialPassport} readOnly />
          )}

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
            onCreateVariation={() => {
              const theme = report.improvements.test[0] || "Dark Mood";
              router.push(`/tai-anh?topic=${encodeURIComponent(productTitle)}&theme=${encodeURIComponent(theme)}` as any);
            }}
          />

          {/* Top 10 chủ đề nội dung cụ thể kèm Dẫn chứng Video Kép */}
          <ProductTopicsList
            topics={report.topics}
            onOpenVideoStudio={(topic) =>
              router.push(
                `/video?prompt=${encodeURIComponent(topic.title)}&hook=${encodeURIComponent(topic.hook)}&style=${encodeURIComponent(attributes.style)}` as any
              )
            }
            onOpenMediaStudio={(topic) =>
              router.push(
                `/tai-anh?topic=${encodeURIComponent(topic.title)}&source=${encodeURIComponent(selectedImage)}` as any
              )
            }
          />

          {/* Thước đo sẵn sàng & Nút hành động */}
          <ProductReadinessCard
            readiness={report.readiness}
            onGoToMedia={() =>
              router.push(
                `/tai-anh?topic=${encodeURIComponent(productTitle)}&source=${encodeURIComponent(selectedImage)}` as any
              )
            }
            onGoToVideo={() =>
              router.push(
                `/video?prompt=${encodeURIComponent(productTitle)}&style=${encodeURIComponent(attributes.style)}` as any
              )
            }
          />
        </div>
      )}
    </div>
  );
}
