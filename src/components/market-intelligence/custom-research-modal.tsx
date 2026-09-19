"use client";

import React, { useState } from "react";
import { X, Sparkles, Search, Zap, Compass } from "lucide-react";
import { ResearchParameterFields } from "./research-parameter-fields";

export interface CustomResearchParams {
  keyword: string;
  geo: string;
  timeframe?: string;
  channel?: string;
  runType: "MANUAL" | "DAILY_DEEP" | "INTRADAY_PULSE" | "WEEKLY_DEEP";
}

interface CustomResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrigger: (params: CustomResearchParams) => Promise<void>;
  isSubmitting: boolean;
}

const QUICK_SUGGESTIONS = [
  "Hoa tulip pastel",
  "Hoa mẫu đơn nhập khẩu",
  "Bó hoa tốt nghiệp Hàn Quốc",
  "Lan hồ điệp khai trương",
  "Hoa cẩm tú cầu tone xanh",
];

export function CustomResearchModal({
  isOpen,
  onClose,
  onTrigger,
  isSubmitting,
}: CustomResearchModalProps) {
  const [keyword, setKeyword] = useState("");
  const [geo, setGeo] = useState("VN");
  const [timeframe, setTimeframe] = useState("now 7-d");
  const [channel, setChannel] = useState("web");
  const [runType, setRunType] = useState<CustomResearchParams["runType"]>("MANUAL");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onTrigger({
      keyword: keyword.trim() || "hoa tươi xu hướng",
      geo,
      timeframe,
      channel,
      runType,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Compass size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Thiết lập nghiên cứu</h2>
              <p className="text-xs text-text-muted">Chọn từ khóa, khu vực và kênh muốn quét</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt transition"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Keyword Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text flex items-center gap-1.5">
              <Search size={14} className="text-rose-600" />
              Chủ đề / Từ khóa hoa cần nghiên cứu
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="VD: Hoa tulip pastel, Bó hoa tốt nghiệp, Lan hồ điệp..."
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-text outline-none focus:border-primary transition"
            />
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10.5px] text-text-muted self-center">Gợi ý nhanh:</span>
              {QUICK_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setKeyword(sug)}
                  className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[10.5px] font-medium text-text-muted hover:bg-rose-50 hover:text-rose-700 transition"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Khu vực, khung thời gian, kênh — nguồn dùng chung với Quét nhanh */}
          <div className="grid grid-cols-2 gap-3">
            <ResearchParameterFields
              geo={geo}
              onGeoChange={setGeo}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              channel={channel}
              onChannelChange={setChannel}
              selectClassName="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-text outline-none focus:border-primary transition"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text flex items-center gap-1.5">
                <Zap size={14} className="text-rose-600" />
                Chế độ phân tích
              </label>
              <select
                value={runType}
                onChange={(e) => setRunType(e.target.value as CustomResearchParams["runType"])}
                className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-text outline-none focus:border-primary transition"
              >
                <option value="MANUAL">Quét nhanh theo yêu cầu</option>
                <option value="INTRADAY_PULSE">Bắt sóng trong ngày (Pulse)</option>
                <option value="DAILY_DEEP">Nghiên cứu sâu (Deep Research)</option>
                <option value="WEEKLY_DEEP">Tổng hợp tuần (Weekly)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text hover:bg-surface-alt transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 shadow-sm transition disabled:opacity-50"
            >
              <Sparkles size={14} />
              {isSubmitting ? "Đang nạp vào hàng đợi AI..." : "Bắt đầu nghiên cứu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
