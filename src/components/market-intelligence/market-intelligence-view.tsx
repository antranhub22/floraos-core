"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Activity, Clock, RefreshCw } from "lucide-react";
import {
  ExecutiveSummaryCards,
  type ExecutiveFilterType,
} from "./executive-summary-cards";
import { BriefImportantView } from "./brief-important-view";
import { BriefRisingView } from "./brief-rising-view";
import { BriefTopicsView } from "./brief-topics-view";
import { BriefOccasionsView } from "./brief-occasions-view";
import { OpportunityCard, type OpportunityItem } from "./opportunity-card";
import { OpportunityDetailDrawer } from "./opportunity-detail-drawer";
import { ResearchRunsTable, type RunItem } from "./research-runs-table";
import { TimeframeDistributionBar } from "./timeframe-distribution-bar";
import { TopChampionsBlock } from "./top-champions-block";
import {
  type MarketTimeframeKey,
  type PeriodBucket,
  computeTimeframeDistribution,
  filterByTimeframe,
  filterByPeriodBucket,
  TIMEFRAME_CONFIGS,
} from "@/modules/market-intelligence/domain/trend-timeframe";
import type { CustomResearchParams } from "./custom-research-modal";
import type { ResearchStatusInfo } from "./research-status-banner";

interface MarketIntelligenceViewProps {
  opportunities: OpportunityItem[];
  runs: RunItem[];
  onTriggerRun: (params: CustomResearchParams) => Promise<void>;
  isTriggering: boolean;
  researchStatus: ResearchStatusInfo;
  onDismissResearchStatus: () => void;
  activeResearchMode?: "adhoc" | "daily";
  onChangeResearchMode?: (mode: "adhoc" | "daily") => void;
}

export function MarketIntelligenceView({
  opportunities,
  runs,
}: MarketIntelligenceViewProps) {
  const [activeTab, setActiveTab] = useState<"opportunities" | "monitoring">("opportunities");
  const [activeFilter, setActiveFilter] = useState<ExecutiveFilterType>("ALL");
  const [selectedTimeframe, setSelectedTimeframe] = useState<MarketTimeframeKey>("ALL");
  const [selectedBucket, setSelectedBucket] = useState<PeriodBucket | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);

  // 1. Tính toán phân bổ dữ liệu cơ hội tổng quát
  const distribution = useMemo(
    () => computeTimeframeDistribution(opportunities),
    [opportunities]
  );

  // 2. Lọc cơ hội 2 tầng: Nếu đã chọn mốc rời rạc (ngày/tuần/tháng cụ thể) thì lọc theo mốc, ngược lại theo Scope
  const filteredByTime = useMemo(() => {
    if (selectedBucket) {
      return filterByPeriodBucket(opportunities, selectedBucket);
    }
    return filterByTimeframe(opportunities, selectedTimeframe);
  }, [opportunities, selectedBucket, selectedTimeframe]);

  // 3. Tính toán số liệu động chuẩn xác (Real Dynamic Counters) trên tập đã lọc thời gian
  const importantCount = filteredByTime.filter(
    (item) => item.contentOpportunityScore >= 60
  ).length;

  const risingCount = filteredByTime.filter(
    (item) => item.trendScore >= 45 || item.viralScore >= 60
  ).length;

  const topicCount = filteredByTime.filter(
    (item) => Array.isArray(item.recommendedHooks) && item.recommendedHooks.length > 0
  ).length;

  const isOccasionOpportunity = (item: OpportunityItem) => {
    const text = `${item.audience || ""} ${item.topicName} ${item.opportunitySummary}`.toLowerCase();
    return (
      text.includes("sinh nhật") ||
      text.includes("cưới") ||
      text.includes("kỷ niệm") ||
      text.includes("tốt nghiệp") ||
      text.includes("khai trương") ||
      text.includes("chúc mừng") ||
      text.includes("lễ")
    );
  };

  const occasionCount = filteredByTime.filter(isOccasionOpportunity).length;

  const handleSelectCategory = (category: ExecutiveFilterType) => {
    setActiveFilter(category);
    setActiveTab("opportunities");
    setTimeout(() => {
      const el = document.getElementById("research-results-section");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const currentFilterLabel = selectedBucket
    ? selectedBucket.label
    : TIMEFRAME_CONFIGS[selectedTimeframe].label;

  return (
    <div className="space-y-6">
      {/* 1. Bảng Vàng Xu Hướng: Quán Quân Top 1 của Tuần - Tháng - 3 Tháng - 6 Tháng - 1 Năm */}
      <TopChampionsBlock
        opportunities={opportunities}
        onSelectOpportunity={setSelectedOpportunity}
      />

      {/* 2. Bộ lọc 2 tầng: Chọn Ngày/Tuần/Tháng/3 Tháng & Mốc cụ thể */}
      <TimeframeDistributionBar
        activeTimeframe={selectedTimeframe}
        onSelectTimeframe={(key) => {
          setSelectedTimeframe(key);
          setSelectedBucket(null);
        }}
        selectedBucket={selectedBucket}
        onSelectBucket={setSelectedBucket}
        distribution={distribution}
        items={opportunities}
      />

      {/* 2. Executive Summary Brief v2.0 - 4 Thẻ Chỉ Số Thông Minh */}
      <ExecutiveSummaryCards
        totalCount={filteredByTime.length}
        opportunityCount={importantCount}
        risingTrendCount={risingCount}
        topicCount={topicCount}
        occasionCount={occasionCount}
        activeFilter={activeFilter}
        onSelectCategory={handleSelectCategory}
      />

      {/* Thông báo nếu mốc thời gian đang chọn không có kết quả */}
      {filteredByTime.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 p-8 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock size={20} />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-bold text-stone-800">
              Không có cơ hội nào trong &ldquo;{currentFilterLabel}&rdquo;
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              Hãy chọn mốc ngày/tuần khác có cơ hội phát hiện hoặc chọn &ldquo;Tất cả&rdquo; để xem toàn bộ {opportunities.length} cơ hội thị trường.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedTimeframe("ALL");
              setSelectedBucket(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition"
          >
            <RefreshCw size={13} />
            Xem tất cả ({opportunities.length})
          </button>
        </div>
      )}

      {/* 3. Hiển Thị Giao Diện Chuyên Biệt Theo Từng Tab Được Chọn */}
      {filteredByTime.length > 0 && activeFilter === "IMPORTANT" && (
        <BriefImportantView
          opportunities={filteredByTime}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}

      {filteredByTime.length > 0 && activeFilter === "RISING" && (
        <BriefRisingView
          opportunities={filteredByTime}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}

      {filteredByTime.length > 0 && activeFilter === "TOPICS" && (
        <BriefTopicsView
          opportunities={filteredByTime}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}

      {filteredByTime.length > 0 && activeFilter === "OCCASIONS" && (
        <BriefOccasionsView
          opportunities={filteredByTime}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}

      {/* 4. Chế Độ Toàn Cảnh (ALL) - Hiển thị toàn bộ cơ hội & Hàng đợi worker */}
      {filteredByTime.length > 0 && activeFilter === "ALL" && (
        <div className="space-y-4">
          <div id="research-results-section" className="flex border-b border-stone-200 gap-6 text-sm font-medium pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("opportunities")}
              className={`pb-3 flex items-center gap-2 border-b-2 transition ${
                activeTab === "opportunities"
                  ? "border-rose-600 text-rose-600 font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Cơ hội bán ({filteredByTime.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("monitoring")}
              className={`pb-3 flex items-center gap-2 border-b-2 transition ${
                activeTab === "monitoring"
                  ? "border-rose-600 text-rose-600 font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <Activity className="h-4 w-4" />
              Lịch sử quét ({runs.length})
            </button>
          </div>

          {activeTab === "opportunities" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredByTime.map((item) => (
                <OpportunityCard
                  key={item.id}
                  item={item}
                  onSelect={setSelectedOpportunity}
                />
              ))}
            </div>
          ) : (
            <ResearchRunsTable runs={runs} />
          )}
        </div>
      )}

      {/* Slide-over Drawer kể câu chuyện chuyên sâu (Micro Story) */}
      <OpportunityDetailDrawer
        item={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />
    </div>
  );
}
