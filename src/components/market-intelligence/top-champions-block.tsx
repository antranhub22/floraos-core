"use client";

import React, { useMemo, useState } from "react";
import { Trophy, Crown, Play, Video, ArrowRight, Sparkles, ExternalLink } from "lucide-react";
import {
  findPeriodChampions,
  type PeriodChampion,
  type ChampionPeriodKey,
} from "@/modules/market-intelligence/domain/trend-timeframe";
import { determineTrendLifecycle, LIFECYCLE_SPECS } from "@/modules/market-intelligence/domain/trend-lifecycle";
import { getDualOpportunityEvidencePreview, getOpportunityHeadline } from "./opportunity-illustration";
import type { OpportunityItem } from "./opportunity-card";
import { VideoPreviewModal, type VideoPreviewModalData } from "./video-preview-modal";

interface TopChampionsBlockProps {
  opportunities: OpportunityItem[];
  onSelectOpportunity?: (item: OpportunityItem) => void;
  className?: string;
}

interface PeriodTheme {
  gradient: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  ringColor: string;
  accentScore: string;
}

const PERIOD_THEMES: Record<ChampionPeriodKey, PeriodTheme> = {
  WEEK: {
    gradient: "from-blush-500/10 via-blush-50/30 to-white",
    border: "border-blush-200/90 hover:border-blush-400",
    badgeBg: "bg-blush-100 text-blush-800 border-blush-300",
    badgeText: "text-blush-700",
    ringColor: "ring-blush-200",
    accentScore: "text-blush-600",
  },
  MONTH: {
    gradient: "from-sand-500/10 via-sand-50/30 to-white",
    border: "border-sand-200/90 hover:border-sand-400",
    badgeBg: "bg-sand-100 text-sand-900 border-sand-300",
    badgeText: "text-sand-700",
    ringColor: "ring-sand-200",
    accentScore: "text-sand-600",
  },
  QUARTER: {
    gradient: "from-orchid-500/10 via-orchid-50/30 to-white",
    border: "border-orchid-200/90 hover:border-orchid-400",
    badgeBg: "bg-orchid-100 text-orchid-900 border-orchid-300",
    badgeText: "text-orchid-700",
    ringColor: "ring-orchid-200",
    accentScore: "text-orchid-600",
  },
  HALF_YEAR: {
    gradient: "from-ocean-500/10 via-ocean-50/30 to-white",
    border: "border-ocean-200/90 hover:border-ocean-400",
    badgeBg: "bg-ocean-100 text-ocean-900 border-ocean-300",
    badgeText: "text-ocean-700",
    ringColor: "ring-ocean-200",
    accentScore: "text-ocean-600",
  },
  YEAR: {
    gradient: "from-mint-500/10 via-mint-50/30 to-white",
    border: "border-mint-200/90 hover:border-mint-400",
    badgeBg: "bg-mint-100 text-mint-900 border-mint-300",
    badgeText: "text-mint-700",
    ringColor: "ring-mint-200",
    accentScore: "text-mint-600",
  },
};

export function TopChampionsBlock({
  opportunities,
  onSelectOpportunity,
  className = "",
}: TopChampionsBlockProps) {
  const [activeVideo, setActiveVideo] = useState<VideoPreviewModalData | null>(null);

  const champions = useMemo(
    () => findPeriodChampions(opportunities),
    [opportunities]
  );

  const hasAnyChampion = champions.some((c) => c.item !== null);
  if (!hasAnyChampion) {
    return null;
  }

  return (
    <>
      <div
        className={`rounded-2xl border border-cool-200/90 bg-gradient-to-br from-cool-50 via-white to-blush-50/20 p-4 sm:p-5 shadow-xs space-y-4 ${className}`}
      >
        {/* Header bar: Bảng Vàng Quán Quân */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cool-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sand-500 to-blush-600 text-white shadow-xs">
              <Trophy size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-cool-900 flex items-center gap-1.5">
                  Bảng Vàng Xu Hướng: Quán Quân Chu Kỳ
                </h2>
                <span className="text-caption font-black px-2 py-0.5 rounded-full bg-sand-100 text-sand-800 border border-sand-300">
                  Top 1 Hall of Fame
                </span>
              </div>
              <p className="text-caption text-cool-500 font-medium">
                Cơ hội đứng đầu bảng xếp hạng theo từng mốc: Tuần · Tháng · 3 Tháng · 6 Tháng · 1 Năm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-caption font-bold text-cool-500 bg-white px-3 py-1 rounded-full border border-cool-200 shadow-2xs">
            <Crown size={12} className="text-sand-500" />
            <span>Điểm cơ hội cao nhất</span>
          </div>
        </div>

        {/* Grid 5 Cột: 5 Quán quân cho 5 chu kỳ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {champions.map((champ) => {
            const item = champ.item;
            const theme = PERIOD_THEMES[champ.key];

            if (!item) {
              return (
                <div
                  key={champ.key}
                  className="rounded-xl border border-dashed border-cool-200 bg-cool-50/50 p-4 text-center flex flex-col justify-center items-center min-h-[220px]"
                >
                  <div className="text-caption font-bold text-cool-400 mb-1">{champ.label}</div>
                  <p className="text-xs text-cool-400 font-medium">Chưa có cơ hội trong {champ.subLabel}</p>
                </div>
              );
            }

            const dualEvidence = getDualOpportunityEvidencePreview(item);
            const evidence = dualEvidence.primary;
            const headline = getOpportunityHeadline(item);
            const lifecycle = determineTrendLifecycle(item.trendScore, 0.4, 20);
            const spec = LIFECYCLE_SPECS[lifecycle];

            const handlePlayVideo = (e: React.MouseEvent) => {
              e.stopPropagation();
              setActiveVideo({
                title: evidence.title || headline,
                videoUrl: evidence.videoUrl,
                youtubeUrl: dualEvidence.youtube?.videoUrl,
                tiktokUrl: dualEvidence.tiktok?.videoUrl,
                thumbnailUrl: evidence.thumbnailUrl,
                author: evidence.author || dualEvidence.youtube?.author,
                metrics: evidence.metrics || dualEvidence.youtube?.metrics,
                topicName: item.topicName,
              });
            };

            return (
              <div
              role="button"
              tabIndex={0}
                key={champ.key}
                onClick={() => onSelectOpportunity?.(item)}
                className={`group relative rounded-xl border bg-gradient-to-b ${theme.gradient} ${theme.border} p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden`}
              >
                {/* Top Banner Tag */}
                <div className="flex items-center justify-between gap-1 mb-2.5">
                  <span
                    className={`inline-flex items-center gap-1 text-caption font-black px-2 py-0.5 rounded-full border shadow-2xs ${theme.badgeBg}`}
                  >
                    <Crown size={11} className="fill-current" />
                    {champ.label}
                  </span>
                  <span className="text-caption font-bold text-cool-400">
                    {champ.subLabel}
                  </span>
                </div>

                {/* Thumbnail Ảnh Video: Click hiển thị luôn video */}
                <div
              role="button"
              tabIndex={0}
                  onClick={handlePlayVideo}
                  title="Nhấp để xem video trực tiếp"
                  className="group/thumb relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-cool-900 mb-2.5 cursor-pointer"
                >
                  <img
                    src={evidence.thumbnailUrl}
                    alt={evidence.alt}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 group-hover/thumb:from-black/90 transition-colors" />

                  {/* Play Button Overlay ở trung tâm */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-blush-600/90 text-white flex items-center justify-center shadow-lg transform transition-all duration-200 group-hover/thumb:scale-115 group-hover/thumb:bg-blush-600 backdrop-blur-xs">
                      <Play size={16} className="fill-current translate-x-0.5" />
                    </div>
                  </div>

                  <div className="absolute left-2 top-2">
                    <span
                      className={`inline-flex items-center text-caption font-bold px-1.5 py-0.5 rounded-md border ${spec.bgClass} ${spec.colorClass} ${spec.borderClass}`}
                    >
                      {spec.shortLabel}
                    </span>
                  </div>

                  <div className="absolute right-2 top-2 bg-black/75 px-1.5 py-0.5 rounded-md text-right text-white">
                    <span className="text-xs font-black">{Math.round(item.contentOpportunityScore)}</span>
                    <span className="text-caption opacity-70 block -mt-0.5">ĐIỂM</span>
                  </div>

                  <div className="absolute left-2 bottom-1.5 text-white/90 text-caption font-bold flex items-center gap-1 group-hover/thumb:text-blush-300 transition-colors">
                    <Play size={10} className="fill-current text-blush-400" />
                    <span className="truncate max-w-[130px]">{item.topicName}</span>
                  </div>
                </div>

                {/* Title & Headline */}
                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-cool-900 text-xs leading-snug line-clamp-2 group-hover:text-blush-600 transition-colors">
                    {headline}
                  </h3>
                </div>

                {/* Mini Metrics Bar & Chi tiết */}
                <div className="mt-2.5 pt-2 border-t border-cool-100 flex items-center justify-between text-caption">
                  <div className="flex items-center gap-2 text-cool-500 font-semibold">
                    <span>Nóng: <strong className="text-cool-800">{Math.round(item.trendScore)}</strong></span>
                    <span>Viral: <strong className={theme.accentScore}>{Math.round(item.viralScore)}</strong></span>
                  </div>
                  <span className="font-bold text-blush-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Chi tiết →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal hiển thị và phát video trực tiếp */}
      <VideoPreviewModal
        isOpen={Boolean(activeVideo)}
        onClose={() => setActiveVideo(null)}
        data={activeVideo}
      />
    </>
  );
}
