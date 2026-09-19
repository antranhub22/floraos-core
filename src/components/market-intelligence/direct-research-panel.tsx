"use client";

import React, { useState } from "react";
import {
  Search,
  Zap,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  Layers,
} from "lucide-react";
import type { CustomResearchParams } from "./custom-research-modal";
import { ResearchParameterFields } from "./research-parameter-fields";
import {
  MARKET_TAXONOMY_CATEGORIES,
  getSeasonalRecommendedKeywords,
} from "@/modules/market-intelligence/domain/market-taxonomy";

interface DirectResearchPanelProps {
  onTriggerRun: (params: CustomResearchParams) => Promise<void>;
  isSubmitting: boolean;
}

export function DirectResearchPanel({
  onTriggerRun,
  isSubmitting,
}: DirectResearchPanelProps) {
  const [keyword, setKeyword] = useState("");
  const [geo, setGeo] = useState("VN");
  const [timeframe, setTimeframe] = useState("now 7-d");
  const [channel, setChannel] = useState("omnichannel");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("seasonal");

  const seasonalKeywords = getSeasonalRecommendedKeywords();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = keyword.trim() || "Hoa tươi xu hướng";
    await onTriggerRun({
      keyword: query,
      geo,
      timeframe,
      channel,
      runType: "MANUAL",
    });
  };

  // Lấy danh sách từ khóa gợi ý theo tab danh mục
  const currentSuggestions = activeCategoryTab === "seasonal"
    ? seasonalKeywords
    : MARKET_TAXONOMY_CATEGORIES.find((c) => c.id === activeCategoryTab)?.keywords.slice(0, 8) ?? seasonalKeywords;

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all space-y-3">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Search size={15} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900">
              Quét nhanh theo từ khóa thị trường
            </h2>
            <p className="text-[11px] text-stone-500">
              Tra cứu trực tiếp chỉ số Google Trends, video viral TikTok và tiềm năng chốt đơn
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 hover:text-rose-700 bg-stone-50 hover:bg-rose-50/60 px-2.5 py-1 rounded-lg border border-stone-200/70 transition"
        >
          <SlidersHorizontal size={12} className={showAdvanced ? "text-rose-600" : "text-stone-500"} />
          <span>{showAdvanced ? "Ẩn tùy chỉnh" : "Tùy chỉnh"}</span>
          <ChevronDown size={12} className={`transition-transform duration-200 ${showAdvanced ? "rotate-180 text-rose-600" : ""}`} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Thanh tìm kiếm chính 1 dòng */}
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập từ khóa hoặc chọn từ 210 từ khóa chuẩn (VD: Bó hoa tốt nghiệp hướng dương, Hoa 20/10...)"
              className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-100 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 h-10 text-xs font-bold text-white hover:bg-rose-700 shadow-xs hover:shadow-sm transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Đang quét...
              </>
            ) : (
              <>
                <Zap size={14} />
                Quét Xu Hướng
              </>
            )}
          </button>
        </div>

        {/* Category switcher for quick suggestions */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[10.5px] text-stone-400 font-medium flex-shrink-0 flex items-center gap-1">
              <Layers size={11} /> Nhóm từ khóa:
            </span>
            <button
              type="button"
              onClick={() => setActiveCategoryTab("seasonal")}
              className={`flex-shrink-0 text-[10.5px] px-2 py-0.5 rounded-md font-semibold transition ${
                activeCategoryTab === "seasonal"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Mùa thu này
            </button>
            {MARKET_TAXONOMY_CATEGORIES.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryTab(cat.id)}
                className={`flex-shrink-0 text-[10.5px] px-2 py-0.5 rounded-md font-medium transition ${
                  activeCategoryTab === cat.id
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat.shortName}
              </button>
            ))}
          </div>

          {/* Quick suggestions chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {currentSuggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setKeyword(sug)}
                className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-medium border transition ${
                  keyword === sug
                    ? "bg-rose-50 text-rose-700 border-rose-300 font-semibold"
                    : "bg-stone-50 text-stone-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border-stone-200/80"
                }`}
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Khu vực tham số tùy chỉnh nâng cao (toggle mở rộng) */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <ResearchParameterFields
              geo={geo}
              timeframe={timeframe}
              channel={channel}
              onGeoChange={setGeo}
              onTimeframeChange={setTimeframe}
              onChannelChange={setChannel}
            />
          </div>
        )}
      </form>
    </div>
  );
}
