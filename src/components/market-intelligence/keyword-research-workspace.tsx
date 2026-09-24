"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Activity, Target, Clock, RefreshCw } from "lucide-react";
import { DirectResearchPanel } from "./direct-research-panel";
import { ResearchStatusBanner, type ResearchStatusInfo } from "./research-status-banner";
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

interface KeywordResearchWorkspaceProps {
  opportunities: OpportunityItem[];
  runs: RunItem[];
  onTriggerRun: (params: CustomResearchParams) => Promise<void>;
  isTriggering: boolean;
  researchStatus: ResearchStatusInfo;
  onDismissResearchStatus: () => void;
}

export function KeywordResearchWorkspace({
  opportunities,
  runs,
  onTriggerRun,
  isTriggering,
  researchStatus,
  onDismissResearchStatus,
}: KeywordResearchWorkspaceProps) {
  const [activeSubTab, setActiveSubTab] = useState<"results" | "runs">("results");
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<MarketTimeframeKey>("ALL");
  const [selectedBucket, setSelectedBucket] = useState<PeriodBucket | null>(null);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "IMPORTANT" | "RISING">("ALL");

  // 1. Phân bổ cơ hội theo Ngày / Tuần / Tháng / 3 Tháng
  const distribution = useMemo(
    () => computeTimeframeDistribution(opportunities),
    [opportunities]
  );

  // 2. Lọc theo mốc thời gian 2 tầng (chọn cụ thể ngày/tuần/tháng hoặc Scope)
  const filteredByTime = useMemo(() => {
    if (selectedBucket) {
      return filterByPeriodBucket(opportunities, selectedBucket);
    }
    return filterByTimeframe(opportunities, selectedTimeframe);
  }, [opportunities, selectedBucket, selectedTimeframe]);

  // 3. Lọc tiếp theo tiêu chí điểm số / xu hướng
  const filtered = filteredByTime.filter((item) => {
    if (activeFilter === "IMPORTANT") return item.contentOpportunityScore >= 75;
    if (activeFilter === "RISING") return item.viralScore >= 65 || item.trendScore >= 65;
    return true;
  });

  const currentFilterLabel = selectedBucket
    ? selectedBucket.label
    : TIMEFRAME_CONFIGS[selectedTimeframe].label;

  return (
    <div className="space-y-6">
      {/* 1. Bảng điều khiển Quét Từ Khóa Trực Tiếp */}
      <DirectResearchPanel
        onTriggerRun={onTriggerRun}
        isSubmitting={isTriggering}
      />

      {/* 2. Banner trạng thái nghiên cứu thời gian thực */}
      <ResearchStatusBanner
        status={researchStatus}
        onViewResults={() => {
          setActiveSubTab("results");
          const el = document.getElementById("keyword-results-section");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
        onDismiss={onDismissResearchStatus}
      />

      {/* 3. Bảng Vàng Xu Hướng: Quán Quân Top 1 của Tuần - Tháng - 3 Tháng - 6 Tháng - 1 Năm */}
      <TopChampionsBlock
        opportunities={opportunities}
        onSelectOpportunity={setSelectedOpportunity}
      />

      {/* 4. Bộ lọc 2 tầng: Chọn Ngày/Tuần/Tháng/3 Tháng & Mốc cụ thể */}
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

      {/* 4. Sub Tabs & Filter Bar */}
      <div id="keyword-results-section" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-2">
        <div className="flex gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab("results")}
            className={`pb-2 flex items-center gap-1.5 border-b-2 transition ${
              activeSubTab === "results"
                ? "border-rose-600 text-rose-600 font-extrabold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Sparkles size={14} />
            Cơ hội ({filtered.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("runs")}
            className={`pb-2 flex items-center gap-1.5 border-b-2 transition ${
              activeSubTab === "runs"
                ? "border-rose-600 text-rose-600 font-extrabold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Activity size={14} />
            Lịch sử quét ({runs.length})
          </button>
        </div>

        {activeSubTab === "results" && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="text-stone-400">Lọc nhanh:</span>
            <button
              type="button"
              onClick={() => setActiveFilter("ALL")}
              className={`px-2.5 py-0.5 rounded-full transition ${
                activeFilter === "ALL"
                  ? "bg-rose-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Tất cả ({filteredByTime.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("IMPORTANT")}
              className={`px-2.5 py-0.5 rounded-full transition ${
                activeFilter === "IMPORTANT"
                  ? "bg-rose-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              🔥 Điểm &gt; 75
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("RISING")}
              className={`px-2.5 py-0.5 rounded-full transition ${
                activeFilter === "RISING"
                  ? "bg-rose-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              📈 Xu hướng bứt phá
            </button>
          </div>
        )}
      </div>

      {/* 5. Tab Content */}
      {activeSubTab === "results" ? (
        filtered.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50 space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
              <Clock size={20} />
            </div>
            <div className="max-w-md mx-auto">
              <p className="text-stone-700 text-sm font-bold">
                Chưa có kết quả quét trong &ldquo;{currentFilterLabel}&rdquo;
              </p>
              <p className="text-stone-400 text-xs mt-1">
                {selectedBucket || selectedTimeframe !== "ALL"
                  ? "Hãy chọn mốc ngày/tuần khác hoặc chọn 'Tất cả' để xem toàn bộ kết quả đã quét."
                  : "Hãy nhập từ khóa hoa ở khung trên và nhấn 'Quét Xu Hướng'."}
              </p>
            </div>
            {(selectedBucket || selectedTimeframe !== "ALL") && (
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
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <OpportunityCard
                key={item.id}
                item={item}
                onSelect={setSelectedOpportunity}
              />
            ))}
          </div>
        )
      ) : (
        <ResearchRunsTable runs={runs} />
      )}

      {/* Slide-over Drawer kể câu chuyện chuyên sâu (Micro Story) */}
      <OpportunityDetailDrawer
        item={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />
    </div>
  );
}
