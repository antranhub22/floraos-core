"use client";

import { TrendingUp, Zap, Video, ArrowRight, Tag, Play } from "lucide-react";
import type { OpportunityItem } from "./opportunity-card";
import { determineTrendLifecycle, LIFECYCLE_SPECS } from "@/modules/market-intelligence/domain/trend-lifecycle";
import { getDualOpportunityEvidencePreview, getOpportunityHeadline } from "./opportunity-illustration";

interface BriefRisingViewProps {
  opportunities: OpportunityItem[];
  onSelectOpportunity: (item: OpportunityItem) => void;
}

export function BriefRisingView({
  opportunities,
  onSelectOpportunity,
}: BriefRisingViewProps) {
  // Sắp xếp ưu tiên các cơ hội mới nhất lên đầu, sau đó đến điểm Trend & Viral
  const sorted = [...opportunities].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return b.trendScore + b.viralScore - (a.trendScore + a.viralScore);
  });
  const risingItems = sorted.slice(0, 8);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Banner Bảng Xếp Hạng Xu Hướng */}
      <div className="rounded-2xl border border-mint-200/90 bg-gradient-to-br from-mint-50/70 via-white to-cool-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-600 text-white shadow-sm flex-shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-cool-900">Xu hướng tăng trưởng nhanh nhất</h3>
            <p className="text-xs text-cool-500 mt-0.5">
              Các phong cách hoa và từ khóa có tốc độ lan tỏa nhanh nhất trên TikTok và Google Search trong 7 ngày qua
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-mint-700 bg-mint-100/60 px-3 py-1.5 rounded-xl border border-mint-200 self-start sm:self-auto">
          <Zap size={13} className="text-mint-600" />
          <span>{risingItems.length} xu hướng đang bứt phá</span>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="space-y-3">
        {risingItems.map((item, idx) => {
          const lifecycle = determineTrendLifecycle(item.trendScore, 0.4, 20);
          const spec = LIFECYCLE_SPECS[lifecycle];
          const rankColors = [
            "bg-sand-500 text-white shadow-xs", // #1
            "bg-cool-400 text-white shadow-xs", // #2
            "bg-sand-700 text-white shadow-xs", // #3
            "bg-cool-200 text-cool-700",       // #4+
          ];
          const rankClass = rankColors[idx] || rankColors[3];
          const evidence = getDualOpportunityEvidencePreview(item);
          const headline = getOpportunityHeadline(item);

          return (
            <div
              role="button"
              tabIndex={0}
              key={`${item.id}-${idx}`}
              onClick={() => onSelectOpportunity(item)}
              className="group rounded-2xl border border-cool-200/90 bg-white p-4 shadow-2xs hover:border-mint-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Cột trái: Rank, Khung Dual Thumbnail (TikTok & YouTube) & Tên xu hướng */}
              <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black flex-shrink-0 ${rankClass}`}
                >
                  #{idx + 1}
                </span>

                {/* Khung Chứa Cả 2 Thumbnail: TikTok & YouTube */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  {/* Thumbnail TikTok */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      if (evidence.tiktok.videoUrl) {
                        e.stopPropagation();
                        window.open(evidence.tiktok.videoUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    title={`Mở xem dẫn chứng video thật trên TikTok: ${evidence.tiktok.title}`}
                    className="relative h-16 w-16 sm:w-20 rounded-xl overflow-hidden flex-shrink-0 bg-cool-950 group/tiktok shadow-xs border border-cool-200/90 cursor-pointer hover:border-petal-400 transition-all hover:scale-[1.03]"
                  >
                    <img
                      src={evidence.tiktok.thumbnailUrl}
                      alt={evidence.tiktok.alt}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover/tiktok:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* Platform Badge TikTok */}
                    <div className="absolute top-1 left-1">
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/85 text-petal-400 text-caption font-black uppercase tracking-wider backdrop-blur-xs border border-petal-500/30">
                        <Video className="h-2 w-2 text-petal-400" />
                        TikTok
                      </span>
                    </div>

                    {/* Play Icon hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover/tiktok:opacity-100 transition-opacity">
                      <div className="h-5 w-5 rounded-full bg-black/60 text-petal-400 flex items-center justify-center border border-petal-400/40">
                        <Play className="h-2.5 w-2.5 fill-current translate-x-0.2 text-petal-400" />
                      </div>
                    </div>

                    {/* Author/Metrics */}
                    <div className="absolute bottom-1 inset-x-1 flex items-center justify-between text-caption text-white/95 font-semibold drop-shadow-xs">
                      <span className="truncate" title={evidence.tiktok.author}>
                        {evidence.tiktok.author}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail YouTube */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      if (evidence.youtube.videoUrl) {
                        e.stopPropagation();
                        window.open(evidence.youtube.videoUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    title={`Mở xem dẫn chứng video thật trên YouTube: ${evidence.youtube.title}`}
                    className="relative h-16 w-20 sm:w-24 rounded-xl overflow-hidden flex-shrink-0 bg-cool-950 group/yt shadow-xs border border-cool-200/90 cursor-pointer hover:border-alert-400 transition-all hover:scale-[1.03]"
                  >
                    <img
                      src={evidence.youtube.thumbnailUrl}
                      alt={evidence.youtube.alt}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover/yt:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* Platform Badge YouTube */}
                    <div className="absolute top-1 left-1">
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-alert-600/90 text-white text-caption font-black uppercase tracking-wider backdrop-blur-xs">
                        <Play className="h-2 w-2 fill-current" />
                        YT
                      </span>
                    </div>

                    {/* Play Icon hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover/yt:opacity-100 transition-opacity">
                      <div className="h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/40">
                        <Play className="h-2.5 w-2.5 fill-current translate-x-0.2 text-white" />
                      </div>
                    </div>

                    {/* Author/Metrics */}
                    <div className="absolute bottom-1 inset-x-1 flex items-center justify-between text-caption text-white/95 font-semibold drop-shadow-xs">
                      <span className="truncate" title={evidence.youtube.author}>
                        {evidence.youtube.author}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-caption font-bold px-2 py-0.5 rounded-full border ${spec.bgClass} ${spec.colorClass} ${spec.borderClass}`}>
                      {spec.shortLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 text-caption font-bold text-mint-800 bg-mint-50/90 px-2 py-0.5 rounded-full border border-mint-200/80 shadow-2xs">
                      ⚡ {evidence.tiktok.metrics}
                    </span>
                  </div>

                  <h4 className="font-bold text-cool-900 text-sm group-hover:text-mint-700 transition truncate">
                    {headline}
                  </h4>
                </div>
              </div>

              {/* Cột giữa: Tín hiệu sóng (Trend vs Viral) */}
              <div className="flex items-center gap-4 text-xs flex-shrink-0 bg-cool-50/80 px-3.5 py-2 rounded-xl border border-cool-100">
                <div>
                  <span className="text-caption text-cool-400 block font-semibold">Độ nóng sóng</span>
                  <div className="flex items-center gap-1 font-bold text-cool-800">
                    <TrendingUp size={13} className="text-ocean-600" />
                    <span>{Math.round(item.trendScore)}/100</span>
                  </div>
                </div>

                <div className="border-l border-cool-200 pl-4">
                  <span className="text-caption text-cool-400 block font-semibold">Tốc độ Viral</span>
                  <div className="flex items-center gap-1 font-bold text-blush-600">
                    <Video size={13} className="text-petal-600" />
                    <span>{Math.round(item.viralScore)}/100</span>
                  </div>
                </div>
              </div>

              {/* Cột phải: CTA */}
              <div className="flex items-center justify-end sm:justify-start gap-1 text-xs font-bold text-mint-700 group-hover:translate-x-0.5 transition flex-shrink-0">
                <span>Xem phân tích sóng</span>
                <ArrowRight size={13} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
