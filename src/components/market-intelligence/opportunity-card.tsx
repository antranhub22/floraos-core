"use client";

import React from "react";
import { Video, Play } from "lucide-react";
import { determineTrendLifecycle, LIFECYCLE_SPECS } from "@/modules/market-intelligence/domain/trend-lifecycle";
import { getOpportunityTimeframeMeta } from "@/modules/market-intelligence/domain/trend-timeframe";
import { getOpportunityHeadline } from "./opportunity-illustration";

export interface EvidenceReference {
  title: string;
  type: "ARTICLE" | "TIKTOK_REELS" | "IMAGE_PINTEREST" | "GOOGLE_TRENDS" | "YOUTUBE" | "FACEBOOK";
  url: string;
  platform: string;
  engagementNote?: string;
  thumbnailUrl?: string;
  author?: string;
  metrics?: string;
}

export interface OpportunityItem {
  id: string;
  topicName: string;
  audience: string | null;
  opportunitySummary: string;
  contentAngles: unknown;
  recommendedFormats: unknown;
  recommendedHooks: unknown;
  evidenceReferences?: EvidenceReference[];
  trendScore: number;
  viralScore: number;
  commercialScore: number;
  contentOpportunityScore: number;
  createdAt: string;
}

interface OpportunityCardProps {
  item: OpportunityItem;
  onSelect?: (item: OpportunityItem) => void;
}

export function OpportunityCard({ item, onSelect }: OpportunityCardProps) {
  const references = item.evidenceReferences ?? [];
  const lifecycle = determineTrendLifecycle(item.trendScore, 0.4, 20);
  const spec = LIFECYCLE_SPECS[lifecycle];
  const headline = getOpportunityHeadline(item);
  const timeframeMeta = getOpportunityTimeframeMeta(item.createdAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(item);
        }
      }}
      className="group relative rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs hover:border-rose-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 focus-visible:outline-2 focus-visible:outline-primary"
    >
      {/* Top Bar: Badges + Điểm cơ hội */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${spec.bgClass} ${spec.colorClass} ${spec.borderClass}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {spec.shortLabel}
          </span>

          <span
            className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full border shadow-2xs ${timeframeMeta.badgeClass}`}
          >
            {timeframeMeta.label}
          </span>

          {/* K3 Chỉ báo Video Dẫn Chứng Kép Gọn (PO 26/09/2026) */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10.5px] font-bold shadow-2xs"
            title="Đã đính kèm 2 video dẫn chứng thực tế (TikTok & YouTube). Mở chi tiết để xem đầy đủ."
          >
            <Video className="h-3 w-3 text-rose-600" />
            <span>2 video dẫn chứng</span>
            <span className="flex items-center gap-1 ml-0.5">
              <span className="text-[9px] bg-black text-pink-400 px-1 py-0.2 rounded font-black">
                TikTok
              </span>
              <span className="text-[9px] bg-red-600 text-white px-1 py-0.2 rounded font-black flex items-center gap-0.5">
                <Play className="h-2 w-2 fill-current" /> YT
              </span>
            </span>
          </div>
        </div>

        {/* Điểm cơ hội */}
        <div className="text-right flex-shrink-0 bg-rose-50/80 px-2.5 py-1 rounded-xl border border-rose-100 shadow-2xs">
          <div className="text-lg font-black text-rose-600 leading-none">
            {Math.round(item.contentOpportunityScore)}
          </div>
          <span className="text-[8.5px] text-stone-500 uppercase font-bold tracking-wider">
            Điểm cơ hội
          </span>
        </div>
      </div>

      {/* Headline cơ hội (Chống tràn từ khóa thô) */}
      <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">
        {headline}
      </h3>

      {/* 3 Trục Điểm số Xu hướng Tinh gọn */}
      <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-stone-50/80 rounded-xl border border-stone-100 text-center text-xs">
        <div>
          <span className="text-stone-400 block text-[9.5px] font-semibold">Độ nóng</span>
          <span className="font-bold text-stone-800 text-xs sm:text-sm">
            {Math.round(item.trendScore)}/100
          </span>
        </div>
        <div>
          <span className="text-stone-400 block text-[9.5px] font-semibold">Lan tỏa</span>
          <span className="font-bold text-rose-600 text-xs sm:text-sm">
            {Math.round(item.viralScore)}/100
          </span>
        </div>
        <div>
          <span className="text-stone-400 block text-[9.5px] font-semibold">Thương mại</span>
          <span className="font-bold text-emerald-700 text-xs sm:text-sm">
            {Math.round(item.commercialScore)}/100
          </span>
        </div>
      </div>

      {/* Footer bar: Tệp khách hàng & CTA Khám phá */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
        <div className="text-[11px] text-stone-500 truncate max-w-[60%]">
          {item.audience ? (
            <span>
              <strong className="text-stone-700">Khách:</strong> {item.audience}
            </span>
          ) : (
            <span className="italic text-stone-400">{references.length} nguồn dẫn chứng</span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(item);
          }}
          className="inline-flex items-center gap-1 text-[11.5px] font-bold text-rose-600 group-hover:text-rose-700 group-hover:translate-x-0.5 transition-all"
        >
          <span>Khám phá kịch bản</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
