"use client";

import React, { useState } from "react";
import { CalendarDays, Tag, ArrowRight, Sparkles, CheckCircle2, Video, Play } from "lucide-react";
import type { OpportunityItem } from "./opportunity-card";
import { determineTrendLifecycle, LIFECYCLE_SPECS } from "@/modules/market-intelligence/domain/trend-lifecycle";
import { getDualOpportunityEvidencePreview, getOpportunityHeadline } from "./opportunity-illustration";

interface BriefOccasionsViewProps {
  opportunities: OpportunityItem[];
  onSelectOpportunity: (item: OpportunityItem) => void;
}

const OCCASION_SECTIONS = [
  {
    id: "birthday",
    title: "1. Sinh Nhật & Chúc Mừng",
    timeframe: "Cao điểm quanh năm",
    audience: "Bạn bè, người thân, đồng nghiệp",
    stockAdvice: "Nên nhập: Hoa hồng kem dâu, Tulip pastel, Baby trắng, Cẩm chướng",
    colorAdvice: "Tông pastel dịu ngọt, tươi vui, trẻ trung",
    keywords: ["sinh nhật", "mẹ", "chúc mừng", "tặng"],
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "wedding",
    title: "2. Kỷ Niệm Ngày Cưới & Tình Yêu",
    timeframe: "Mùa cưới & ngày kỷ niệm",
    audience: "Cặp đôi, vợ chồng, người yêu",
    stockAdvice: "Nên nhập: Hồng đỏ Ecuador, Cẩm tú cầu, Lan hồ điệp trắng, Mẫu đơn",
    colorAdvice: "Tông đỏ nhung lãng mạn, hồng phấn tinh tế, trắng ngọc",
    keywords: ["cưới", "kỷ niệm", "yêu", "tình"],
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "graduation",
    title: "3. Lễ Tốt Nghiệp & Tri Ân",
    timeframe: "Mùa tốt nghiệp các trường đại học & THPT",
    audience: "Tân cử nhân, sinh viên, bạn bè tặng nhau",
    stockAdvice: "Nên nhập: Hoa hướng dương, Cúc tana, Cúc họa mi, Hồng vàng",
    colorAdvice: "Tông vàng rực rỡ, cam nhiệt huyết, trắng hy vọng",
    keywords: ["tốt nghiệp", "cử nhân", "bó hoa"],
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "grand_opening",
    title: "4. Khai Trương & Sự Kiện Doanh Nghiệp",
    timeframe: "Mở cửa hàng, thành lập công ty, đối tác",
    audience: "Khách hàng B2B, doanh nghiệp, bạn bè mở tiệm",
    stockAdvice: "Nên nhập: Lan hồ điệp chậu, Hồng môn đỏ, Đồng tiền, Thiên điểu",
    colorAdvice: "Tông đỏ tài lộc, vàng phát tài, kệ hoa đứng uy nghi",
    keywords: ["khai trương", "công ty", "đối tác"],
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

export function BriefOccasionsView({
  opportunities,
  onSelectOpportunity,
}: BriefOccasionsViewProps) {
  const [activeOccasionId, setActiveOccasionId] = useState<string>("birthday");

  const currentSection =
    OCCASION_SECTIONS.find((s) => s.id === activeOccasionId) ?? OCCASION_SECTIONS[0]!;

  // Lọc các mẫu hoa khớp với dịp lễ đang chọn
  const matchingItems = opportunities.filter((item) => {
    const text = `${item.topicName} ${item.opportunitySummary} ${item.audience || ""}`.toLowerCase();
    return currentSection.keywords.some((kw) => text.includes(kw));
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 4 Nút Chọn Sự Kiện Mùa Vụ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {OCCASION_SECTIONS.map((sec) => {
          const count = opportunities.filter((item) => {
            const text = `${item.topicName} ${item.opportunitySummary} ${item.audience || ""}`.toLowerCase();
            return sec.keywords.some((kw) => text.includes(kw));
          }).length;

          const isActive = activeOccasionId === sec.id;

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveOccasionId(sec.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                isActive
                  ? "border-purple-500 bg-purple-50/80 ring-2 ring-purple-400/50 shadow-xs"
                  : "border-stone-200 bg-white hover:border-purple-300 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-stone-900">{sec.title}</span>
                {isActive && <CheckCircle2 size={14} className="text-purple-600" />}
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-[11px] text-stone-500">{sec.timeframe}</span>
                <span className="text-xs font-black text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-100">
                  {count} mẫu hoa
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chi Tiết Hướng Dẫn Nhập Kho Cho Sự Kiện Đang Chọn */}
      <div className="rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/60 via-white to-stone-50 p-4 sm:p-5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              Kế Hoạch Chuẩn Bị: {currentSection.title}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Khách hàng mục tiêu: <strong className="text-stone-700">{currentSection.audience}</strong>
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-100/80 px-3 py-1 rounded-full self-start sm:self-auto">
            {matchingItems.length} mẫu hoa gợi ý trong kho
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-700">
          <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-1">
            <span className="font-bold text-purple-900 block text-[11.5px]">📦 Loài hoa chủ lực nên nhập:</span>
            <p className="text-stone-600">{currentSection.stockAdvice}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-1">
            <span className="font-bold text-purple-900 block text-[11.5px]">🎨 Tông màu thiết kế gợi ý:</span>
            <p className="text-stone-600">{currentSection.colorAdvice}</p>
          </div>
        </div>
      </div>

      {/* Grid Các Mẫu Hoa Cho Dịp Này */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
          <Sparkles size={13} className="text-purple-600" />
          Mẫu hoa gợi ý ({matchingItems.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matchingItems.map((item) => {
            const lifecycle = determineTrendLifecycle(item.trendScore, 0.4, 20);
            const spec = LIFECYCLE_SPECS[lifecycle];
            const dualEvidence = getDualOpportunityEvidencePreview(item);
            const evidence = dualEvidence.primary;
            const headline = getOpportunityHeadline(item);

            return (
              <div
                key={item.id}
                onClick={() => onSelectOpportunity(item)}
                className="group rounded-2xl border border-stone-200/90 bg-white shadow-2xs hover:border-purple-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col overflow-hidden"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-900">
                  <img
                    src={evidence.thumbnailUrl}
                    alt={evidence.alt}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute left-3 top-2.5 flex flex-wrap items-center gap-1.5 z-10">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${spec.bgClass} ${spec.colorClass} ${spec.borderClass}`}>
                      {spec.shortLabel}
                    </span>
                    <a
                      href={dualEvidence.tiktok.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={`Mở TikTok: ${dualEvidence.tiktok.title}`}
                      className="inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-full bg-black/80 text-pink-400 border border-pink-500/30 backdrop-blur-xs shadow-xs hover:scale-105 transition"
                    >
                      <Video className="h-2.5 w-2.5 text-pink-400" />
                      TikTok
                    </a>
                    <a
                      href={dualEvidence.youtube.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={`Mở YouTube: ${dualEvidence.youtube.title}`}
                      className="inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-full bg-red-600/90 text-white border border-red-500/30 backdrop-blur-xs shadow-xs hover:scale-105 transition"
                    >
                      <Play className="h-2.5 w-2.5 fill-current" />
                      YT
                    </a>
                  </div>
                  <div className="absolute left-3 bottom-2 flex items-center gap-2 text-[10px] text-white/90 font-medium">
                    <span className="truncate">{evidence.author}</span>
                    <span>• {evidence.metrics}</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                  <h5 className="font-bold text-stone-900 text-sm leading-snug group-hover:text-purple-700 transition line-clamp-2">
                    {headline}
                  </h5>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 text-[11px] truncate max-w-[70%]">
                      {item.audience || currentSection.audience}
                    </span>
                    <span className="text-purple-700 font-bold group-hover:translate-x-0.5 transition inline-flex items-center gap-0.5">
                      Xem mẫu <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
