"use client";

/**
 * Creative Handoff Modal — Chặng 5 CHOOSE (FloraOS Design System Standard).
 *
 * Hiển thị overlay modal trên /thi-truong và /tai-anh để user:
 * 1. Xem lại topic đã chọn từ Chặng 04 (tiêu đề, hook, CTA, nhãn nghiệp vụ Việt hóa chuẩn)
 * 2. Xác nhận sản phẩm từ Chặng 01-02
 * 3. Chọn mode sản xuất: Sáng tạo AI (CREATIVE) hoặc Mộc & Chân thật (AUTHENTIC)
 * 4. Chọn phân hệ đích đến trong Creative Studio: Kịch bản (B), Ảnh AI (D), Video (E), Gói chiến dịch (F)
 * 5. Chọn loại đầu vào (nếu có video): Ảnh, Video, Cả hai
 * 6. Chuyển sang Creative Studio với đầy đủ URL params + sessionStorage report
 *
 * Tuân thủ nghiêm ngặt:
 * - Anti-Keyword-Dumping: Tuyệt đối không render raw enum (PRODUCT_SHOWCASE, REELS_TIKTOK_9_16)
 * - Mộc Lan FloraOS Design System: Primary #7A2E42, Sage #52643F, Gold #C89B3C, Stone neutrals
 * - Hành trình 14 bước Product-to-Market SSOT: Chặng 05 CHOOSE
 */

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Leaf,
  Image as ImageIcon,
  Video,
  ArrowRight,
  X,
  CheckCircle2,
  Quote,
  Target,
  FileText,
  Package,
  Wand2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildHandoffSearchParams } from "@/modules/creative-production/domain/build-handoff-url";
import {
  DEFAULT_PLATFORMS,
  PLATFORM_SPECS,
  PUBLISH_PLATFORMS,
  resolvePublishing,
  type PublishPlatform,
} from "@/modules/creative-production/domain/publishing-rules";
import { ProductionPlanPreview } from "@/components/creative-studio/production-plan-preview";
import {
  passportFromReport,
  RULE_PLAN_REF,
  writeScenePlan,
  patchScenePlan,
  type LoadedScenePlan,
} from "@/components/creative-studio/scene-plan-client";
import type {
  ConcreteTopic,
  ProductIntelligenceReport,
  TopicAngleCategory,
} from "@/modules/market-intelligence/domain/product-intelligence-types";

export type ProductionMode = "CREATIVE" | "AUTHENTIC";
export type SourceType = "image" | "video" | "both";
export type CreativeTargetArea = "b" | "d" | "e" | "f";

export interface CreativeHandoffModalProps {
  /** Trạng thái mở modal */
  open: boolean;
  /** Callback đóng modal */
  onClose: () => void;

  // --- Dữ liệu carry-forward từ Chặng 1-4 ---
  /** Topic user đã chọn ở Chặng 04 */
  selectedTopic: ConcreteTopic;
  /** Tên sản phẩm (Chặng 02) */
  productName: string;
  /** URL ảnh sản phẩm (Chặng 01) */
  sourceImageUrl: string;
  /** Phân hệ đích đến mong muốn (b: Content, d: Image Studio, e: Video Studio, f: Campaign Package) */
  targetArea?: string | undefined;
  /** Asset ID (nếu có) */
  assetId?: string | undefined;
  /** Product ID (nếu có) */
  productId?: string | undefined;
  /** URL video gốc (nếu user upload) */
  sourceVideoUrl?: string | undefined;
  /** Report đầy đủ (Chặng 02-04) — serialize vào sessionStorage */
  report?: ProductIntelligenceReport | null | undefined;
}

// Bảng ánh xạ nhãn góc tiếp cận sang tiếng Việt thanh lịch (Anti-Keyword-Dumping)
const ANGLE_LABELS: Record<string, { label: string; colorClass: string }> = {
  PRODUCT_SHOWCASE: {
    label: "Giới thiệu sản phẩm & Giá",
    colorClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  EDUCATIONAL: {
    label: "Chia sẻ bí quyết & Cẩm nang",
    colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  PROBLEM_SOLUTION: {
    label: "Gỡ rối tình huống tặng quà",
    colorClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  EMOTIONAL: {
    label: "Chạm cảm xúc & Tình cảm",
    colorClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  TREND: {
    label: "Bắt sóng trào lưu thịnh hành",
    colorClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  PRICE_VALUE: {
    label: "Phân khúc giá & Giá trị",
    colorClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
};

// Bảng ánh xạ định dạng nội dung sang tiếng Việt dễ hiểu
const FORMAT_LABELS: Record<string, string> = {
  REELS_TIKTOK_9_16: "Video dọc 9:16 (TikTok/Reels)",
  CAROUSEL_PHOTO_1_1: "Bộ ảnh vuông 1:1 (Carousel)",
  STORY_DAILY: "Tin hàng ngày (Story 24h)",
};

const MODE_OPTIONS: Array<{
  value: ProductionMode;
  label: string;
  badge: string;
  icon: typeof Sparkles;
  tagline: string;
  description: string;
  activeBorder: string;
  activeBg: string;
  badgeClass: string;
}> = [
  {
    value: "CREATIVE",
    label: "Sáng tạo AI",
    badge: "✨ AI Biến hóa",
    icon: Sparkles,
    tagline: "Đột phá & Lan tỏa",
    description: "Ghép bối cảnh Studio AI, cung kịch bản 5 nhịp, video viral tự động",
    activeBorder: "border-primary ring-2 ring-primary/15",
    activeBg: "bg-gradient-to-br from-rose-50/80 to-white",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
  {
    value: "AUTHENTIC",
    label: "Mộc & Chân thật",
    badge: "🌿 Giữ nguyên vẹn",
    icon: Leaf,
    tagline: "Tự nhiên & Thật thà",
    description: "Giữ 100% ảnh chụp gốc xưởng hoa, giọng đọc mộc mạc, trải nghiệm thật",
    activeBorder: "border-[#52643F] ring-2 ring-[#52643F]/15",
    activeBg: "bg-gradient-to-br from-[#F4F7F2] to-white",
    badgeClass: "bg-[#EAF0E6] text-[#52643F] border-[#52643F]/20",
  },
];

const TARGET_AREAS: Array<{
  id: CreativeTargetArea;
  label: string;
  icon: typeof FileText;
  description: string;
}> = [
  { id: "b", label: "Kịch bản & Bài viết", icon: FileText, description: "Tab B (M06)" },
  { id: "d", label: "Studio Ảnh AI", icon: Wand2, description: "Tab D (M04b)" },
  { id: "e", label: "Studio Video", icon: Video, description: "Tab E (M04c)" },
  { id: "f", label: "Gói Chiến dịch", icon: Package, description: "Tab F (Chặng 07)" },
];

const SOURCE_OPTIONS: Array<{
  value: SourceType;
  label: string;
  icon: typeof ImageIcon;
}> = [
  { value: "image", label: "Ảnh sản phẩm", icon: ImageIcon },
  { value: "video", label: "Video sản phẩm", icon: Video },
  { value: "both", label: "Cả Ảnh & Video", icon: Sparkles },
];

export function CreativeHandoffModal({
  open,
  onClose,
  selectedTopic,
  productName,
  sourceImageUrl,
  targetArea: initialTargetArea,
  assetId,
  productId,
  sourceVideoUrl,
  report,
}: CreativeHandoffModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ProductionMode>("CREATIVE");
  const [selectedArea, setSelectedArea] = useState<CreativeTargetArea>(() => {
    const a = initialTargetArea?.toLowerCase();
    if (a === "d" || a === "e" || a === "f") return a as CreativeTargetArea;
    return "b";
  });
  const [sourceType, setSourceType] = useState<SourceType>(
    sourceVideoUrl ? "both" : "image"
  );

  // Sync khi prop initialTargetArea thay đổi
  useEffect(() => {
    if (initialTargetArea) {
      const a = initialTargetArea.toLowerCase();
      if (a === "d" || a === "e" || a === "f" || a === "b") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ khu vực đích khi prop đổi
        setSelectedArea(a as CreativeTargetArea);
      }
    }
  }, [initialTargetArea]);

  // Đóng modal bằng phím ESC
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const hasVideo = Boolean(sourceVideoUrl);

  // Nhãn góc tiếp cận đã chuẩn hóa
  const angleInfo = useMemo(() => {
    const key = selectedTopic.angleCategory || "PRODUCT_SHOWCASE";
    return (
      ANGLE_LABELS[key] || {
        label: key.replace(/_/g, " "),
        colorClass: "bg-stone-100 text-stone-700 border-stone-200",
      }
    );
  }, [selectedTopic.angleCategory]);

  // Nhãn định dạng đã chuẩn hóa
  const formatLabel = useMemo(() => {
    const key = selectedTopic.format || "REELS_TIKTOK_9_16";
    return FORMAT_LABELS[key] || key.replace(/_/g, " ");
  }, [selectedTopic.format]);

  // 22/09/2026 (nợ #118): không còn nhét ảnh/report vào query string hay
  // sessionStorage — sự cố gốc của nút "Bắt đầu sáng tạo". URL chỉ mang
  // `report.id` (nếu có, để Creative Studio tự tải lại report qua
  // `GET /api/v1/product-intelligence/:id`) và `assetId` (để tự ký lại URL
  // ảnh qua `GET /api/v1/assets/:id/view-url`). Xem `build-handoff-url.ts`.
  const [handoffError, setHandoffError] = useState<string | null>(null);

  // Chặn cứng: không có assetId (ảnh chưa lưu vào kho) thì không có gì để
  // bàn giao an toàn — nút bên dưới bị khoá kèm lý do rõ ràng.
  const canStart = Boolean(assetId && assetId.trim());

  // 24/09/2026 (PO): kịch bản bối cảnh (Narrative Arc hình ảnh) sinh NGAY khi
  // chốt chủ đề ở Chặng 05 — Khu vực B/C/D/E đọc lại đúng kịch bản này qua
  // `scenePlanId`, không bắt người dùng viết lại ở từng khu vực. Khoá cố định
  // theo ảnh + chủ đề + mode: chọn lại cùng chủ đề không trừ credit lần hai.
  const [writingPlan, setWritingPlan] = useState(false);
  const [planFailed, setPlanFailed] = useState(false);
  // v2 (24/09/2026, PO): chọn NỀN TẢNG ĐĂNG → khung hình + khuôn video của cả
  // bộ tài sản; kịch bản sản xuất tổng hiện để xem/sửa TRƯỚC khi vào Studio.
  const [platforms, setPlatforms] = useState<PublishPlatform[]>([...DEFAULT_PLATFORMS]);
  const publishing = resolvePublishing(platforms);
  const [preview, setPreview] = useState<LoadedScenePlan | null>(null);

  const goToStudio = (scenePlanId: string | null) => {
    const params = buildHandoffSearchParams({
        // report.id (đã được analyzeProductIntelligence ghi đè thành id thật
        // của product_analysis_runs khi lưu thành công) đóng vai "run id".
        // Không có report thì dùng chính selectedTopic.id (tương thích lối
        // vào không qua Product Intelligence).
        runOrTopicId: report?.id || selectedTopic.id,
        selectedTopicId: selectedTopic.id,
        mode,
        source: sourceType,
        assetId: assetId!,
        productName,
        productId,
        area: selectedArea,
      });
    if (scenePlanId) params.set("scenePlanId", scenePlanId);
    router.push(`/creative-studio?${params.toString()}` as never);
  };

  const handleStart = async (fresh = false) => {
    setHandoffError(null);
    setWritingPlan(true);
    try {
      let loaded = await writeScenePlan(
        {
          mode,
          productName,
          productId,
          assetId,
          selectedTopic,
          commercialPassport: passportFromReport(report),
          platforms,
        },
        planFailed || fresh
      );
      // Cùng chủ đề đã có kịch bản (khoá cố định, không trừ credit lần hai)
      // nhưng người dùng đổi nền tảng → sửa nền tảng trên kịch bản cũ (miễn phí).
      const same =
        loaded.plan.publishing.platforms.length === platforms.length &&
        platforms.every((p) => loaded.plan.publishing.platforms.includes(p));
      if (!same && loaded.jobId) loaded = await patchScenePlan(loaded.jobId, { platforms });
      setPreview(loaded);
    } catch (err) {
      setPlanFailed(true);
      setHandoffError(
        `AI chưa viết được kịch bản bối cảnh: ${
          err instanceof Error ? err.message : "lỗi không xác định"
        }. Bấm lại để thử lần nữa, hoặc tiếp tục với kịch bản cơ bản (miễn phí).`
      );
    } finally {
      setWritingPlan(false);
    }
  };

  const handleStartWithRulePlan = () => {
    setHandoffError(null);
    try {
      goToStudio(RULE_PLAN_REF);
    } catch (err) {
      setHandoffError(err instanceof Error ? err.message : "Không thể chuyển sang Creative Studio — vui lòng thử lại.");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top accent stripe ── */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-[#C89B3C] to-[#52643F]" />

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-border bg-surface">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-primary border border-rose-200/70 text-[11px] font-bold tracking-wider uppercase mb-1">
              <Sparkles size={11} className="text-primary" />
              Chặng 05 — CHOOSE 🎯
            </div>
            <h2 className="text-[17px] font-extrabold text-stone-900 leading-tight">
              Chọn định hướng sáng tạo chiến dịch
            </h2>
            <p className="text-[12px] text-stone-500 mt-0.5">
              Xác nhận chủ đề truyền thông & chế độ sản xuất trước khi vào Creative Studio
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body (Scrollable) ── */}
        <div className="px-6 py-4 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          {preview ? (
            <ProductionPlanPreview loaded={preview} onChange={setPreview} />
          ) : (
          <>
          {/* 1. Thẻ Chủ Đề Đã Chọn */}
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
                Chủ đề đã chọn (Chặng 04)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-rose-200 text-[10.5px] font-semibold text-primary shadow-xs">
                🎬 {formatLabel}
              </span>
            </div>

            <h3 className="text-[14px] font-bold text-stone-900 leading-snug">
              {selectedTopic.title}
            </h3>

            {selectedTopic.hook && (
              <div className="flex items-start gap-2 rounded-lg bg-white/80 border border-rose-100 p-2.5">
                <Quote size={13} className="text-primary/60 mt-0.5 flex-shrink-0" />
                <p className="text-[12px] italic text-stone-700 leading-relaxed">
                  &ldquo;{selectedTopic.hook}&rdquo;
                </p>
              </div>
            )}

            {/* Badges row — Clean phrasing */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${angleInfo.colorClass}`}
              >
                {angleInfo.label}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-stone-200 bg-stone-50 text-stone-700 text-[11px] font-medium">
                {formatLabel}
              </span>
            </div>

            {selectedTopic.cta && (
              <div className="flex items-center gap-2 rounded-lg bg-[#F4F7F2] border border-[#52643F]/20 px-3 py-1.5">
                <Target size={12} className="text-[#52643F] flex-shrink-0" />
                <span className="text-[11px] font-semibold text-[#52643F]">
                  CTA: {selectedTopic.cta}
                </span>
              </div>
            )}
          </div>

          {/* 2. Thẻ Sản Phẩm Liên Kết */}
          <div className="flex items-center gap-3.5 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
            {sourceImageUrl ? (
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-white">
                <img
                  src={sourceImageUrl}
                  alt={productName}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-100 text-stone-400">
                <ImageIcon size={20} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-stone-900 truncate">
                {productName}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1.5">
                <span>📸 Dữ liệu thị giác Chặng 01–02</span>
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5">
              <CheckCircle2 size={11} className="text-emerald-600" />
              <span className="text-[10px] font-semibold text-emerald-700">Đã khớp</span>
            </div>
          </div>

          {/* 3. Loại Hình Sản Xuất */}
          <div>
            <label className="text-[11.5px] font-bold uppercase tracking-wider text-stone-700 block mb-2">
              Loại hình sản xuất
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {MODE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMode(opt.value)}
                    className={`relative flex flex-col p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${opt.activeBorder} ${opt.activeBg} shadow-xs`
                        : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                            isSelected ? "bg-white shadow-xs" : "bg-stone-100"
                          }`}
                        >
                          <Icon
                            size={14}
                            className={isSelected ? "text-primary" : "text-stone-600"}
                          />
                        </div>
                        <span className="text-[12.5px] font-bold text-stone-900">
                          {opt.label}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span
                      className={`inline-block w-fit px-1.5 py-0.5 rounded text-[9.5px] font-bold border mb-1.5 ${opt.badgeClass}`}
                    >
                      {opt.badge}
                    </span>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3b. Nền tảng đăng — quyết định khung hình + khuôn video (v2, 24/09/2026) */}
          <div>
            <label className="text-[11.5px] font-bold uppercase tracking-wider text-stone-700 block mb-2">
              Nền tảng sẽ đăng
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PUBLISH_PLATFORMS.map((p) => {
                const on = platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      setPlatforms((prev) => (on ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p]))
                    }
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      on ? "border-primary bg-rose-50 text-primary" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {PLATFORM_SPECS[p].label} · {PLATFORM_SPECS[p].ratio}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-stone-500">
              Ảnh + video sinh khung <b>{publishing.aspectRatio}</b>, video khoảng {publishing.targetSeconds}s; bài đăng cho{" "}
              {publishing.postChannels.join(", ")}.
              {publishing.otherRatios.length > 0 &&
                ` Chưa sinh khung khác (${publishing.otherRatios.map((o) => `${PLATFORM_SPECS[o.platform].label} ${o.ratio}`).join(", ")}) — mặc định 9:16.`}
            </p>
          </div>

          {/* 4. Chọn Phân Hệ Đích Đến (Direct Jump) */}
          <div>
            <label className="text-[11.5px] font-bold uppercase tracking-wider text-stone-700 block mb-2">
              Đích đến trực tiếp trong Creative Studio
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TARGET_AREAS.map((area) => {
                const Icon = area.icon;
                const isSelected = selectedArea === area.id;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedArea(area.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "border-primary bg-rose-50/70 text-primary font-bold ring-1 ring-primary/20 shadow-xs"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <Icon size={16} className={isSelected ? "text-primary" : "text-stone-500"} />
                    <span className="text-[11.5px] mt-1 font-semibold leading-tight">
                      {area.label}
                    </span>
                    <span className="text-[9.5px] text-stone-400 mt-0.5">
                      {area.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Đầu Vào Sáng Tạo (chỉ hiện khi có video) */}
          {hasVideo && (
            <div>
              <label className="text-[11.5px] font-bold uppercase tracking-wider text-stone-700 block mb-2">
                Nguồn media đầu vào
              </label>
              <div className="flex gap-2">
                {SOURCE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = sourceType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSourceType(opt.value)}
                      className={`flex flex-1 items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition ${
                        isSelected
                          ? "border-primary bg-primary text-white shadow-xs"
                          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <Icon size={14} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          </>
          )}
        </div>

        {/* ── Footer ── */}
        {(!canStart || handoffError) && (
          <div className="flex items-start gap-2 px-6 py-2.5 border-t border-amber-200 bg-amber-50/70 text-[11.5px] text-amber-800">
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <span>
              {!canStart
                ? "Ảnh chưa được lưu vào kho — quay lại Chặng 01 và tải lại ảnh trước khi sáng tạo."
                : handoffError}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-stone-50/80">
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={12} />
            </span>
            <span className="font-semibold text-stone-700">Chặng 01–04 hoàn tất</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-white transition"
            >
              Hủy
            </button>
            {preview ? (
              <>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-white transition"
                >
                  ← Chỉnh lựa chọn
                </button>
                <button
                  type="button"
                  onClick={() => void handleStart(true)}
                  disabled={writingPlan}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-white transition disabled:opacity-50"
                >
                  {writingPlan ? "Đang viết lại..." : "↻ AI viết lại (1 credit)"}
                </button>
                <Button
                  onClick={() => goToStudio(preview.jobId ?? RULE_PLAN_REF)}
                  className="gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2 shadow-xs"
                >
                  Dùng kịch bản này · vào Creative Studio
                  <ArrowRight size={14} />
                </Button>
              </>
            ) : (
              <>
                        {planFailed && (
              <button
                type="button"
                onClick={handleStartWithRulePlan}
                disabled={!canStart || writingPlan}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-white transition disabled:opacity-50"
              >
                Dùng kịch bản cơ bản
              </button>
            )}
            <Button
              onClick={() => void handleStart()}
              disabled={!canStart || writingPlan}
              title="AI viết kịch bản bối cảnh cho chủ đề này (1 credit, chỉ tính lần đầu) rồi mở Creative Studio"
              className="gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2 shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {writingPlan ? "AI đang viết kịch bản sản xuất..." : "Lên kịch bản sản xuất · AI (1 credit)"}
              <ArrowRight size={14} />
            </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
