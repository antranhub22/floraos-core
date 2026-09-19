"use client";

import React, { useState } from "react";
import { Sparkles, Activity, Target, Filter } from "lucide-react";
import { DirectResearchPanel } from "./direct-research-panel";
import { ResearchStatusBanner, type ResearchStatusInfo } from "./research-status-banner";
import { OpportunityCard, type OpportunityItem } from "./opportunity-card";
import { OpportunityDetailDrawer } from "./opportunity-detail-drawer";
import { ResearchRunsTable, type RunItem } from "./research-runs-table";
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
  const [activeFilter, setActiveFilter] = useState<"ALL" | "IMPORTANT" | "RISING">("ALL");

  const filtered = opportunities.filter((item) => {
    if (activeFilter === "IMPORTANT") return item.contentOpportunityScore >= 75;
    if (activeFilter === "RISING") return item.viralScore >= 65 || item.trendScore >= 65;
    return true;
  });

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

      {/* 3. Sub Tabs & Filter Bar */}
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
              Tất cả
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

      {/* 4. Tab Content */}
      {activeSubTab === "results" ? (
        filtered.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50">
            <Target className="h-8 w-8 text-stone-400 mx-auto mb-2" />
            <p className="text-stone-600 text-sm font-medium">Chưa có kết quả phân tích từ khóa phù hợp.</p>
            <p className="text-stone-400 text-xs mt-1">Hãy nhập từ khóa hoa ở khung trên và nhấn &ldquo;Quét Xu Hướng&rdquo;.</p>
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
