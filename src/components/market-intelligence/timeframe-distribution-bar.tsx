"use client";

import React, { useMemo } from "react";
import {
  Zap,
  Calendar,
  CalendarDays,
  TrendingUp,
  Layers,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  type MarketTimeframeKey,
  type TimeframeDistribution,
  type PeriodBucket,
  TIMEFRAME_CONFIGS,
  generateDailyBuckets,
  generateWeeklyBuckets,
  generateMonthlyBuckets,
  generateQuarterlyBuckets,
} from "@/modules/market-intelligence/domain/trend-timeframe";
import type { OpportunityItem } from "./opportunity-card";

interface TimeframeDistributionBarProps {
  activeTimeframe: MarketTimeframeKey;
  onSelectTimeframe: (key: MarketTimeframeKey) => void;
  selectedBucket: PeriodBucket | null;
  onSelectBucket: (bucket: PeriodBucket | null) => void;
  distribution: TimeframeDistribution;
  items: OpportunityItem[];
  className?: string;
}

const SCOPE_BUTTONS: Array<{
  key: MarketTimeframeKey;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  activeBg: string;
  activeText: string;
  ringColor: string;
}> = [
  {
    key: "DAY",
    label: "Theo Ngày",
    subLabel: "Từng ngày",
    icon: Zap,
    activeBg: "bg-sand-600",
    activeText: "text-white",
    ringColor: "ring-sand-300/70 border-sand-600",
  },
  {
    key: "WEEK",
    label: "Theo Tuần",
    subLabel: "Từng tuần",
    icon: Calendar,
    activeBg: "bg-blush-600",
    activeText: "text-white",
    ringColor: "ring-blush-300/70 border-blush-600",
  },
  {
    key: "MONTH",
    label: "Theo Tháng",
    subLabel: "Từng tháng",
    icon: CalendarDays,
    activeBg: "bg-ocean-600",
    activeText: "text-white",
    ringColor: "ring-ocean-300/70 border-ocean-600",
  },
  {
    key: "QUARTER",
    label: "Theo 3 Tháng",
    subLabel: "Từng quý",
    icon: TrendingUp,
    activeBg: "bg-orchid-600",
    activeText: "text-white",
    ringColor: "ring-orchid-300/70 border-orchid-600",
  },
  {
    key: "ALL",
    label: "Tất Cả",
    subLabel: "Toàn bộ",
    icon: Layers,
    activeBg: "bg-cool-800",
    activeText: "text-white",
    ringColor: "ring-cool-400/70 border-cool-800",
  },
];

export function TimeframeDistributionBar({
  activeTimeframe,
  onSelectTimeframe,
  selectedBucket,
  onSelectBucket,
  distribution,
  items,
  className = "",
}: TimeframeDistributionBarProps) {
  // Sinh danh sách buckets rời rạc tương ứng với Scope đã chọn
  const dailyBuckets = useMemo(() => generateDailyBuckets(items, 7), [items]);
  const weeklyBuckets = useMemo(() => generateWeeklyBuckets(items, 4), [items]);
  const monthlyBuckets = useMemo(() => generateMonthlyBuckets(items, 4), [items]);
  const quarterlyBuckets = useMemo(() => generateQuarterlyBuckets(items, 4), [items]);

  const currentBuckets: PeriodBucket[] = useMemo(() => {
    switch (activeTimeframe) {
      case "DAY":
        return dailyBuckets;
      case "WEEK":
        return weeklyBuckets;
      case "MONTH":
        return monthlyBuckets;
      case "QUARTER":
        return quarterlyBuckets;
      case "ALL":
      default:
        return [];
    }
  }, [activeTimeframe, dailyBuckets, weeklyBuckets, monthlyBuckets, quarterlyBuckets]);

  const getScopeTotal = (key: MarketTimeframeKey): number => {
    switch (key) {
      case "DAY":
        return distribution.day;
      case "WEEK":
        return distribution.week;
      case "MONTH":
        return distribution.month;
      case "QUARTER":
        return distribution.quarter;
      case "ALL":
      default:
        return distribution.all;
    }
  };

  const handleScopeChange = (key: MarketTimeframeKey) => {
    onSelectTimeframe(key);
    // Khi đổi tầng 1, reset chọn mốc rời rạc về xem toàn bộ khung hoặc mốc mới nhất
    onSelectBucket(null);
  };

  const activeConfig = TIMEFRAME_CONFIGS[activeTimeframe];

  return (
    <div
      className={`rounded-2xl border border-cool-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3 ${className}`}
    >
      {/* TẦNG 1: Thanh chọn chế độ xem (Scope Selector) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blush-50 text-blush-600">
            <Clock size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-extrabold text-cool-900">
                Chế độ phân bổ:
              </span>
              <span className="text-xs font-bold text-blush-700 bg-blush-50 px-2 py-0.5 rounded-full border border-blush-200">
                {activeConfig.label}
              </span>
              {selectedBucket && (
                <>
                  <ChevronRight size={12} className="text-cool-400" />
                  <span className="text-xs font-bold text-sand-800 bg-sand-50 px-2 py-0.5 rounded-full border border-sand-200">
                    {selectedBucket.label}
                  </span>
                </>
              )}
            </div>
            <p className="text-caption text-cool-500 font-medium">
              {selectedBucket
                ? `Đang lọc hiển thị các cơ hội thuộc ${selectedBucket.label}`
                : activeConfig.description}
            </p>
          </div>
        </div>

        {/* 5 Nút bấm chọn Chế độ xem */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-cool-100/90 p-1 rounded-xl border border-cool-200/60">
          {SCOPE_BUTTONS.map((btn) => {
            const Icon = btn.icon;
            const count = getScopeTotal(btn.key);
            const isSelected = activeTimeframe === btn.key;

            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => handleScopeChange(btn.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition duration-150 flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? `${btn.activeBg} ${btn.activeText} shadow-xs border ring-2 ${btn.ringColor}`
                    : "text-cool-600 hover:text-cool-900 hover:bg-white/80"
                }`}
              >
                <Icon size={13} className={isSelected ? "animate-pulse" : "text-cool-400"} />
                <span>{btn.label}</span>
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-caption font-black ${
                    isSelected ? "bg-white/20 text-white" : "bg-cool-200/90 text-cool-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TẦNG 2: Thanh chọn Mốc Rời Rạc Cụ Thể (Discrete Period Picker) */}
      {activeTimeframe !== "ALL" && currentBuckets.length > 0 && (
        <div className="pt-2 border-t border-cool-100 space-y-2">
          <div className="flex items-center justify-between text-caption">
            <span className="font-bold text-cool-600 flex items-center gap-1">
              <Filter size={12} className="text-blush-600" />
              Chọn mốc {activeConfig.shortLabel.toLowerCase()} muốn xem:
            </span>
            {selectedBucket && (
              <button
                type="button"
                onClick={() => onSelectBucket(null)}
                className="text-caption font-semibold text-blush-600 hover:text-blush-800 underline transition"
              >
                Xóa lọc mốc (Xem gộp {activeConfig.shortLabel.toLowerCase()})
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {/* Nút Xem Gộp Toàn Bộ Khung */}
            <button
              type="button"
              onClick={() => onSelectBucket(null)}
              className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                selectedBucket === null
                  ? "bg-blush-600 text-white border-blush-600 shadow-xs"
                  : "bg-cool-50 text-cool-600 border-cool-200 hover:bg-cool-100 hover:text-cool-900"
              }`}
            >
              Toàn bộ {activeConfig.shortLabel.toLowerCase()} ({getScopeTotal(activeTimeframe)})
            </button>

            {/* Các nút bấm từng ngày/tuần/tháng cụ thể */}
            {currentBuckets.map((bucket) => {
              const isSelected = selectedBucket?.id === bucket.id;
              const hasItems = bucket.count > 0;

              return (
                <button
                  key={bucket.id}
                  type="button"
                  onClick={() => onSelectBucket(bucket)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer border ${
                    isSelected
                      ? "bg-sand-600 text-white border-sand-600 font-bold shadow-xs ring-2 ring-sand-300/60"
                      : hasItems
                      ? "bg-white text-cool-800 border-cool-200 hover:border-sand-400 hover:bg-sand-50/40 font-semibold"
                      : "bg-cool-50 text-cool-400 border-cool-200/60 hover:bg-cool-100"
                  }`}
                >
                  <span>{bucket.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-caption font-black ${
                      isSelected
                        ? "bg-sand-700 text-white"
                        : hasItems
                        ? "bg-sand-100 text-sand-800"
                        : "bg-cool-200 text-cool-500"
                    }`}
                  >
                    {bucket.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
