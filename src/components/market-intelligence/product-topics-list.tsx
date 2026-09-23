"use client";

import React, { useState } from "react";
import { Copy, Check, Video, FileText, Play, Sparkles, Target, ArrowRight, Wand2 } from "lucide-react";
import type { ConcreteTopic, TopicAngleCategory } from "@/modules/market-intelligence/domain/product-intelligence-types";
import { getTopicDualRealVideoEvidence } from "./video-evidence-catalog";

interface ProductTopicsListProps {
  topics: ConcreteTopic[];
  selectedTopicId?: string | undefined;
  onSelectTopic?: (topic: ConcreteTopic) => void;
  onOpenCreativeStudio?: (topic: ConcreteTopic) => void;
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
  selectedTopicId: externalSelectedTopicId,
  onSelectTopic,
  onOpenCreativeStudio,
}: ProductTopicsListProps) {
  const [internalSelectedTopicId, setInternalSelectedTopicId] = useState<string | null>(
    topics[0]?.id || null
  );
  const selectedTopicId = externalSelectedTopicId !== undefined ? externalSelectedTopicId : internalSelectedTopicId;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeAngleFilter, setActiveAngleFilter] = useState<string>("ALL");

  const handleCopyHook = (topic: ConcreteTopic) => {
    navigator.clipboard.writeText(`${topic.title}\n\n[Hook]: ${topic.hook}\n[CTA]: ${topic.cta}`);
    setCopiedId(topic.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSelect = (topic: ConcreteTopic) => {
    setInternalSelectedTopicId(topic.id);
    onSelectTopic?.(topic);
  };

  const filteredTopics = activeAngleFilter === "ALL"
    ? topics
    : topics.filter((t) => t.angleCategory === activeAngleFilter);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Sparkles size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              4. Khám phá 10 Chủ đề Tiếp thị & Chọn định hướng chiến dịch (Chặng 04 & 05)
            </h3>
            <p className="text-[11.5px] text-stone-500">
              Nhấp chọn 1 chủ đề tâm đắc nhất bên dưới để làm định hướng sản xuất video hoặc ảnh marketing
            </p>
          </div>
        </div>
      </div>

      {/* Filter by Angles */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveAngleFilter("ALL")}
          className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap ${
            activeAngleFilter === "ALL"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          Tất cả ({topics.length})
        </button>
        {Object.entries(ANGLE_LABELS).map(([key, item]) => {
          const count = topics.filter((t) => t.angleCategory === key).length;
          if (count === 0) return null;
          const isActive = activeAngleFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveAngleFilter(key)}
              className={`px-2.5 py-1 rounded-xl font-bold transition whitespace-nowrap border ${
                isActive
                  ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
              }`}
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Selected Topic Highlight Banner */}
      {selectedTopic && (
        <div className="rounded-xl border-2 border-rose-500 bg-rose-50/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">
              <Check size={11} /> Định hướng đang được chọn
            </span>
            <p className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-1">
              {selectedTopic.title}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenCreativeStudio && (
              <button
                type="button"
                onClick={() => onOpenCreativeStudio(selectedTopic)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Wand2 size={13} />
                Sáng tạo nội dung
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid of Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTopics.map((topic, index) => {
          const angle = ANGLE_LABELS[topic.angleCategory] || {
            label: topic.angleCategory,
            colorClass: "bg-stone-100 text-stone-700 border-stone-200",
          };
          const isCopied = copiedId === topic.id;
          const isSelected = selectedTopicId === topic.id;

          const dualEvidence = topic.dualVideoEvidence || getTopicDualRealVideoEvidence(topic.title);
          const { tiktok, youtube } = dualEvidence;

          return (
            <div
              key={topic.id}
              onClick={() => handleSelect(topic)}
              className={`rounded-xl border p-4 space-y-3.5 transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? "border-2 border-rose-500 bg-white shadow-md ring-2 ring-rose-500/10"
                  : "border-stone-200/80 bg-stone-50/30 hover:bg-white hover:border-rose-300 hover:shadow-xs"
              }`}
            >
              <div className="space-y-2.5">
                {/* Header Tag, Format & Select Radio */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${angle.colorClass}`}>
                      #{index + 1} · {angle.label}
                    </span>
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      {topic.format === "REELS_TIKTOK_9_16" ? "Video 9:16" : "Ảnh 1:1"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(topic);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition ${
                      isSelected
                        ? "bg-rose-600 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check size={11} /> Đang chọn
                      </>
                    ) : (
                      "Chọn chủ đề này"
                    )}
                  </button>
                </div>

                {/* Title */}
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm leading-snug">
                  {topic.title}
                </h4>

                {/* Hook Box */}
                <div className="bg-white/90 border border-stone-200/70 rounded-lg p-2.5 text-xs text-stone-700">
                  <span className="text-[10.5px] font-bold text-rose-700 block mb-0.5">
                    Câu giật tít mở đầu (Hook):
                  </span>
                  <p className="italic font-medium text-stone-800 leading-relaxed text-[11.5px]">
                    &ldquo;{topic.hook}&rdquo;
                  </p>
                </div>

                {/* Dẫn chứng Video Kép (Dual Video Evidence) */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10.5px] font-bold text-stone-600 block">
                    {tiktok.isLiveEvidence === true && youtube.isLiveEvidence === true
                      ? "Dẫn chứng Video Kép (TikTok & YouTube):"
                      : "Video tham khảo (TikTok & YouTube):"}
                  </span>
                  {(tiktok.isLiveEvidence !== true || youtube.isLiveEvidence !== true) && (
                    <span className="text-[9.5px] text-amber-700 block">
                      Danh mục tham khảo tuyển chọn — lượt xem/tương tác là ước tính, không phải số liệu thời gian thực.
                    </span>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Thumbnail TikTok (9:16 dọc) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(tiktok.videoUrl, "_blank");
                      }}
                      className="group/tt relative rounded-lg overflow-hidden border border-stone-200 bg-black cursor-pointer hover:border-cyan-400 transition flex flex-col"
                    >
                      <div className="relative aspect-[9/14] w-full overflow-hidden">
                        {tiktok.isLiveEvidence === true ? (
                          <img
                            src={tiktok.thumbnailUrl}
                            alt={tiktok.alt || tiktok.title}
                            className="h-full w-full object-cover group-hover/tt:scale-105 transition duration-300"
                          />
                        ) : (
                          // Danh mục tham khảo không có ảnh TikTok thật — không mượn ảnh YouTube.
                          <div className="h-full w-full flex items-center justify-center bg-stone-900 text-[10px] text-stone-300 px-2 text-center">
                            Mở kết quả tìm kiếm TikTok
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover/tt:bg-black/10 transition flex items-center justify-center">
                          <span className="h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center group-hover/tt:scale-110 transition">
                            <Play size={10} fill="white" className="ml-0.5" />
                          </span>
                        </div>
                        <span className="absolute top-1.5 left-1.5 inline-flex items-center px-1.5 py-0.2 rounded bg-black/80 text-[#00f2fe] text-[9px] font-extrabold tracking-wider">
                          TikTok
                        </span>
                      </div>
                      <div className="p-1.5 bg-stone-900/90 text-white text-[10px]">
                        {/* TikTok tham khảo là TRANG TÌM KIẾM, không phải một video cụ thể —
                            không hiển thị tác giả/lượt tim như thể có thật (23/09/2026). */}
                        {tiktok.isLiveEvidence === true ? (
                          <>
                            <p className="font-bold truncate">{tiktok.author}</p>
                            <p className="text-[9px] text-stone-300 truncate">{tiktok.metrics}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold truncate">Tìm trên TikTok</p>
                            <p className="text-[9px] text-stone-300 truncate">{tiktok.title}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Thumbnail YouTube (16:9 ngang) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(youtube.videoUrl, "_blank");
                      }}
                      className="group/yt relative rounded-lg overflow-hidden border border-stone-200 bg-black cursor-pointer hover:border-red-500 transition flex flex-col justify-between"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <img
                          src={youtube.thumbnailUrl}
                          alt={youtube.alt || youtube.title}
                          className="h-full w-full object-cover group-hover/yt:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover/yt:bg-black/10 transition flex items-center justify-center">
                          <span className="h-6 w-6 rounded-full bg-red-600/90 text-white flex items-center justify-center group-hover/yt:scale-110 transition">
                            <Play size={10} fill="white" className="ml-0.5" />
                          </span>
                        </div>
                        <span className="absolute top-1.5 left-1.5 inline-flex items-center px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-extrabold tracking-wider">
                          YouTube
                        </span>
                      </div>
                      <div className="p-1.5 bg-stone-900/90 text-white text-[10px] flex-1 flex flex-col justify-end">
                        <p className="font-bold truncate">{youtube.author}</p>
                        <p className="text-[9px] text-stone-300 truncate">
                          {youtube.isLiveEvidence === true ? youtube.metrics : `${youtube.metrics} (ước tính)`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence Note */}
                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
                  <span className="line-clamp-1 italic text-[10.5px]">📊 {topic.evidenceNote}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-200/60 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyHook(topic);
                  }}
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
                  {onOpenCreativeStudio && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCreativeStudio(topic);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition"
                    >
                      <Wand2 size={12} />
                      Sáng tạo nội dung
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
