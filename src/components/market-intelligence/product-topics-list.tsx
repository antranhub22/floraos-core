"use client";

import React, { useState } from "react";
import { Copy, Check, Video, FileText, ExternalLink, Sparkles, MessageSquare } from "lucide-react";
import type { ConcreteTopic } from "@/modules/market-intelligence/domain/product-intelligence-types";

interface ProductTopicsListProps {
  topics: ConcreteTopic[];
  onOpenVideoStudio?: (topic: ConcreteTopic) => void;
  onOpenMediaStudio?: (topic: ConcreteTopic) => void;
}

const ANGLE_LABELS: Record<string, { label: string; colorClass: string }> = {
  PRODUCT_SHOWCASE: { label: "Giới thiệu sản phẩm & Giá", colorClass: "bg-blue-50 text-blue-700 border-blue-200" },
  EDUCATIONAL: { label: "Chia sẻ bí quyết & Cẩm nang", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PROBLEM_SOLUTION: { label: "Gỡ rối tình huống tặng quà", colorClass: "bg-amber-50 text-amber-700 border-amber-200" },
  EMOTIONAL: { label: "Chạm cảm xúc & Tình cảm", colorClass: "bg-rose-50 text-rose-700 border-rose-200" },
  TREND: { label: "Bắt sóng trào lưu thịnh hành", colorClass: "bg-purple-50 text-purple-700 border-purple-200" },
  PRICE_VALUE: { label: "Phân khúc giá & Giá trị", colorClass: "bg-sky-50 text-sky-700 border-sky-200" },
};

export function ProductTopicsList({
  topics,
  onOpenVideoStudio,
  onOpenMediaStudio,
}: ProductTopicsListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyHook = (topic: ConcreteTopic) => {
    navigator.clipboard.writeText(`${topic.title}\n\n[Hook]: ${topic.hook}\n[CTA]: ${topic.cta}`);
    setCopiedId(topic.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Sparkles size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              5. Top 10 chủ đề nội dung tiếp thị cụ thể
            </h3>
            <p className="text-[11.5px] text-stone-500">
              Mỗi chủ đề đều có góc tiếp cận, câu mở đầu (Hook), định dạng video/ảnh và đường dẫn chứng thực tế
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {topics.map((topic, index) => {
          const angle = ANGLE_LABELS[topic.angleCategory] || { label: topic.angleCategory, colorClass: "bg-stone-100 text-stone-700 border-stone-200" };
          const isCopied = copiedId === topic.id;

          return (
            <div
              key={topic.id}
              className="rounded-xl border border-stone-200/80 bg-stone-50/30 hover:bg-white hover:border-rose-200 hover:shadow-sm p-4 space-y-3 transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Header Tag & Format */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${angle.colorClass}`}>
                    #{index + 1} · {angle.label}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                    {topic.format === "REELS_TIKTOK_9_16" ? "Video Dọc 9:16" : "Ảnh Vuông 1:1"}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm leading-snug">
                  {topic.title}
                </h4>

                {/* Hook */}
                <div className="bg-white/80 border border-stone-200/60 rounded-lg p-2.5 text-xs text-stone-700">
                  <span className="text-[10.5px] font-bold text-rose-700 block mb-0.5">
                    Câu giật tít mở đầu (Hook):
                  </span>
                  <p className="italic font-medium text-stone-800 leading-relaxed text-[11.5px]">
                    &ldquo;{topic.hook}&rdquo;
                  </p>
                </div>

                {/* Evidence Note & Link */}
                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <span className="line-clamp-1 italic">📊 {topic.evidenceNote}</span>
                  {topic.referenceUrl && (
                    <a
                      href={topic.referenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold shrink-0 ml-2"
                    >
                      Mẫu thực tế <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-200/60 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyHook(topic)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-semibold text-stone-700 transition"
                >
                  {isCopied ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-700">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Chép Hook</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  {onOpenVideoStudio && (
                    <button
                      type="button"
                      onClick={() => onOpenVideoStudio(topic)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition"
                    >
                      <Video size={12} />
                      Dựng video
                    </button>
                  )}
                  {onOpenMediaStudio && (
                    <button
                      type="button"
                      onClick={() => onOpenMediaStudio(topic)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold transition"
                    >
                      <FileText size={12} />
                      Tạo ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
