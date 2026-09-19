"use client";

import React from "react";
import { FeatureKey } from "./settings-schedule-tab";

export interface SettingsOutputTabProps {
  activeFeature: FeatureKey;
  marketOutput: {
    executiveSummary: boolean;
    trendLifecycle: boolean;
    threeScores: boolean;
    recommendedHooks: boolean;
    evidenceReferences: boolean;
  };
  setMarketOutput: React.Dispatch<
    React.SetStateAction<{
      executiveSummary: boolean;
      trendLifecycle: boolean;
      threeScores: boolean;
      recommendedHooks: boolean;
      evidenceReferences: boolean;
    }>
  >;
  keywordOutput: {
    commercialAdvice: boolean;
    audiencePersona: boolean;
    hooks: boolean;
    complementaryPairings: boolean;
    recommendedFormats: boolean;
  };
  setKeywordOutput: React.Dispatch<
    React.SetStateAction<{
      commercialAdvice: boolean;
      audiencePersona: boolean;
      hooks: boolean;
      complementaryPairings: boolean;
      recommendedFormats: boolean;
    }>
  >;
  productOutput: {
    matrixScores: boolean;
    threeZonesKeepImproveTest: boolean;
    topicsCount: number;
    exportVideoStudio: boolean;
    exportMediaStudio: boolean;
  };
  setProductOutput: React.Dispatch<
    React.SetStateAction<{
      matrixScores: boolean;
      threeZonesKeepImproveTest: boolean;
      topicsCount: number;
      exportVideoStudio: boolean;
      exportMediaStudio: boolean;
    }>
  >;
}

export function SettingsOutputTab({
  activeFeature,
  marketOutput,
  setMarketOutput,
  keywordOutput,
  setKeywordOutput,
  productOutput,
  setProductOutput,
}: SettingsOutputTabProps) {
  return (
    <div className="space-y-3">
      <p className="text-stone-600">Chọn nội dung muốn hiển thị trong báo cáo:</p>

      {activeFeature === "market" && (
        <div className="space-y-2 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={marketOutput.executiveSummary}
              onChange={(e) => setMarketOutput({ ...marketOutput, executiveSummary: e.target.checked })}
            />
            Tóm tắt điều hành (Executive Summary)
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={marketOutput.trendLifecycle}
              onChange={(e) => setMarketOutput({ ...marketOutput, trendLifecycle: e.target.checked })}
            />
            Nhãn vòng đời xu hướng (Rising, Peaking, Maturing)
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={marketOutput.threeScores}
              onChange={(e) => setMarketOutput({ ...marketOutput, threeScores: e.target.checked })}
            />
            3 Trục điểm số (Độ nóng, Lan tỏa, Thương mại)
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={marketOutput.recommendedHooks}
              onChange={(e) => setMarketOutput({ ...marketOutput, recommendedHooks: e.target.checked })}
            />
            Gợi ý câu mở đầu giật tít (Hook)
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={marketOutput.evidenceReferences}
              onChange={(e) => setMarketOutput({ ...marketOutput, evidenceReferences: e.target.checked })}
            />
            Dẫn chứng kèm link nguồn (5 nguồn)
          </label>
        </div>
      )}

      {activeFeature === "keyword" && (
        <div className="space-y-2 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={keywordOutput.commercialAdvice}
              onChange={(e) => setKeywordOutput({ ...keywordOutput, commercialAdvice: e.target.checked })}
            />
            Lời khuyên thương mại và định vị sản phẩm
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={keywordOutput.audiencePersona}
              onChange={(e) => setKeywordOutput({ ...keywordOutput, audiencePersona: e.target.checked })}
            />
            Tệp khách hàng mục tiêu & tâm lý mua
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={keywordOutput.hooks}
              onChange={(e) => setKeywordOutput({ ...keywordOutput, hooks: e.target.checked })}
            />
            Hook tiêu đề video / bài đăng
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={keywordOutput.recommendedFormats}
              onChange={(e) => setKeywordOutput({ ...keywordOutput, recommendedFormats: e.target.checked })}
            />
            Gợi ý định dạng mẫu hoa (Bó, Giỏ, Kệ, Bình)
          </label>
        </div>
      )}

      {activeFeature === "product" && (
        <div className="space-y-2 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={productOutput.matrixScores}
              onChange={(e) => setProductOutput({ ...productOutput, matrixScores: e.target.checked })}
            />
            Ma trận đối soát Trend Fit 3 chiều
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={productOutput.threeZonesKeepImproveTest}
              onChange={(e) => setProductOutput({ ...productOutput, threeZonesKeepImproveTest: e.target.checked })}
            />
            Khuyến nghị cải tiến 3 vùng (GIỮ hoa / CẢI TIẾN giấy gói / THỬ NGHIỆM)
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={productOutput.exportVideoStudio}
              onChange={(e) => setProductOutput({ ...productOutput, exportVideoStudio: e.target.checked })}
            />
            Tạo sẵn kịch bản xuất sang Video Studio
          </label>
          <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={productOutput.exportMediaStudio}
              onChange={(e) => setProductOutput({ ...productOutput, exportMediaStudio: e.target.checked })}
            />
            Tạo sẵn biến thể xuất sang Media Studio
          </label>
        </div>
      )}
    </div>
  );
}
