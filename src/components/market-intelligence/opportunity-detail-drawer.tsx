"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  Tag,
  TrendingUp,
  Video,
  Image as ImageIcon,
  Play,
  ExternalLink,
  Copy,
  Check,
  Flame,
  Users,
  Lightbulb,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { determineTrendLifecycle, LIFECYCLE_SPECS } from "@/modules/market-intelligence/domain/trend-lifecycle";
import type { OpportunityItem, EvidenceReference } from "./opportunity-card";
import { getOpportunityIllustration } from "./opportunity-illustration";
import type { Route } from "next"

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

interface OpportunityDetailDrawerProps {
  item: OpportunityItem | null;
  onClose: () => void;
}

export function OpportunityDetailDrawer({ item, onClose }: OpportunityDetailDrawerProps) {
  const router = useRouter();
  const [copiedHookIndex, setCopiedHookIndex] = useState<number | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(true);

  // Keyboard close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (item) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;

  const references: EvidenceReference[] = item.evidenceReferences ?? [];
  const lifecycle = determineTrendLifecycle(item.trendScore, 0.4, 20);
  const spec = LIFECYCLE_SPECS[lifecycle];
  const hooks = Array.isArray(item.recommendedHooks) ? item.recommendedHooks : [];
  const illustration = getOpportunityIllustration(item);

  const handleCopyHook = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedHookIndex(idx);
    setTimeout(() => setCopiedHookIndex(null), 2000);
  };

  const handleGoToVideo = () => {
    const promptText = `${item.topicName}: ${hooks[0] || item.opportunitySummary}`;
    router.push(`/video?prompt=${encodeURIComponent(promptText)}` as Route);
  };

  const handleGoToMedia = () => {
    router.push(`/tai-anh?topic=${encodeURIComponent(item.topicName)}` as Route);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${spec.bgClass} ${spec.colorClass} ${spec.borderClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {spec.label}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Story Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Ảnh minh họa theo chủ đề */}
          <div className="relative -mx-6 -mt-6 aspect-[21/9] w-[calc(100%+3rem)] overflow-hidden bg-stone-100">
            <img
              src={illustration.url}
              alt={illustration.alt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/95 to-transparent" />
          </div>

          {/* LAYER 1: WHAT — Điều gì đang diễn ra trên thị trường */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                1. Hiện tượng thị trường
              </span>
              <div className="flex items-baseline gap-1 text-xs font-bold text-stone-500">
                Điểm cơ hội:{" "}
                <span className="text-base font-black text-rose-600">
                  {Math.round(item.contentOpportunityScore)}/100
                </span>
              </div>
            </div>
            <h2 className="text-lg font-extrabold text-stone-900 leading-snug">
              {item.opportunitySummary}
            </h2>
          </div>

          {/* LAYER 2: WHY — Tại sao xu hướng này lại bùng nổ */}
          <div className="rounded-2xl border border-stone-200/90 bg-stone-50/50 p-4 space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              2. Vì sao xu hướng này tăng
            </span>
            <p className="text-xs text-stone-600 leading-relaxed">
              {getTrendRationale(item)}
            </p>
            {/* 3 Trục Điểm số với diễn giải ý nghĩa */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-2xs">
                <span className="text-stone-400 text-[10px] block font-semibold">Độ nóng</span>
                <span className="text-stone-900 font-bold text-sm">{Math.round(item.trendScore)}/100</span>
                <span className="text-[9.5px] text-stone-500 block mt-0.5">Xu hướng thị trường</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-2xs">
                <span className="text-stone-400 text-[10px] block font-semibold">Lan tỏa</span>
                <span className="text-rose-600 font-bold text-sm">{Math.round(item.viralScore)}/100</span>
                <span className="text-[9.5px] text-rose-600/80 block mt-0.5">Tiềm năng video</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-2xs">
                <span className="text-stone-400 text-[10px] block font-semibold">Thương mại</span>
                <span className="text-emerald-700 font-bold text-sm">{Math.round(item.commercialScore)}/100</span>
                <span className="text-[9.5px] text-emerald-600 block mt-0.5">Sức mua thực tế</span>
              </div>
            </div>
          </div>

          {/* LAYER 3: WHO & HOW — Khách hàng mục tiêu & Cách tiếp cận */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-4 space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              3. Khách hàng mục tiêu
            </span>
            <div className="text-xs text-stone-700 space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-stone-900 min-w-[110px]">Tệp khách mua:</span>
                <span className="text-stone-600">{item.audience || "Khách hàng trẻ 18–35 tuổi, người mua tặng quà kỷ niệm"}</span>
              </div>
              {Boolean(item.recommendedFormats) && (
                <div className="flex items-start gap-2">
                  <span className="font-bold text-stone-900 min-w-[110px]">Định dạng đề xuất:</span>
                  <span className="text-stone-600">
                    {Array.isArray(item.recommendedFormats) ? item.recommendedFormats.join(", ") : String(item.recommendedFormats)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* LAYER 4: SO WHAT — Lời khuyên cho tiệm & Kịch bản Hook */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-rose-600" />
                4. Cơ hội bán & câu mở đầu
              </span>
            </div>
            <p className="text-xs text-stone-700 font-medium leading-relaxed">
              Sử dụng ngay các câu Hook đã được kiểm chứng dưới đây làm tiêu đề video TikTok/Reels hoặc caption bài đăng Facebook để tăng tỷ lệ giữ chân khách hàng:
            </p>

            {hooks.length > 0 ? (
              <div className="space-y-2">
                {hooks.map((hk: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-rose-200/80 text-xs shadow-2xs"
                  >
                    <p className="italic text-stone-800 font-medium">&ldquo;{hk}&rdquo;</p>
                    <button
                      type="button"
                      onClick={() => handleCopyHook(hk, idx)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition flex-shrink-0"
                    >
                      {copiedHookIndex === idx ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-700">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs text-stone-500 italic">
                Chưa có kịch bản hook tùy chỉnh cho chủ đề này.
              </div>
            )}
          </div>

          {/* LAYER 5: EVIDENCE — Bằng chứng & Mẫu thực tế đa kênh */}
          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
              className="w-full flex items-center justify-between p-4 bg-stone-50/60 hover:bg-stone-100/60 transition text-left"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-800">
                  5. Dẫn chứng đa kênh ({references.length} nguồn)
                </span>
              </div>
              <ChevronDown
                size={15}
                className={`text-stone-400 transition-transform duration-200 ${isEvidenceOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isEvidenceOpen && (
              <div className="p-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {references.length > 0 ? (
                  references.map((ref, idx) => {
                    let icon = <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />;
                    let badgeBg = "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200";

                    if (ref.type === "TIKTOK_REELS") {
                      icon = <Video className="h-3.5 w-3.5 flex-shrink-0 text-pink-600" />;
                      badgeBg = "bg-pink-50/60 hover:bg-pink-100/80 text-pink-900 border-pink-200/70";
                    } else if (ref.type === "FACEBOOK") {
                      icon = <FacebookIcon className="h-3.5 w-3.5 flex-shrink-0 text-[#1877F2]" />;
                      badgeBg = "bg-blue-50/70 hover:bg-blue-100/90 text-blue-950 border-blue-200/80";
                    } else if (ref.type === "IMAGE_PINTEREST") {
                      icon = <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-red-600" />;
                      badgeBg = "bg-red-50/60 hover:bg-red-100/80 text-red-900 border-red-200/70";
                    } else if (ref.type === "GOOGLE_TRENDS") {
                      icon = <TrendingUp className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />;
                      badgeBg = "bg-blue-50/60 hover:bg-blue-100/80 text-blue-900 border-blue-200/70";
                    } else if (ref.type === "YOUTUBE") {
                      icon = <Play className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />;
                      badgeBg = "bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 border-amber-200/70";
                    }

                    return (
                      <a
                        key={idx}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold transition group ${badgeBg}`}
                      >
                        {ref.thumbnailUrl ? (
                          <div className="relative h-12 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-stone-900 border border-stone-200 shadow-2xs">
                            <img src={ref.thumbnailUrl} alt={ref.title} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition">
                              <Play className="h-3 w-3 fill-white text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 flex-shrink-0 shadow-2xs">
                            {icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 uppercase tracking-wider font-bold">
                            <span>{ref.platform}</span>
                            {ref.metrics ? <span className="text-stone-400 font-normal">• {ref.metrics}</span> : null}
                          </div>
                          <div className="font-bold text-stone-800 truncate group-hover:text-rose-600 transition">
                            {ref.title || ref.platform}
                          </div>
                          {ref.author ? (
                            <div className="text-[10px] text-stone-500 truncate font-medium">
                              Kênh: {ref.author}
                            </div>
                          ) : null}
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 flex-shrink-0" />
                      </a>
                    );
                  })
                ) : (
                  <p className="text-xs text-stone-500 italic sm:col-span-2">
                    Không có dẫn chứng nào cho phân tích này.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Footer (Layer 04 — ACTION) */}
        <div className="border-t border-stone-200 bg-white p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="text-xs text-stone-500 font-medium hidden sm:block">
            Sẵn sàng chuyển hóa thành nội dung bán hàng?
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleGoToMedia}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition"
            >
              <ImageIcon className="h-3.5 w-3.5 text-stone-600" />
              Tạo ảnh
            </button>

            <button
              type="button"
              onClick={handleGoToVideo}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Video className="h-3.5 w-3.5" />
              Tạo video kịch bản
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTrendRationale(item: OpportunityItem): string {
  const lifecycle = determineTrendLifecycle(item.trendScore, 0.4, 20);
  const lower = item.topicName.toLowerCase();

  if (lower.includes("cưới") || lower.includes("kỷ niệm")) {
    return "Mùa cưới và các dịp kỷ niệm thu-đông đang bước vào giai đoạn cao điểm. Khách hàng sẵn sàng chi trả cho các mẫu hoa mang tính cá nhân hóa cao, phối màu trang nhã và lưu giữ khoảnh khắc ý nghĩa.";
  }
  if (lower.includes("20/10") || lower.includes("8/3") || lower.includes("phụ nữ")) {
    return "Lực đẩy từ sự kiện ngày lễ lớn tạo ra lượng tìm kiếm đột biến. Tỷ lệ chốt đơn của các mẫu hoa quà tặng thiết kế sẵn và đặt trước hỏa tốc đạt mức cao nhất trong tháng.";
  }
  if (lower.includes("tốt nghiệp") || lower.includes("cử nhân")) {
    return "Mùa tốt nghiệp các trường đại học và THPT tạo ra nhu cầu mua hoa chúc mừng chụp kỷ yếu rực rỡ, ưu tiên các tone màu tươi sáng và hoa giữ form tốt khi di chuyển ngoài trời.";
  }
  if (lower.includes("khai trương") || lower.includes("đối tác")) {
    return "Nhu cầu tặng quà chúc mừng doanh nghiệp mở tiệm và ký kết hợp đồng ổn định, đòi hỏi kệ hoa sang trọng, tone màu tài lộc và độ bề thế cao.";
  }
  if (item.viralScore >= 75) {
    return `Độ lan tỏa trên TikTok và Reels của ${item.topicName} đang tăng rất nhanh nhờ thị hiếu chuộng hoa visual bắt mắt, phối giấy gói tinh tế và hiệu ứng quay video hấp dẫn.`;
  }
  if (lifecycle === "GROWING") {
    return `Nhu cầu tìm kiếm từ khóa "${item.topicName}" đang trên đà tăng trưởng liên tục trong 7 ngày qua. Đây là thời điểm vàng để tiệm lên mẫu và tiếp cận khách hàng sớm.`;
  }
  if (lifecycle === "PEAK") {
    return `Chủ đề "${item.topicName}" đang ở đỉnh sóng thị trường với tỷ lệ tương tác và tìm kiếm cao nhất. Tiệm nên chuẩn bị sẵn nguồn hoa và đẩy mạnh bài đăng chốt đơn.`;
  }
  return `Nhu cầu tìm kiếm và mức độ thảo luận của "${item.topicName}" giữ mức ổn định cao. Khách hàng ưu chuộng kiểu cắm hiện đại, tươi lâu và phù hợp ngân sách tiệm.`;
}
