"use client";

import React from "react";
import { Flame, ArrowRight, Tag, Play, Video, ExternalLink } from "lucide-react";
import type { OpportunityItem } from "./opportunity-card";
import { determineTrendLifecycle, LIFECYCLE_SPECS } from "@/modules/market-intelligence/domain/trend-lifecycle";
import { getDualOpportunityEvidencePreview, getOpportunityHeadline } from "./opportunity-illustration";

interface BriefImportantViewProps {
  opportunities: OpportunityItem[];
  onSelectOpportunity: (item: OpportunityItem) => void;
}

export function BriefImportantView({
  opportunities,
  onSelectOpportunity,
}: BriefImportantViewProps) {
  // Sắp xếp ưu tiên các cơ hội mới nhất lên đầu, sau đó đến điểm cơ hội
  const sorted = [...opportunities].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return b.contentOpportunityScore - a.contentOpportunityScore;
  });

  const topItems = sorted.slice(0, 10);

  if (topItems.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200/80 bg-white p-12 text-center shadow-2xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3">
          <Flame size={24} />
        </div>
        <h3 className="font-bold text-stone-800 text-base">Chưa có cơ hội thị trường nào</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          Kích hoạt quét tín hiệu xu hướng để hệ thống phân tích và đề xuất cơ hội kinh doanh cho tiệm hoa của bạn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header chỉ mục */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-2">
            <Flame className="h-4 w-4 text-rose-600" />
            Cơ hội nổi bật nhất
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Xếp hạng theo tín hiệu thị trường kết hợp tệp khách hàng của tiệm
          </p>
        </div>
        <span className="text-xs font-bold text-stone-400">
          Top {topItems.length} cơ hội
        </span>
      </div>

      {/* Danh Sách Xếp Hạng Top Cơ Hội */}
      <div className="space-y-3">
        {topItems.map((item, idx) => {
          const lifecycle = determineTrendLifecycle(item.trendScore, 0.4, 20);
          const spec = LIFECYCLE_SPECS[lifecycle];
          const evidence = getDualOpportunityEvidencePreview(item);
          const headline = getOpportunityHeadline(item);
          const rankColors = [
            "bg-amber-500 text-white shadow-xs", // #1
            "bg-slate-400 text-white shadow-xs", // #2
            "bg-amber-700 text-white shadow-xs", // #3
            "bg-stone-200 text-stone-700",       // #4+
          ];
          const rankClass = rankColors[idx] || rankColors[3];

          return (
            <div
              key={`${item.id}-${idx}`}
              onClick={() => onSelectOpportunity(item)}
              className="group rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs hover:border-rose-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Cột trái: Rank, Khung Dual Thumbnail (TikTok & YouTube) & Tên cơ hội */}
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
                    onClick={(e) => {
                      if (evidence.tiktok.videoUrl) {
                        e.stopPropagation();
                        window.open(evidence.tiktok.videoUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    title={`Mở xem dẫn chứng video thật trên TikTok: ${evidence.tiktok.title}`}
                    className="relative h-16 w-16 sm:w-20 rounded-xl overflow-hidden flex-shrink-0 bg-stone-950 group/tiktok shadow-xs border border-stone-200/90 cursor-pointer hover:border-pink-400 transition-all hover:scale-[1.03]"
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
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/85 text-pink-400 text-[8.5px] font-black uppercase tracking-wider backdrop-blur-xs border border-pink-500/30">
                        <Video className="h-2 w-2 text-pink-400" />
                        TikTok
                      </span>
                    </div>

                    {/* Play icon overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover/tiktok:opacity-100 transition-opacity">
                      <div className="h-5 w-5 rounded-full bg-black/60 text-pink-400 flex items-center justify-center border border-pink-400/40">
                        <Play className="h-2.5 w-2.5 fill-current translate-x-0.2 text-pink-400" />
                      </div>
                    </div>

                    {/* Metrics/Author at bottom */}
                    <div className="absolute bottom-1 inset-x-1 flex items-center justify-between text-[8px] text-white/95 font-semibold drop-shadow-xs">
                      <span className="truncate" title={evidence.tiktok.author}>
                        {evidence.tiktok.author}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail YouTube */}
                  <div
                    onClick={(e) => {
                      if (evidence.youtube.videoUrl) {
                        e.stopPropagation();
                        window.open(evidence.youtube.videoUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    title={`Mở xem dẫn chứng video thật trên YouTube: ${evidence.youtube.title}`}
                    className="relative h-16 w-20 sm:w-24 rounded-xl overflow-hidden flex-shrink-0 bg-stone-950 group/yt shadow-xs border border-stone-200/90 cursor-pointer hover:border-red-400 transition-all hover:scale-[1.03]"
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
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-red-600/90 text-white text-[8.5px] font-black uppercase tracking-wider backdrop-blur-xs">
                        <Play className="h-2 w-2 fill-current" />
                        YT
                      </span>
                    </div>

                    {/* Play icon overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover/yt:opacity-100 transition-opacity">
                      <div className="h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/40">
                        <Play className="h-2.5 w-2.5 fill-current translate-x-0.2 text-white" />
                      </div>
                    </div>

                    {/* Metrics/Author at bottom */}
                    <div className="absolute bottom-1 inset-x-1 flex items-center justify-between text-[8px] text-white/95 font-semibold drop-shadow-xs">
                      <span className="truncate" title={evidence.youtube.author}>
                        {evidence.youtube.author}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${spec.bgClass} ${spec.colorClass} ${spec.borderClass}`}>
                      {spec.shortLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded-full border border-emerald-200/80 shadow-2xs">
                      ⚡ {evidence.primary.metrics}
                    </span>
                  </div>

                  <h4 className="font-bold text-stone-900 text-sm group-hover:text-rose-700 transition truncate">
                    {headline}
                  </h4>
                </div>
              </div>

              {/* Cột giữa: 3 chỉ số thương mại */}
              <div className="flex items-center gap-3.5 text-xs flex-shrink-0 bg-stone-50/80 px-3.5 py-2 rounded-xl border border-stone-100">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">Độ nóng</span>
                  <div className="font-bold text-stone-800">{Math.round(item.trendScore)}/100</div>
                </div>

                <div className="border-l border-stone-200 pl-3.5">
                  <span className="text-[10px] text-stone-400 block font-semibold">Lan tỏa</span>
                  <div className="font-bold text-rose-600">{Math.round(item.viralScore)}/100</div>
                </div>

                <div className="border-l border-stone-200 pl-3.5">
                  <span className="text-[10px] text-stone-400 block font-semibold">Sức mua</span>
                  <div className="font-bold text-emerald-700">{Math.round(item.commercialScore)}/100</div>
                </div>
              </div>

              {/* Cột phải: Điểm cơ hội & CTA */}
              <div className="flex items-center justify-between sm:justify-start gap-3 flex-shrink-0">
                <div className="text-right">
                  <span className="text-lg font-black text-rose-600 leading-none block">
                    {Math.round(item.contentOpportunityScore)}
                  </span>
                  <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider">
                    Điểm cơ hội
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-rose-700 group-hover:translate-x-0.5 transition">
                  <span>Chi tiết</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
