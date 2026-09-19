"use client";

import React from "react";
import { Flame, ArrowRight, Tag } from "lucide-react";
import type { OpportunityItem } from "./opportunity-card";
import { determineTrendLifecycle, LIFECYCLE_SPECS } from "@/modules/market-intelligence/domain/trend-lifecycle";
import { getOpportunityIllustration, getOpportunityHeadline } from "./opportunity-illustration";

interface BriefImportantViewProps {
  opportunities: OpportunityItem[];
  onSelectOpportunity: (item: OpportunityItem) => void;
}

export function BriefImportantView({
  opportunities,
  onSelectOpportunity,
}: BriefImportantViewProps) {
  // Sắp xếp giảm dần theo điểm cơ hội kinh doanh (Top ROI trước)
  const sorted = [...opportunities].sort(
    (a, b) => b.contentOpportunityScore - a.contentOpportunityScore
  );
  // Lấy top 8 cơ hội có điểm cao nhất
  const topItems = sorted.slice(0, 8);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Banner Giới Thiệu Chuyên Sâu */}
      <div className="rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/70 via-white to-stone-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm flex-shrink-0">
            <Flame size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-stone-900">Cơ hội nổi bật nhất</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Xếp hạng theo điểm tổng hợp tiềm năng thương mại, sức mua thực tế và độ nóng thị trường
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-100/60 px-3 py-1.5 rounded-xl border border-rose-200 self-start sm:self-auto">
          <span>{topItems.length} cơ hội tiềm năng cao</span>
        </div>
      </div>

      {/* Danh Sách Xếp Hạng Top Cơ Hội */}
      <div className="space-y-3">
        {topItems.map((item, idx) => {
          const lifecycle = determineTrendLifecycle(item.trendScore, 0.4, 20);
          const spec = LIFECYCLE_SPECS[lifecycle];
          const illustration = getOpportunityIllustration(item);
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
              key={item.id}
              onClick={() => onSelectOpportunity(item)}
              className="group rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs hover:border-rose-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Cột trái: Rank, Ảnh minh họa & Tên cơ hội */}
              <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black flex-shrink-0 ${rankClass}`}
                >
                  #{idx + 1}
                </span>

                <img
                  src={illustration.url}
                  alt={illustration.alt}
                  loading="lazy"
                  className="h-14 w-14 rounded-xl object-cover flex-shrink-0"
                />

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200/70">
                      <Tag size={10} /> {item.topicName}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${spec.bgClass} ${spec.colorClass} ${spec.borderClass}`}>
                      {spec.shortLabel}
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
