"use client";

import React from "react";
import { Tag, ExternalLink, Video, Image as ImageIcon, TrendingUp, Play } from "lucide-react";
import { determineTrendLifecycle, LIFECYCLE_SPECS } from "@/modules/market-intelligence/domain/trend-lifecycle";
import { getOpportunityTimeframeMeta } from "@/modules/market-intelligence/domain/trend-timeframe";
import { getDualOpportunityEvidencePreview, getOpportunityHeadline } from "./opportunity-illustration";

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

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
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
  const dualEvidence = getDualOpportunityEvidencePreview(item);
  const evidence = dualEvidence.primary;
  const headline = getOpportunityHeadline(item);
  const timeframeMeta = getOpportunityTimeframeMeta(item.createdAt);

  return (
    <div
      onClick={() => onSelect?.(item)}
      className="group relative rounded-2xl border border-stone-200/90 bg-white shadow-xs hover:border-rose-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col overflow-hidden"
    >
      {/* Banner Video Dẫn Chứng Thực Tế */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-900 group/banner">
        <img
          src={evidence.thumbnailUrl}
          alt={evidence.alt}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

        {/* Top badges: Lifecycle + Timeframe + Platforms */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5 z-10">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${spec.bgClass} ${spec.colorClass} ${spec.borderClass}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {spec.shortLabel}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border shadow-xs ${timeframeMeta.badgeClass}`}
          >
            {timeframeMeta.label}
          </span>
          {/* Cả 2 nút dẫn chứng: TikTok & YouTube */}
          <a
            href={dualEvidence.tiktok.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Mở TikTok: ${dualEvidence.tiktok.title}`}
            className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-black/80 text-pink-400 border border-pink-500/30 backdrop-blur-xs shadow-xs hover:scale-105 transition"
          >
            <Video className="h-3 w-3 text-pink-400" />
            TikTok
          </a>
          <a
            href={dualEvidence.youtube.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Mở YouTube: ${dualEvidence.youtube.title}`}
            className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600/90 text-white border border-red-500/30 backdrop-blur-xs shadow-xs hover:scale-105 transition"
          >
            <Play className="h-3 w-3 fill-current" />
            YT
          </a>
        </div>

        {/* Điểm cơ hội */}
        <div className="absolute right-3 top-3 text-right bg-white/95 px-3 py-1.5 rounded-xl shadow-xs z-10">
          <div className="text-xl font-black text-rose-600 leading-none">
            {Math.round(item.contentOpportunityScore)}
          </div>
          <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider">
            Điểm cơ hội
          </span>
        </div>

        {/* Play overlay button */}
        <div
          onClick={(e) => {
            if (evidence.videoUrl) {
              e.stopPropagation();
              window.open(evidence.videoUrl, "_blank", "noopener,noreferrer");
            }
          }}
          title={`Mở xem video dẫn chứng trên ${evidence.platform}`}
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
        >
          <div className="h-10 w-10 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-lg opacity-80 group-hover/banner:opacity-100 group-hover/banner:scale-110 transition-all">
            <Play className="h-4 w-4 fill-current translate-x-0.5 text-stone-900" />
          </div>
        </div>

        {/* Bottom bar inside video banner: tác giả & lượt xem thật */}
        <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between text-[11px] text-white/95 font-medium drop-shadow-md z-10">
          <span className="truncate max-w-[70%] font-semibold">
            {evidence.author} • {evidence.metrics}
          </span>
          <a
            href={evidence.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10.5px] font-bold text-white/90 hover:text-white bg-white/20 hover:bg-white/30 backdrop-blur-xs px-2 py-0.5 rounded-lg transition"
          >
            <span>Xem video</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
        <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">
          {headline}
        </h3>

        {/* 3 Trục Điểm số Xu hướng Tinh gọn */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-stone-50/80 rounded-xl border border-stone-100 text-center text-xs">
          <div>
            <span className="text-stone-400 block text-[9.5px] font-semibold">Độ nóng</span>
            <span className="font-bold text-stone-800 text-xs sm:text-sm">{Math.round(item.trendScore)}/100</span>
          </div>
          <div>
            <span className="text-stone-400 block text-[9.5px] font-semibold">Lan tỏa</span>
            <span className="font-bold text-rose-600 text-xs sm:text-sm">{Math.round(item.viralScore)}/100</span>
          </div>
          <div>
            <span className="text-stone-400 block text-[9.5px] font-semibold">Thương mại</span>
            <span className="font-bold text-emerald-700 text-xs sm:text-sm">{Math.round(item.commercialScore)}/100</span>
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
    </div>
  );
}
