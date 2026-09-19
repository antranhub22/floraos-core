"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Copy, Check, Video, Tag, Sparkles, ArrowRight } from "lucide-react";
import type { OpportunityItem } from "./opportunity-card";
import { getFlowerIllustration } from "./opportunity-illustration";

interface BriefTopicsViewProps {
  opportunities: OpportunityItem[];
  onSelectOpportunity: (item: OpportunityItem) => void;
}

export function BriefTopicsView({
  opportunities,
  onSelectOpportunity,
}: BriefTopicsViewProps) {
  const router = useRouter();
  const [copiedHook, setCopiedHook] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<"ALL" | "VIRAL" | "TUTORIAL" | "GIFTING">("ALL");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHook(text);
    setTimeout(() => setCopiedHook(null), 2000);
  };

  const handleCreateVideo = (topicName: string, hook: string) => {
    const prompt = `${topicName} - ${hook}`;
    router.push(`/video?prompt=${encodeURIComponent(prompt)}` as any);
  };

  // Trích xuất toàn bộ hooks từ danh sách cơ hội
  const allEntries: Array<{
    hook: string;
    topic: string;
    category: "VIRAL" | "TUTORIAL" | "GIFTING";
    item: OpportunityItem;
  }> = [];

  opportunities.forEach((item) => {
    if (Array.isArray(item.recommendedHooks)) {
      item.recommendedHooks.forEach((hk, idx) => {
        if (typeof hk === "string" && hk.trim()) {
          const category = idx % 3 === 0 ? "VIRAL" : idx % 3 === 1 ? "TUTORIAL" : "GIFTING";
          allEntries.push({
            hook: hk.trim(),
            topic: item.topicName,
            category,
            item,
          });
        }
      });
    }
  });

  const filteredEntries = allEntries.filter((e) => {
    if (activeCategory === "ALL") return true;
    return e.category === activeCategory;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Banner Thư Viện Kịch Bản Bán Hàng */}
      <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-stone-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm flex-shrink-0">
            <Lightbulb size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-stone-900">Thư viện kịch bản &amp; câu mở đầu</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Tổng hợp câu mở đầu giật tít để làm video TikTok, Reels và bài đăng Facebook bắt trọn cảm xúc khách hàng
            </p>
          </div>
        </div>

        {/* Filter nhóm nội dung */}
        <div className="flex items-center gap-1.5 text-xs font-bold bg-white p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className={`px-2.5 py-1 rounded-lg transition ${
              activeCategory === "ALL" ? "bg-amber-600 text-white" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Tất cả ({allEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("VIRAL")}
            className={`px-2.5 py-1 rounded-lg transition ${
              activeCategory === "VIRAL" ? "bg-amber-600 text-white" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            ⚡ Bắt trend
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("TUTORIAL")}
            className={`px-2.5 py-1 rounded-lg transition ${
              activeCategory === "TUTORIAL" ? "bg-amber-600 text-white" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            🎨 Hướng dẫn
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("GIFTING")}
            className={`px-2.5 py-1 rounded-lg transition ${
              activeCategory === "GIFTING" ? "bg-amber-600 text-white" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            🎁 Quà tặng
          </button>
        </div>
      </div>

      {/* Grid Hook Cards Tương Tác */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredEntries.map((entry, idx) => {
          const illustration = getFlowerIllustration(`${entry.item.id}-${idx}`, `${entry.topic} ${entry.hook}`);

          return (
          <div
            key={idx}
            className="rounded-2xl border border-stone-200/90 bg-white p-4 space-y-3 shadow-2xs hover:border-amber-400 hover:shadow-xs transition flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <img
                src={illustration.url}
                alt={illustration.alt}
                loading="lazy"
                className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
              />

              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/70">
                    <Tag size={10} /> {entry.topic}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                    {entry.category === "VIRAL" && "⚡ Bắt trend"}
                    {entry.category === "TUTORIAL" && "🎨 Hướng dẫn"}
                    {entry.category === "GIFTING" && "🎁 Quà tặng"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm italic font-semibold text-stone-900 leading-relaxed">
                  &ldquo;{entry.hook}&rdquo;
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onSelectOpportunity(entry.item)}
                className="text-[11px] text-stone-500 hover:text-rose-600 font-bold underline"
              >
                Xem chi tiết mẫu hoa →
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(entry.hook)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 transition"
                  title="Sao chép kịch bản"
                >
                  {copiedHook === entry.hook ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-700">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateVideo(entry.topic, entry.hook)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg shadow-2xs transition"
                  title="Tạo video kịch bản này ngay"
                >
                  <Video size={12} />
                  <span>Tạo Video</span>
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
