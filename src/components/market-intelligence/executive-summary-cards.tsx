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
    <div className="rounded-2xl border border-cool-200 bg-gradient-to-br from-white via-blush-50/20 to-cool-50 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cool-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blush-600 text-white shadow-xs">
            <Sparkles size={15} />
          </span>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-cool-900 flex items-center gap-1.5">
              Tổng quan hôm nay
            </h2>
            <p className="text-caption text-text-muted font-medium">Bấm vào thẻ để xem chi tiết</p>
          </div>
        </div>

        {/* Nút Xem tất cả (ALL) & Chỉ báo thời gian thực */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectCategory?.("ALL")}
            className={`inline-flex items-center gap-1.5 text-caption font-bold px-3 py-1 rounded-full border transition ${
              activeFilter === "ALL"
                ? "bg-blush-600 text-white border-blush-600 shadow-xs"
                : "bg-white text-cool-600 hover:text-blush-700 hover:bg-blush-50/60 border-cool-200"
            }`}
          >
            <LayoutGrid size={12} />
            <span>Tất cả ({displayTotal})</span>
          </button>

          <div className="flex items-center gap-1 text-caption font-bold text-text-muted bg-surface-alt/90 px-2.5 py-1 rounded-full border border-border/50">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-500 animate-pulse" />
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
              ? "border-blush-500 bg-blush-50/80 ring-2 ring-blush-400/50 shadow-xs"
              : "border-blush-100/80 bg-white hover:border-blush-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-caption font-bold text-text group-hover:text-primary transition">
              Cơ hội quan trọng
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blush-50 text-blush-600 group-hover:scale-110 transition">
              <Flame size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blush-600">{opportunityCount}</span>
            <span className="text-caption text-text-muted font-medium">cơ hội hot</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-caption">
            <span className="text-cool-500 line-clamp-1">Điểm cơ hội &ge; 60</span>
            <span className="text-blush-600 font-bold flex items-center gap-0.5">
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
              ? "border-mint-500 bg-mint-50/80 ring-2 ring-mint-400/50 shadow-xs"
              : "border-mint-100/80 bg-white hover:border-mint-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-caption font-bold text-text group-hover:text-success transition">
              Xu hướng bứt phá
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-mint-50 text-mint-600 group-hover:scale-110 transition">
              <TrendingUp size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-mint-600">{risingTrendCount}</span>
            <span className="text-caption text-text-muted font-medium">trend tăng mạnh</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-caption">
            <span className="text-cool-500 line-clamp-1">Viral &amp; Trend cao</span>
            <span className="text-mint-700 font-bold flex items-center gap-0.5">
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
              ? "border-sand-500 bg-sand-50/80 ring-2 ring-sand-400/50 shadow-xs"
              : "border-sand-100/80 bg-white hover:border-sand-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-caption font-bold text-text group-hover:text-warning transition">
              Chủ đề nên làm
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sand-50 text-sand-600 group-hover:scale-110 transition">
              <Lightbulb size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-sand-600">{topicCount}</span>
            <span className="text-caption text-text-muted font-medium">kịch bản sẵn có</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-caption">
            <span className="text-cool-500 line-clamp-1">Có sẵn Hook &amp; Mẫu</span>
            <span className="text-sand-700 font-bold flex items-center gap-0.5">
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
              ? "border-orchid-500 bg-orchid-50/80 ring-2 ring-orchid-400/50 shadow-xs"
              : "border-orchid-100/80 bg-white hover:border-orchid-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-caption font-bold text-text group-hover:text-accent transition">
              Mùa vụ &amp; Dịp tới
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orchid-50 text-orchid-600 group-hover:scale-110 transition">
              <CalendarDays size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-orchid-600">
              {occasionCount !== undefined ? occasionCount : occasionsToDisplay.length}
            </span>
            <span className="text-caption text-text-muted font-medium">mẫu theo sự kiện</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-caption">
            <span className="text-cool-500 line-clamp-1">
              {occasionsToDisplay.slice(0, 2).join(" · ")}
            </span>
            <span className="text-orchid-700 font-bold flex items-center gap-0.5">
              {activeFilter === "OCCASIONS" ? "Đang chọn ✓" : "Lọc xem →"}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
