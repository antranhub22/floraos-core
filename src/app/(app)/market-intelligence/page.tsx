"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  RefreshCw,
  Shield,
  Search,
  Camera,
  Settings,
} from "lucide-react";
import { FeatureGuidanceCard } from "@/components/ui/feature-guidance-card";
import { CustomResearchModal } from "@/components/market-intelligence/custom-research-modal";
import { MarketIntelligenceView } from "@/components/market-intelligence/market-intelligence-view";
import { KeywordResearchWorkspace } from "@/components/market-intelligence/keyword-research-workspace";
import { ProductIntelligenceWorkspace } from "@/components/market-intelligence/product-intelligence-workspace";
import {
  FeatureSettingsModal,
  type FeatureKey,
} from "@/components/market-intelligence/feature-settings-modal";
import {
  SaaSAdminCriteriaModal,
  type SaaSAdminCriteriaConfig,
} from "@/components/market-intelligence/saas-admin-criteria-modal";
import { useMarketIntelligenceData } from "@/components/market-intelligence/use-market-intelligence-data";

const GUIDANCE_MAP: Record<FeatureKey, { badge: string; title: string; description: string; tips: string[] }> = {
  market: {
    badge: "HƯỚNG DẪN XU HƯỚNG THỊ TRƯỜNG TOÀN CẢNH",
    title: "Báo Cáo Nhịp Đập & Cơ Hội Kinh Doanh Vĩ Mô Toàn Ngành",
    description:
      "Bức tranh toàn cảnh về nhu cầu hoa tươi, phong cách phối màu và dịp lễ đang lên ngôi trên cả nước. Cài đặt lịch quét tự động vĩ mô mỗi sáng và biểu mẫu dữ liệu trong nút Cài Đặt.",
    tips: [
      "Bản đồ nhịp đập 4 chỉ số giúp chủ tiệm scan nhanh các cơ hội quan trọng nhất.",
      "Nhấp vào từng thẻ cơ hội để mở ngăn kéo Micro Story xem câu chuyện và kịch bản hook.",
      "Dễ dàng cấu hình giờ chạy tự động và biểu mẫu dữ liệu trong nút Cài Đặt góc trên.",
    ],
  },
  keyword: {
    badge: "HƯỚNG DẪN QUÉT THEO TỪ KHÓA RIÊNG CỦA TIỆM",
    title: "Thẩm Định Nhu Cầu Theo Chủ Đề Hoa Ngách & Dòng Sản Phẩm Của Tiệm",
    description:
      "Chủ động nhập từ khóa, chủ đề hoa hoặc bộ sưu tập tiệm định làm để nhận ngay lời khuyên thương mại, kịch bản video và dẫn chứng thực tế. Cài đặt danh sách từ khóa ghim tự động mỗi sáng trong Settings.",
    tips: [
      "Nhập từ khóa hoa cụ thể để thử nghiệm ý tưởng trước khi nhập hoa về cắm.",
      "Tận dụng nút 'Tùy chỉnh nâng cao' để lọc chuẩn xác theo khu vực địa lý và khung thời gian.",
      "Ghim sẵn 3–5 loài hoa chủ lực của tiệm trong Settings để AI tự động quét mỗi sáng lúc mở cửa.",
    ],
  },
  product: {
    badge: "HƯỚNG DẪN QUÉT THEO ẢNH MẪU HOA (VISION AI)",
    title: "Bóc Tách Ảnh Bình/Bó Hoa Tiệm Tự Cắm & Đối Soát Trend Fit",
    description:
      "Đưa ảnh thật mẫu hoa của tiệm vào. Vision AI bóc tách cấu trúc hoa nguyên tử, chấm điểm khớp xu hướng và chỉ rõ chỉ dẫn 3 vùng: GIỮ hoa đẹp / CẢI TIẾN giấy gói, nơ / THỬ NGHIỆM biến thể mới. Cấu hình tiêu chí trong Settings.",
    tips: [
      "Khác biệt cốt lõi: Đưa ảnh thật của mẫu hoa vào thay vì chỉ gõ từ khóa.",
      "Bóc tách nguyên tử từng loại hoa/lá/phụ kiện cho phép thợ hoa nhấp chuột sửa trực tiếp.",
      "Tùy chỉnh ngưỡng điểm Trend Fit và các thành phần bóc tách mong muốn trong nút Cài Đặt.",
    ],
  },
};

export default function MarketIntelligencePage() {
  const [activeTab, setActiveTab] = useState<FeatureKey>("market");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const {
    opportunities,
    runs,
    loading,
    triggering,
    isSaaSAdmin,
    researchStatus,
    setResearchStatus,
    fetchOpportunities,
    fetchRuns,
    handleTriggerRun,
  } = useMarketIntelligenceData();

  const handleSaveAdminCriteria = async (config: SaaSAdminCriteriaConfig) => {
    await handleTriggerRun({
      keyword: config.macroTopics.slice(0, 10).join(", "),
      geo: config.geoScope,
      timeframe: "now 7-d",
      runType: "DAILY_DEEP",
    });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header Chuẩn SSOT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-surface px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-rose-600" />
              FloraOS Intelligence Engine
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80">
              v2.0 Omnichannel
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Cấu trúc 3 tính năng cốt lõi: 1. Xu hướng thị trường · 2. Quét theo từ khóa · 3. Quét theo ảnh sản phẩm
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* 3 Tính Năng Cốt Lõi Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("market")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "market"
                  ? "bg-white text-rose-700 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <TrendingUp size={13} />
              1. Xu Hướng Thị Trường
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("keyword")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "keyword"
                  ? "bg-white text-rose-700 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Search size={13} />
              2. Quét Theo Từ Khóa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("product")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "product"
                  ? "bg-white text-rose-700 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Camera size={13} />
              3. Quét Theo Ảnh Mẫu
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchOpportunities();
                fetchRuns();
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface text-text hover:bg-surface-alt transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </button>

            {/* Nút Cài Đặt & Biểu Mẫu Input/Output riêng cho từng tính năng */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100 shadow-2xs transition"
              title="Cài đặt lịch quét tự động, biểu mẫu đầu vào & đầu ra của tính năng hiện tại"
            >
              <Settings className="h-3.5 w-3.5 text-rose-600" />
              Cài Đặt & Biểu Mẫu
            </button>

            {/* Nút thiết lập tiêu chí vĩ mô — Dành riêng SaaS Admin */}
            {isSaaSAdmin && (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 shadow-2xs transition"
                title="SaaS Admin: Thiết lập tiêu chí Xu hướng vĩ mô toàn quốc cho mọi Tenant"
              >
                <Shield className="h-3.5 w-3.5 text-purple-700" />
                Tiêu Chí Vĩ Mô
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 pb-20">
        {/* Feature Guidance Card Chuẩn SSOT theo từng Tab */}
        <FeatureGuidanceCard
          badgeLabel={GUIDANCE_MAP[activeTab].badge}
          title={GUIDANCE_MAP[activeTab].title}
          description={GUIDANCE_MAP[activeTab].description}
          tips={GUIDANCE_MAP[activeTab].tips}
        />

        {/* 1. Tính năng 1: Xu Hướng Thị Trường */}
        {activeTab === "market" && (
          <MarketIntelligenceView
            opportunities={opportunities}
            runs={runs}
            onTriggerRun={handleTriggerRun}
            isTriggering={triggering}
            researchStatus={researchStatus}
            onDismissResearchStatus={() => setResearchStatus({ state: "idle", message: "" })}
          />
        )}

        {/* 2. Tính năng 2: Quét Theo Từ Khóa */}
        {activeTab === "keyword" && (
          <KeywordResearchWorkspace
            opportunities={opportunities}
            runs={runs}
            onTriggerRun={handleTriggerRun}
            isTriggering={triggering}
            researchStatus={researchStatus}
            onDismissResearchStatus={() => setResearchStatus({ state: "idle", message: "" })}
          />
        )}

        {/* 3. Tính năng 3: Quét Theo Hình Ảnh Sản Phẩm (Vision AI) */}
        {activeTab === "product" && (
          <ProductIntelligenceWorkspace />
        )}
      </div>

      {/* Modal Cài Đặt & Biểu Mẫu Đầu Vào / Đầu Ra Theo Tính Năng */}
      <FeatureSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        activeFeature={activeTab}
      />

      {/* Modal Nghiên cứu Nâng cao */}
      <CustomResearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTrigger={handleTriggerRun}
        isSubmitting={triggering}
      />

      {/* Modal Thiết lập Tiêu chí Xu hướng Vĩ mô — SaaS Admin */}
      <SaaSAdminCriteriaModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSaveAndTrigger={handleSaveAdminCriteria}
        isSaving={triggering}
      />
    </div>
  );
}
