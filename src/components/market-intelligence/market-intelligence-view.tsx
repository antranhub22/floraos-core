"use client";

import React, { useState } from "react";
import { Sparkles, Activity } from "lucide-react";
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
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);

  // 1. Tính toán số liệu động chuẩn xác (Real Dynamic Counters)
  const importantCount = opportunities.filter(
    (item) => item.contentOpportunityScore >= 60
  ).length;

  const risingCount = opportunities.filter(
    (item) => item.trendScore >= 45 || item.viralScore >= 60
  ).length;

  const topicCount = opportunities.filter(
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

  const occasionCount = opportunities.filter(isOccasionOpportunity).length;

  const handleSelectCategory = (category: ExecutiveFilterType) => {
    setActiveFilter(category);
    setActiveTab("opportunities");
    setTimeout(() => {
      const el = document.getElementById("research-results-section");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* 1. Executive Summary Brief v2.0 - 4 Thẻ Chỉ Số Thông Minh */}
      <ExecutiveSummaryCards
        totalCount={opportunities.length}
        opportunityCount={importantCount}
        risingTrendCount={risingCount}
        topicCount={topicCount}
        occasionCount={occasionCount}
        activeFilter={activeFilter}
        onSelectCategory={handleSelectCategory}
      />

      {/* 2. Hiển Thị Giao Diện Chuyên Biệt Theo Từng Tab Được Chọn */}
      {activeFilter === "IMPORTANT" && (
        <BriefImportantView
          opportunities={opportunities}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}

      {activeFilter === "RISING" && (
        <BriefRisingView
          opportunities={opportunities}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}

      {activeFilter === "TOPICS" && (
        <BriefTopicsView
          opportunities={opportunities}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}

      {activeFilter === "OCCASIONS" && (
        <BriefOccasionsView
          opportunities={opportunities}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}

      {/* 3. Chế Độ Toàn Cảnh (ALL) - Hiển thị toàn bộ cơ hội & Hàng đợi worker */}
      {activeFilter === "ALL" && (
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
              Cơ hội bán ({opportunities.length})
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
              {opportunities.map((item) => (
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
