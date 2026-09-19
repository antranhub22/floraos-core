"use client";

import React, { useState } from "react";
import {
  X,
  Clock,
  FileInput,
  FileOutput,
  Save,
  CheckCircle2,
  TrendingUp,
  Search,
  Camera,
} from "lucide-react";
import {
  FeatureKey,
  SettingsScheduleTab,
} from "./settings/settings-schedule-tab";
import { SettingsInputTab } from "./settings/settings-input-tab";
import { SettingsOutputTab } from "./settings/settings-output-tab";

export type { FeatureKey };

interface FeatureSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFeature: FeatureKey;
}

export function FeatureSettingsModal({
  isOpen,
  onClose,
  activeFeature,
}: FeatureSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"schedule" | "input" | "output">("schedule");
  const [isSaved, setIsSaved] = useState(false);

  // Settings for Market Trends
  const [marketSchedule, setMarketSchedule] = useState({
    enabled: true,
    time: "06:00",
    notifyCopilot: true,
    notifyEmail: false,
  });
  const [marketInput, setMarketInput] = useState({
    geoVN: true,
    geoHN: true,
    geoSG: true,
    sourceGoogle: true,
    sourceTikTok: true,
    sourceYouTube: true,
    sourcePinterest: true,
    timeframe: "now 7-d",
    depth: "DEEP",
  });
  const [marketOutput, setMarketOutput] = useState({
    executiveSummary: true,
    trendLifecycle: true,
    threeScores: true,
    recommendedHooks: true,
    evidenceReferences: true,
  });

  // Settings for Keyword Advisory
  const [keywordSchedule, setKeywordSchedule] = useState({
    enabled: true,
    time: "06:30",
    trackedKeywords: ["Hoa tulip pastel", "Bó hoa tốt nghiệp Hàn Quốc", "Lan hồ điệp khai trương"],
  });
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [keywordInput, setKeywordInput] = useState({
    defaultStyle: "Romantic & Tinh tế",
    channel: "omnichannel",
    priceTier: "MID_TIER",
  });
  const [keywordOutput, setKeywordOutput] = useState({
    commercialAdvice: true,
    audiencePersona: true,
    hooks: true,
    complementaryPairings: true,
    recommendedFormats: true,
  });

  // Settings for Product Intelligence
  const [productMatching, setProductMatching] = useState({
    fitThreshold: 70,
    autoMatchWeeklyTrends: true,
  });
  const [productInput, setProductInput] = useState({
    extractFlowers: true,
    extractColors: true,
    extractPackaging: true,
    inferOccasions: true,
  });
  const [productOutput, setProductOutput] = useState({
    matrixScores: true,
    threeZonesKeepImproveTest: true,
    topicsCount: 10,
    exportVideoStudio: true,
    exportMediaStudio: true,
  });

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
              {activeFeature === "market" && <TrendingUp size={18} />}
              {activeFeature === "keyword" && <Search size={18} />}
              {activeFeature === "product" && <Camera size={18} />}
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                Cài đặt
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {activeFeature === "market" && "Xu Hướng Thị Trường"}
                  {activeFeature === "keyword" && "Quét Theo Từ Khóa"}
                  {activeFeature === "product" && "Quét Theo Ảnh Mẫu"}
                </span>
              </h3>
              <p className="text-[11px] text-stone-500">Lịch chạy và dữ liệu cho tính năng này</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Tab Navigation */}
        <div className="flex border-b border-stone-200 px-6 bg-white gap-6 text-xs font-bold pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "schedule"
                ? "border-rose-600 text-rose-600 font-extrabold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Clock size={14} />
            Lịch quét
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("input")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "input"
                ? "border-rose-600 text-rose-600 font-extrabold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <FileInput size={14} />
            Dữ liệu đầu vào
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("output")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "output"
                ? "border-rose-600 text-rose-600 font-extrabold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <FileOutput size={14} />
            Dữ liệu đầu ra
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs space-y-4">
          {activeTab === "schedule" && (
            <SettingsScheduleTab
              activeFeature={activeFeature}
              marketSchedule={marketSchedule}
              setMarketSchedule={setMarketSchedule}
              keywordSchedule={keywordSchedule}
              setKeywordSchedule={setKeywordSchedule}
              newKeywordInput={newKeywordInput}
              setNewKeywordInput={setNewKeywordInput}
              productMatching={productMatching}
              setProductMatching={setProductMatching}
            />
          )}

          {activeTab === "input" && (
            <SettingsInputTab
              activeFeature={activeFeature}
              marketInput={marketInput}
              setMarketInput={setMarketInput}
              keywordInput={keywordInput}
              setKeywordInput={setKeywordInput}
              productInput={productInput}
              setProductInput={setProductInput}
            />
          )}

          {activeTab === "output" && (
            <SettingsOutputTab
              activeFeature={activeFeature}
              marketOutput={marketOutput}
              setMarketOutput={setMarketOutput}
              keywordOutput={keywordOutput}
              setKeywordOutput={setKeywordOutput}
              productOutput={productOutput}
              setProductOutput={setProductOutput}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-200 bg-stone-50/70">
          <span className="text-[11px] text-stone-500 font-medium">
            Cấu hình chỉ áp dụng cho cửa hàng của bạn
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-stone-600 font-bold hover:bg-white transition text-xs"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition text-xs shadow-sm"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 size={13} className="text-white" />
                  Đã Lưu Cài Đặt!
                </>
              ) : (
                <>
                  <Save size={13} />
                  Lưu Thiết Lập
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
