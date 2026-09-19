"use client";

import React from "react";
import { FeatureKey } from "./settings-schedule-tab";

export interface SettingsInputTabProps {
  activeFeature: FeatureKey;
  marketInput: {
    geoVN: boolean;
    geoHN: boolean;
    geoSG: boolean;
    sourceGoogle: boolean;
    sourceTikTok: boolean;
    sourceYouTube: boolean;
    sourcePinterest: boolean;
    timeframe: string;
    depth: string;
  };
  setMarketInput: React.Dispatch<
    React.SetStateAction<{
      geoVN: boolean;
      geoHN: boolean;
      geoSG: boolean;
      sourceGoogle: boolean;
      sourceTikTok: boolean;
      sourceYouTube: boolean;
      sourcePinterest: boolean;
      timeframe: string;
      depth: string;
    }>
  >;
  keywordInput: {
    defaultStyle: string;
    channel: string;
    priceTier: string;
  };
  setKeywordInput: React.Dispatch<
    React.SetStateAction<{
      defaultStyle: string;
      channel: string;
      priceTier: string;
    }>
  >;
  productInput: {
    extractFlowers: boolean;
    extractColors: boolean;
    extractPackaging: boolean;
    inferOccasions: boolean;
  };
  setProductInput: React.Dispatch<
    React.SetStateAction<{
      extractFlowers: boolean;
      extractColors: boolean;
      extractPackaging: boolean;
      inferOccasions: boolean;
    }>
  >;
}

export function SettingsInputTab({
  activeFeature,
  marketInput,
  setMarketInput,
  keywordInput,
  setKeywordInput,
  productInput,
  setProductInput,
}: SettingsInputTabProps) {
  return (
    <div className="space-y-3">
      <p className="text-stone-600">Chọn nguồn dữ liệu muốn thu thập:</p>

      {activeFeature === "market" && (
        <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={marketInput.sourceGoogle}
              onChange={(e) => setMarketInput({ ...marketInput, sourceGoogle: e.target.checked })}
            />
            Google Search Trends
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={marketInput.sourceTikTok}
              onChange={(e) => setMarketInput({ ...marketInput, sourceTikTok: e.target.checked })}
            />
            TikTok Short Video Trends
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={marketInput.sourcePinterest}
              onChange={(e) => setMarketInput({ ...marketInput, sourcePinterest: e.target.checked })}
            />
            Pinterest Visual Trends
          </label>
        </div>
      )}

      {activeFeature === "keyword" && (
        <div className="space-y-2.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
          <div className="space-y-1">
            <label className="font-semibold text-stone-700">Phong cách phối hoa mặc định:</label>
            <select
              value={keywordInput.defaultStyle}
              onChange={(e) => setKeywordInput({ ...keywordInput, defaultStyle: e.target.value })}
              className="h-8 w-full rounded-lg border border-stone-300 bg-white px-2 text-xs"
            >
              <option value="Romantic & Tinh tế">Romantic & Tinh tế (Hàn Quốc / Pháp)</option>
              <option value="Vintage & Cổ điển">Vintage & Cổ điển (Tone cam cháy)</option>
              <option value="Hiện đại & Tối giản">Hiện đại & Tối giản (Minimalist)</option>
            </select>
          </div>
        </div>
      )}

      {activeFeature === "product" && (
        <div className="space-y-2 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
          <span className="font-bold text-stone-800 block">Các thành phần Vision AI cần bóc tách:</span>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={productInput.extractFlowers}
              onChange={(e) => setProductInput({ ...productInput, extractFlowers: e.target.checked })}
            />
            Tên hoa, số lượng ước tính & vai trò (Chủ đạo / Phụ trợ / Lá)
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={productInput.extractColors}
              onChange={(e) => setProductInput({ ...productInput, extractColors: e.target.checked })}
            />
            Phối màu sắc (Màu chủ đạo, màu phụ trợ)
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={productInput.extractPackaging}
              onChange={(e) => setProductInput({ ...productInput, extractPackaging: e.target.checked })}
            />
            Chất liệu bao bì & phụ kiện (Giấy gói, ruy băng, nơ)
          </label>
        </div>
      )}
    </div>
  );
}
