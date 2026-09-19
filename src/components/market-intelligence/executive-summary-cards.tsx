"use client";

import React from "react";
import { Flame, TrendingUp, Lightbulb, CalendarDays, Sparkles, LayoutGrid } from "lucide-react";

export type ExecutiveFilterType = "ALL" | "IMPORTANT" | "RISING" | "TOPICS" | "OCCASIONS";

interface ExecutiveSummaryProps {
  totalCount?: number;
  opportunityCount: number;
  risingTrendCount: number;
  topicCount: number;
  occasionCount?: number;
  upcomingOccasions?: string[];
  activeFilter?: ExecutiveFilterType;
  onSelectCategory?: (category: ExecutiveFilterType) => void;
}

export function ExecutiveSummaryCards({
  totalCount = 0,
  opportunityCount,
  risingTrendCount,
  topicCount,
  occasionCount,
  upcomingOccasions,
  activeFilter = "ALL",
  onSelectCategory,
}: ExecutiveSummaryProps) {
  const currentMonth = new Date().getMonth() + 1;
  const defaultOccasions = [
    currentMonth === 9 || currentMonth === 10
      ? "Ngày Phụ nữ 20/10"
      : currentMonth === 11
      ? "Ngày Nhà giáo 20/11"
      : currentMonth === 12 || currentMonth === 1
      ? "Giáng sinh & Tết"
      : "Valentine & 8/3",
    `Sinh nhật tháng ${currentMonth}`,
    "Kỷ niệm ngày cưới",
    "Lễ tốt nghiệp đại học",
  ];
  const occasionsToDisplay = upcomingOccasions || defaultOccasions;
  const displayTotal = totalCount || opportunityCount || 10;

  return (
    <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-white via-rose-50/20 to-stone-50 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
            <Sparkles size={15} />
          </span>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
              Tổng quan hôm nay
            </h2>
            <p className="text-[11px] text-stone-500 font-medium">Bấm vào thẻ để xem chi tiết</p>
          </div>
        </div>

        {/* Nút Xem tất cả (ALL) & Chỉ báo thời gian thực */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectCategory?.("ALL")}
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border transition ${
              activeFilter === "ALL"
                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                : "bg-white text-stone-600 hover:text-rose-700 hover:bg-rose-50/60 border-stone-200"
            }`}
          >
            <LayoutGrid size={12} />
            <span>Tất cả ({displayTotal})</span>
          </button>

          <div className="flex items-center gap-1 text-[11px] font-bold text-stone-600 bg-stone-100/90 px-2.5 py-1 rounded-full border border-stone-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Dữ liệu trực tiếp
          </div>
        </div>
      </div>

      {/* 4 Thẻ chỉ số tương tác (Interactive Clickable Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Cơ hội quan trọng */}
        <button
          type="button"
          onClick={() => onSelectCategory?.(activeFilter === "IMPORTANT" ? "ALL" : "IMPORTANT")}
          className={`rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer group relative ${
            activeFilter === "IMPORTANT"
              ? "border-rose-500 bg-rose-50/80 ring-2 ring-rose-400/50 shadow-xs"
              : "border-rose-100/80 bg-white hover:border-rose-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-700 group-hover:text-rose-600 transition">
              Cơ hội quan trọng
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 text-rose-600 group-hover:scale-110 transition">
              <Flame size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-600">{opportunityCount}</span>
            <span className="text-[11px] text-stone-400 font-medium">cơ hội hot</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10.5px]">
            <span className="text-stone-500 line-clamp-1">Điểm cơ hội &ge; 60</span>
            <span className="text-rose-600 font-bold flex items-center gap-0.5">
              {activeFilter === "IMPORTANT" ? "Đang chọn ✓" : "Lọc xem →"}
            </span>
          </div>
        </button>

        {/* Metric 2: Xu hướng đang tăng */}
        <button
          type="button"
          onClick={() => onSelectCategory?.(activeFilter === "RISING" ? "ALL" : "RISING")}
          className={`rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer group relative ${
            activeFilter === "RISING"
              ? "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400/50 shadow-xs"
              : "border-emerald-100/80 bg-white hover:border-emerald-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-700 group-hover:text-emerald-700 transition">
              Xu hướng bứt phá
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition">
              <TrendingUp size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600">{risingTrendCount}</span>
            <span className="text-[11px] text-stone-400 font-medium">trend tăng mạnh</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10.5px]">
            <span className="text-stone-500 line-clamp-1">Viral &amp; Trend cao</span>
            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
              {activeFilter === "RISING" ? "Đang chọn ✓" : "Lọc xem →"}
            </span>
          </div>
        </button>

        {/* Metric 3: Chủ đề nội dung */}
        <button
          type="button"
          onClick={() => onSelectCategory?.(activeFilter === "TOPICS" ? "ALL" : "TOPICS")}
          className={`rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer group relative ${
            activeFilter === "TOPICS"
              ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/50 shadow-xs"
              : "border-amber-100/80 bg-white hover:border-amber-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-700 group-hover:text-amber-700 transition">
              Chủ đề nên làm
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:scale-110 transition">
              <Lightbulb size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600">{topicCount}</span>
            <span className="text-[11px] text-stone-400 font-medium">kịch bản sẵn có</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10.5px]">
            <span className="text-stone-500 line-clamp-1">Có sẵn Hook &amp; Mẫu</span>
            <span className="text-amber-700 font-bold flex items-center gap-0.5">
              {activeFilter === "TOPICS" ? "Đang chọn ✓" : "Lọc xem →"}
            </span>
          </div>
        </button>

        {/* Metric 4: Dịp lễ & Mùa vụ tới */}
        <button
          type="button"
          onClick={() => onSelectCategory?.(activeFilter === "OCCASIONS" ? "ALL" : "OCCASIONS")}
          className={`rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer group relative ${
            activeFilter === "OCCASIONS"
              ? "border-purple-500 bg-purple-50/80 ring-2 ring-purple-400/50 shadow-xs"
              : "border-purple-100/80 bg-white hover:border-purple-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-700 group-hover:text-purple-700 transition">
              Mùa vụ &amp; Dịp tới
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-purple-600 group-hover:scale-110 transition">
              <CalendarDays size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-600">
              {occasionCount !== undefined ? occasionCount : occasionsToDisplay.length}
            </span>
            <span className="text-[11px] text-stone-400 font-medium">mẫu theo sự kiện</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10.5px]">
            <span className="text-stone-500 line-clamp-1">
              {occasionsToDisplay.slice(0, 2).join(" · ")}
            </span>
            <span className="text-purple-700 font-bold flex items-center gap-0.5">
              {activeFilter === "OCCASIONS" ? "Đang chọn ✓" : "Lọc xem →"}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
