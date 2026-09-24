"use client";

import React from "react";
import { Globe, Calendar, Layers } from "lucide-react";

/**
 * Nguồn sự thật DUY NHẤT cho 3 lựa chọn geo/timeframe/channel — trước đây
 * `direct-research-panel.tsx` và `custom-research-modal.tsx` mỗi nơi khai
 * một bản nhãn khác nhau cho cùng 3 tham số này (vd. "7 ngày qua (Sóng nóng)"
 * vs "7 ngày qua (Bắt trend nóng)"), dễ lệch nhau khi sửa một chỗ mà quên chỗ
 * kia. Rút gọn 19/09/2026: bỏ các chú thích ngoặc đơn không giúp quyết định
 * (vd. "(Video xu hướng cắm hoa)"), giữ đúng những gì cần để chọn đúng.
 */
export const GEO_OPTIONS = [
  { value: "VN", label: "Toàn quốc" },
  { value: "VN-HN", label: "Hà Nội & Miền Bắc" },
  { value: "VN-SG", label: "TP.HCM & Miền Nam" },
  { value: "VN-DN", label: "Đà Nẵng & Miền Trung" },
] as const;

export const TIMEFRAME_OPTIONS = [
  { value: "now 1-d", label: "24 giờ qua — trong ngày" },
  { value: "now 7-d", label: "7 ngày qua — mới nhất" },
  { value: "today 1-m", label: "30 ngày qua — xu hướng" },
  { value: "today 3-m", label: "90 ngày qua — 3 tháng" },
] as const;

export const CHANNEL_OPTIONS = [
  { value: "omnichannel", label: "✨ Đa kênh (khuyên dùng)" },
  { value: "web", label: "🔍 Google Trends" },
  { value: "tiktok", label: "🎵 TikTok" },
  { value: "youtube", label: "▶️ YouTube" },
  { value: "shopping", label: "🛒 Google Shopping (sắp ra mắt)" },
] as const;

interface ResearchParameterFieldsProps {
  geo: string;
  onGeoChange: (value: string) => void;
  timeframe: string;
  onTimeframeChange: (value: string) => void;
  channel: string;
  onChannelChange: (value: string) => void;
  /** Kích thước ô chọn — panel gọn dùng "sm", modal đầy đủ dùng "md" (mặc định). */
  size?: "sm" | "md";
  /**
   * Class đầy đủ cho mỗi thẻ <select>, THAY THẾ hoàn toàn bộ class mặc định
   * (không cộng dồn) — để tránh xung đột khi nơi gọi dùng hệ token màu khác
   * (vd. `custom-research-modal.tsx` dùng `border-border`/`bg-surface` thay
   * vì `border-stone-200`/`bg-stone-50`). Bỏ trống để dùng giao diện mặc định.
   */
  selectClassName?: string;
}

export function ResearchParameterFields({
  geo,
  onGeoChange,
  timeframe,
  onTimeframeChange,
  channel,
  onChannelChange,
  size = "md",
  selectClassName,
}: ResearchParameterFieldsProps) {
  const heightClass = size === "sm" ? "h-8.5 text-[11.5px]" : "h-10 text-xs";
  const labelClass = size === "sm" ? "text-[11px]" : "text-xs";
  const iconSize = size === "sm" ? 12 : 14;
  const selectClass =
    selectClassName ??
    `${heightClass} w-full rounded-lg border border-stone-200 bg-stone-50/50 px-2 text-stone-800 outline-none focus:border-rose-500 transition`;

  return (
    <>
      <div className="space-y-1">
        <label className={`${labelClass} font-semibold text-stone-700 flex items-center gap-1`}>
          <Globe size={iconSize} className="text-rose-600" />
          Khu vực
        </label>
        <select value={geo} onChange={(e) => onGeoChange(e.target.value)} className={selectClass}>
          {GEO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className={`${labelClass} font-semibold text-stone-700 flex items-center gap-1`}>
          <Calendar size={iconSize} className="text-rose-600" />
          Khung thời gian
        </label>
        <select value={timeframe} onChange={(e) => onTimeframeChange(e.target.value)} className={selectClass}>
          {TIMEFRAME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className={`${labelClass} font-semibold text-stone-700 flex items-center gap-1`}>
          <Layers size={iconSize} className="text-rose-600" />
          Kênh nghiên cứu
        </label>
        <select value={channel} onChange={(e) => onChannelChange(e.target.value)} className={selectClass}>
          {CHANNEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </>
  );
}
