"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";

export type FeatureKey = "market" | "keyword" | "product";

export interface SettingsScheduleTabProps {
  activeFeature: FeatureKey;
  marketSchedule: {
    enabled: boolean;
    time: string;
    notifyCopilot: boolean;
    notifyEmail: boolean;
  };
  setMarketSchedule: React.Dispatch<
    React.SetStateAction<{
      enabled: boolean;
      time: string;
      notifyCopilot: boolean;
      notifyEmail: boolean;
    }>
  >;
  keywordSchedule: {
    enabled: boolean;
    time: string;
    trackedKeywords: string[];
  };
  setKeywordSchedule: React.Dispatch<
    React.SetStateAction<{
      enabled: boolean;
      time: string;
      trackedKeywords: string[];
    }>
  >;
  newKeywordInput: string;
  setNewKeywordInput: React.Dispatch<React.SetStateAction<string>>;
  productMatching: {
    fitThreshold: number;
    autoMatchWeeklyTrends: boolean;
  };
  setProductMatching: React.Dispatch<
    React.SetStateAction<{
      fitThreshold: number;
      autoMatchWeeklyTrends: boolean;
    }>
  >;
}

export function SettingsScheduleTab({
  activeFeature,
  marketSchedule,
  setMarketSchedule,
  keywordSchedule,
  setKeywordSchedule,
  newKeywordInput,
  setNewKeywordInput,
  productMatching,
  setProductMatching,
}: SettingsScheduleTabProps) {
  const handleAddKeyword = () => {
    const trimmed = newKeywordInput.trim();
    if (trimmed && !keywordSchedule.trackedKeywords.includes(trimmed)) {
      setKeywordSchedule({
        ...keywordSchedule,
        trackedKeywords: [...keywordSchedule.trackedKeywords, trimmed],
      });
      setNewKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywordSchedule({
      ...keywordSchedule,
      trackedKeywords: keywordSchedule.trackedKeywords.filter((k) => k !== kw),
    });
  };

  return (
    <div className="space-y-4">
      {activeFeature === "market" && (
        <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-stone-900 block text-sm">Tự động quét mỗi sáng</span>
              <span className="text-stone-500 text-[11px]">Cập nhật xu hướng thị trường trước giờ mở cửa</span>
            </div>
            <input
              type="checkbox"
              checked={marketSchedule.enabled}
              onChange={(e) => setMarketSchedule({ ...marketSchedule, enabled: e.target.checked })}
              className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
            />
          </div>
          <div className="pt-2 border-t border-stone-200 flex items-center gap-3">
            <label className="font-semibold text-stone-700">Khung giờ chạy cron:</label>
            <input
              type="time"
              value={marketSchedule.time}
              onChange={(e) => setMarketSchedule({ ...marketSchedule, time: e.target.value })}
              className="h-8 rounded-lg border border-stone-300 px-2 font-bold text-stone-800 bg-white"
            />
          </div>
        </div>
      )}

      {activeFeature === "keyword" && (
        <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-stone-900 block text-sm">Tự động quét từ khóa đã ghim</span>
              <span className="text-stone-500 text-[11px]">Chạy ngầm mỗi sáng cho danh sách từ khóa chủ lực của tiệm</span>
            </div>
            <input
              type="checkbox"
              checked={keywordSchedule.enabled}
              onChange={(e) => setKeywordSchedule({ ...keywordSchedule, enabled: e.target.checked })}
              className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
            />
          </div>
          <div className="pt-2 border-t border-stone-200 flex items-center gap-3">
            <label className="font-semibold text-stone-700">Giờ quét mở cửa:</label>
            <input
              type="time"
              value={keywordSchedule.time}
              onChange={(e) => setKeywordSchedule({ ...keywordSchedule, time: e.target.value })}
              className="h-8 rounded-lg border border-stone-300 px-2 font-bold text-stone-800 bg-white"
            />
          </div>
          <div className="space-y-1.5 pt-2 border-t border-stone-200">
            <label className="font-semibold text-stone-700">Danh mục từ khóa ghim theo dõi thường trực:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeywordInput}
                onChange={(e) => setNewKeywordInput(e.target.value)}
                placeholder="Thêm từ khóa hoa (vd: Lan hồ điệp vàng)..."
                className="h-8 flex-1 rounded-lg border border-stone-300 px-2.5 bg-white text-xs"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-3 h-8 rounded-lg bg-rose-600 text-white font-bold inline-flex items-center gap-1 hover:bg-rose-700"
              >
                <Plus size={13} /> Thêm
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {keywordSchedule.trackedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-700 font-medium"
                >
                  {kw}
                  <button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-stone-400 hover:text-rose-600">
                    <Trash2 size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeFeature === "product" && (
        <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
          <span className="font-bold text-stone-900 block text-sm">Tự động ghép sản phẩm với xu hướng</span>
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-700">Ngưỡng điểm Trend Fit đạt chuẩn:</label>
              <span className="font-black text-rose-600 text-sm">{productMatching.fitThreshold}/100</span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={productMatching.fitThreshold}
              onChange={(e) => setProductMatching({ ...productMatching, fitThreshold: Number(e.target.value) })}
              className="w-full accent-rose-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}
