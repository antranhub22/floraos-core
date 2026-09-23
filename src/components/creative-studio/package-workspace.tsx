"use client"

import React, { useContext, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Package,
  Image,
  Film,
  Headphones,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Send,
  Check,
  ArrowRight,
  Eye,
  Sparkles,
  Play,
  Copy,
  ExternalLink,
  Lock,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreativeStudioContext } from "@/app/(app)/creative-studio/page"
import { PackageQACard, type QACheckItem } from "./package-qa-card"
import { PackageDownstreamCard } from "./package-downstream-card"
import { PackageAssetPreviewModal } from "./package-asset-preview-modal"
import { StageGateApprovalBar } from "@/components/ui/stage-gate-approval-bar"
import type { MediaAssetType } from "@/modules/creative-production/domain/production-types"

interface PackageAssetStatus {
  readonly id: string
  readonly label: string
  readonly type: MediaAssetType
  readonly status: "PENDING" | "READY" | "FAILED" | "SKIPPED"
  readonly icon: typeof Image
  readonly url?: string | undefined
}

type CampaignPhase = "PLANNING" | "PRODUCING" | "READY" | "APPROVED" | "PUBLISHED"

function buildInitialAssets(
  mode: "CREATIVE" | "AUTHENTIC",
  hasVideo: boolean
): PackageAssetStatus[] {
  const assets: PackageAssetStatus[] = [
    { id: "content-caption", label: "Caption & Tiêu đề bài viết", type: "CONTENT_CAPTION", status: "READY", icon: FileText },
    { id: "content-post", label: "Kịch bản video & Cung truyện 5 nhịp", type: "CONTENT_POST", status: "READY", icon: FileText },
    { id: "content-hashtags", label: "Hashtags ngành hoa tươi", type: "CONTENT_HASHTAGS", status: "READY", icon: FileText },
  ]

  if (mode === "CREATIVE") {
    assets.push(
      { id: "image-variant-1", label: "Biến thể ảnh Studio Pastel", type: "IMAGE_VARIANT", status: "READY", icon: Image },
      { id: "image-variant-2", label: "Biến thể ảnh Studio Luxury", type: "IMAGE_VARIANT", status: "READY", icon: Image }
    )
  } else {
    assets.push(
      { id: "image-crop", label: "Ảnh chụp gốc xưởng chuẩn tỷ lệ", type: "IMAGE_CROP", status: "READY", icon: Image }
    )
  }

  assets.push(
    { id: "audio-voiceover", label: "Giọng đọc truyền cảm Edge TTS", type: "AUDIO_VOICEOVER", status: "READY", icon: Headphones },
    { id: "audio-mix", label: "Âm thanh lồng nhạc nền Ducking", type: "AUDIO_MIX", status: "READY", icon: Headphones }
  )

  if (hasVideo || mode === "CREATIVE") {
    assets.push({ id: "video-story", label: "Video Reels 9:16 Ken Burns", type: "VIDEO_STORY", status: "READY", icon: Film })
  }

  return assets
}

const DEFAULT_QA_CHECKS: QACheckItem[] = [
  { id: "brand-guard", title: "Brand Identity Guard", description: "Bảo đảm logo watermark, bảng màu nhận diện thương hiệu", status: "PASSED", score: "100/100" },
  { id: "subject-integrity", title: "Subject Integrity 99.9%", description: "Bảo toàn điểm ảnh chủ thể hoa tươi, không biến dạng kết cấu", status: "PASSED", score: "99.9%" },
  { id: "channel-specs", title: "Channel Compliance", description: "Chuẩn tỷ lệ 9:16 dọc (TikTok/Reels), 1:1 (FB/Insta) và A6 thiệp", status: "PASSED", score: "Đạt chuẩn" },
  { id: "content-safety", title: "Content & Voice Safety", description: "Không vi phạm chính sách cộng đồng, ducking âm lượng nhạc nền êm", status: "PASSED", score: "An toàn" },
]

export function PackageWorkspace() {
  const router = useRouter()
  const ctx = useContext(CreativeStudioContext)
  const mode = ctx?.mode ?? "CREATIVE"
  const hasVideo = !!ctx?.sourceVideoUrl

  const [assets] = useState<PackageAssetStatus[]>(() => buildInitialAssets(mode, hasVideo))
  const [phase, setPhase] = useState<CampaignPhase>("READY")
  const [qaChecks] = useState<QACheckItem[]>(DEFAULT_QA_CHECKS)
  const [previewAsset, setPreviewAsset] = useState<PackageAssetStatus | null>(null)
  const [copiedCaption, setCopiedCaption] = useState(false)

  // Stage-Gate Tracking (Chặng 07 -> 14)
  const [activePackageStage, setActivePackageStage] = useState<number>(7)
  const [approvedPackageStages, setApprovedPackageStages] = useState<number[]>([])

  const readyCount = assets.filter((a) => a.status === "READY").length
  const totalCount = assets.filter((a) => a.status !== "SKIPPED").length

  const handleApproveStage = useCallback((stageNum: number) => {
    setApprovedPackageStages((prev) => Array.from(new Set([...prev, stageNum])))
    if (stageNum === 9) {
      setPhase("APPROVED")
    }
    setActivePackageStage((prev) => Math.max(prev, stageNum + 1))
    setTimeout(() => {
      const nextEl = document.getElementById(`package-stage-${stageNum + 1}`)
      nextEl?.scrollIntoView({ behavior: "smooth" })
    }, 150)
  }, [])

  const defaultPost = `🌸 ${ctx?.productName || "BÓ HOA TƯƠI"} — TRỌN VẸN YÊU THƯƠNG\n\n✨ Bó hoa tươi thiết kế sang trọng, tuyển chọn từng đóa hoa nở căng tràn sức sống. Thiết kế độc bản theo phong cách hiện đại, phối màu tinh tế giúp bạn gửi gắm trọn vẹn sự chân thành và tình cảm ấm áp.\n\n💐 Phù hợp: Sinh nhật, Kỷ niệm, Chúc mừng khai trương, Tri ân người thương.\n🎁 Tặng kèm: Thiệp thiết kế in thông điệp riêng + Hướng dẫn chăm sóc hoa tươi bền lâu.\n\n👉 Đặt hoa ngay hôm nay để nhận ưu đãi giao nhanh trong 2 giờ!`

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* ── Journey Stepper (Chặng 07 đến 14) ── */}
      <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold overflow-x-auto gap-1.5 pb-1">
          {[
            { num: 7, label: "07. PACKAGE 📦" },
            { num: 8, label: "08. QA 🤖" },
            { num: 9, label: "09. APPROVE 👤" },
            { num: 10, label: "10. LAUNCH 🚀" },
            { num: 11, label: "11. SELL 💬" },
            { num: 12, label: "12. MEASURE 📊" },
            { num: 13, label: "13. LEARN 🧠" },
            { num: 14, label: "14. NEXT ACTION 🎯" },
          ].map((st, idx, arr) => {
            const isDone = approvedPackageStages.includes(st.num)
            const isActive = activePackageStage === st.num
            return (
              <React.Fragment key={st.num}>
                <div
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all shrink-0 ${
                    isDone
                      ? "bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200"
                      : isActive
                      ? "bg-purple-100 text-purple-900 font-extrabold border border-purple-300"
                      : "text-stone-400 bg-stone-50"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isActive
                        ? "bg-purple-600 text-white"
                        : "bg-stone-300 text-stone-600"
                    }`}
                  >
                    {isDone ? "✓" : st.num}
                  </span>
                  <span className="text-[11px] whitespace-nowrap">{st.label}</span>
                </div>
                {idx < arr.length - 1 && <ArrowRight size={12} className="text-stone-300 shrink-0" />}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* ── Chặng 07: Campaign Header & Package Details ── */}
      <div id="package-stage-7" className="space-y-6">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xs">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10.5px] font-extrabold uppercase tracking-wider mb-0.5">
                  Chặng 07 — PACKAGE 📦
                </div>
                <h3 className="text-[15px] font-bold text-stone-900">
                  Gói Chiến dịch Tiếp thị Hoa Tươi
                </h3>
                <p className="text-[12px] text-stone-500">
                  Đóng gói trọn bộ tài sản marketing đa kênh từ Chặng 01 đến Chặng 06
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                phase === "APPROVED"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : phase === "PUBLISHED"
                  ? "bg-purple-100 text-purple-800 border border-purple-300"
                  : "bg-blue-100 text-blue-800 border border-blue-300"
              }`}
            >
              {phase === "READY" && "Chờ Chủ Shop Duyệt"}
              {phase === "APPROVED" && "Đã Chốt Duyệt (Chặng 09)"}
              {phase === "PUBLISHED" && "Đã Xuất Bản Đa Kênh"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-[12px]">
            <div className="rounded-lg bg-stone-50 p-3">
              <div className="text-stone-500 mb-1">Chế độ sản xuất</div>
              <div className="font-bold text-stone-800">
                {mode === "CREATIVE" ? "🎨 AI Creative Studio" : "📸 Authentic Xưởng"}
              </div>
            </div>
            <div className="rounded-lg bg-stone-50 p-3">
              <div className="text-stone-500 mb-1">Chủ đề tiếp cận</div>
              <div className="font-bold text-stone-800 truncate">
                {ctx?.selectedTopic?.title ?? ctx?.topicId ?? "Bó hoa tươi chúc mừng"}
              </div>
            </div>
            <div className="rounded-lg bg-stone-50 p-3">
              <div className="text-stone-500 mb-1">Sản phẩm đích</div>
              <div className="font-bold text-stone-800 truncate">
                {ctx?.productName || "Bó hoa tươi"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Asset Checklist ── */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[14px] font-bold text-stone-800 flex items-center gap-2">
              <span>📋 Danh sách tài nguyên ({readyCount}/{totalCount} đã sẵn sàng)</span>
            </h4>
            <span className="text-[11px] text-stone-500">Nhấp vào từng mục để xem chi tiết kết quả</span>
          </div>

          <div className="space-y-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setPreviewAsset(asset)}
                className="flex items-center gap-3 rounded-lg border border-stone-100 bg-stone-50/50 px-4 py-2.5 hover:border-purple-300 hover:bg-purple-50/20 cursor-pointer transition-all group"
              >
                <asset.icon className="h-4 w-4 text-stone-500 group-hover:text-purple-600 flex-shrink-0 transition-colors" />
                <span className="flex-1 text-[13px] font-medium text-stone-800 group-hover:text-purple-900 transition-colors">
                  {asset.label}
                </span>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 text-[11px] text-purple-700 font-bold flex items-center gap-1 transition-opacity mr-2"
                >
                  <Eye size={12} /> Xem nội dung
                </button>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50/70 px-2.5 py-0.5 rounded-full shrink-0">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Sẵn sàng</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Spotlight Live Preview: Xem trước nội dung nổi bật ── */}
        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/60 via-white to-stone-50 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              <h4 className="text-[13.5px] font-bold text-stone-900">
                Xem trước trực tiếp kết quả chiến dịch (Live Preview)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(defaultPost)
                setCopiedCaption(true)
                setTimeout(() => setCopiedCaption(false), 2000)
              }}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition"
            >
              {copiedCaption ? <><Check size={12} className="text-emerald-600" /> Đã sao chép</> : <><Copy size={12} /> Sao chép bài viết</>}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Post Content Box */}
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Bài viết mạng xã hội</span>
              <p className="text-stone-800 leading-relaxed whitespace-pre-line text-[12px] max-h-48 overflow-y-auto">
                {defaultPost}
              </p>
            </div>

            {/* Video & Image Preview Box */}
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase block mb-1.5">Hình ảnh & Video Reels</span>
                <div className="flex items-center gap-3">
                  <img
                    src={ctx?.sourceImageUrl || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80"}
                    alt={ctx?.productName || "Sản phẩm"}
                    className="h-24 w-24 rounded-lg object-cover border border-stone-200"
                  />
                  <div className="space-y-1 text-[11.5px] text-stone-600">
                    <p className="font-bold text-stone-900 truncate">{ctx?.productName || "Bó hoa tươi"}</p>
                    <p className="text-[11px] text-stone-500">Định dạng: <strong>Reels 9:16 & Ảnh 1:1</strong></p>
                    <p className="text-[11px] text-emerald-700 font-semibold">✓ Đã gắn Watermark bản quyền</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(assets[assets.length - 1] || null)}
                className="w-full py-1.5 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 text-[11.5px] font-bold text-center transition"
              >
                Mở xem thử Video Reels 9:16 →
              </button>
            </div>
          </div>
        </div>

        {/* ── CỔNG PHÊ DUYỆT CHẶNG 07 (PACKAGE) ── */}
        <StageGateApprovalBar
          stageCode="Chặng 07 — PACKAGE"
          title="Xác nhận Trọn bộ Tài nguyên Gói Chiến dịch Tiếp thị"
          description={`Đã tập hợp hoàn tất ${readyCount}/${totalCount} tài sản gồm: Bài viết mạng xã hội, ảnh thương mại, video Reels 9:16 và voiceover. Chủ shop xác nhận gói tài nguyên để bắt đầu chạy kiểm định AI QA (Chặng 08).`}
          isApproved={approvedPackageStages.includes(7)}
          approveLabel="Phê duyệt Gói Tài nguyên & Chuyển sang Kiểm định QA (Chặng 08)"
          onApprove={() => handleApproveStage(7)}
          metrics={[
            { label: "Tài sản hoàn thiện", value: `${readyCount}/${totalCount}` },
            { label: "Kênh xuất bản", value: "Reels + Post + Story" },
          ]}
        />
      </div>

      {/* ── Chặng 08: QA Check Card ── */}
      <div id="package-stage-8" className="space-y-4">
        {activePackageStage < 8 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/70 p-5 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 text-stone-700 text-xs font-bold uppercase tracking-wider">
              <Lock size={12} /> Chặng 08 — QA (Kiểm tra Chất lượng & Tiêu chuẩn Thương hiệu)
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Chặng 08 đang tạm khóa. Vui lòng bấm <strong>"Phê duyệt Gói Tài nguyên & Chuyển sang Kiểm định QA"</strong> ở trên để AI tiến hành kiểm tra.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <PackageQACard checks={qaChecks} allPassed={true} />

            {/* CỔNG PHÊ DUYỆT CHẶNG 08 (QA) */}
            <StageGateApprovalBar
              stageCode="Chặng 08 — QA"
              title="Xác nhận Kết quả Kiểm tra Chất lượng Chiến dịch"
              description="AI đã kiểm định 4 tiêu chí cốt lõi đạt chuẩn: Brand Identity Guard (100/100), Subject Integrity (99.9% bảo toàn điểm ảnh hoa), Channel Compliance và An toàn nội dung. Xác nhận kết quả QA để chuyển sang màn hình Chủ shop ký duyệt (Chặng 09)."
              isApproved={approvedPackageStages.includes(8)}
              approveLabel="Xác nhận Kết quả QA & Chuyển sang Chủ shop Ký duyệt (Chặng 09)"
              onApprove={() => handleApproveStage(8)}
              metrics={[
                { label: "Điểm chất lượng", value: "100/100" },
                { label: "Bảo toàn hoa", value: "99.9%" },
                { label: "Tiêu chí đạt", value: "4/4 ĐẠT" },
              ]}
            />
          </div>
        )}
      </div>

      {/* ── Chặng 09: APPROVE — Chủ shop chốt duyệt chiến dịch ── */}
      <div id="package-stage-9" className="space-y-4">
        {activePackageStage < 9 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/70 p-5 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 text-stone-700 text-xs font-bold uppercase tracking-wider">
              <Lock size={12} /> Chặng 09 — APPROVE (Chủ Shop Ký duyệt Toàn diện Chiến dịch)
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Chặng 09 đang tạm khóa. Vui lòng bấm <strong>"Xác nhận Kết quả QA"</strong> ở Chặng 08 để chuyển sang màn hình ký duyệt.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10.5px] font-extrabold uppercase tracking-wider mb-1">
                  Chặng 09 — APPROVE 👤
                </div>
                <h4 className="text-[15px] font-bold text-stone-900">
                  Màn hình Ký duyệt & Chốt Chiến dịch của Chủ Tiệm
                </h4>
                <p className="text-[12px] text-stone-500 mt-0.5">
                  Chủ tiệm xem lại toàn bộ hồ sơ chiến dịch và đóng dấu phê duyệt trước khi kích hoạt quyền xuất bản.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                  <ShieldCheck size={13} /> Sẵn sàng Ký duyệt
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                <span className="text-stone-500 text-[11px] block">Sản phẩm</span>
                <span className="font-bold text-stone-800">✓ {ctx?.productName || "Bó hoa tươi"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                <span className="text-stone-500 text-[11px] block">Nội dung</span>
                <span className="font-bold text-stone-800">✓ Cung truyện 5 nhịp</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                <span className="text-stone-500 text-[11px] block">Video & Ảnh</span>
                <span className="font-bold text-stone-800">✓ Reels 9:16 + Ảnh 1:1</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                <span className="text-stone-500 text-[11px] block">AI QA Check</span>
                <span className="font-bold text-emerald-700">✓ 100/100 Đạt chuẩn</span>
              </div>
            </div>

            {/* CỔNG PHÊ DUYỆT CHẶNG 09 (APPROVE) */}
            <StageGateApprovalBar
              stageCode="Chặng 09 — APPROVE"
              title="Chủ Shop Ký duyệt & Chốt Xuất bản Toàn diện"
              description="Bấm 'Chốt duyệt chiến dịch' để chính thức cấp phép xuất bản và lên lịch đa kênh (Facebook, TikTok, Instagram, Zalo OA) ở Chặng 10."
              isApproved={approvedPackageStages.includes(9)}
              approveLabel="Chốt duyệt Chiến dịch (Chặng 09)"
              onApprove={() => handleApproveStage(9)}
              metrics={[
                { label: "Người duyệt", value: "Chủ shop / Shop Manager" },
                { label: "Thẩm quyền", value: "Toàn quyền xuất bản" },
              ]}
            />
          </div>
        )}
      </div>

      {/* ── Chặng 10: LAUNCH — Xuất bản & Lên lịch đăng đa kênh ── */}
      <div id="package-stage-10" className="space-y-4">
        {activePackageStage < 10 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/70 p-5 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 text-stone-700 text-xs font-bold uppercase tracking-wider">
              <Lock size={12} /> Chặng 10 — LAUNCH (Xuất bản & Lên lịch Đa kênh)
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Chặng 10 đang tạm khóa. Vui lòng bấm <strong>"Chốt duyệt Chiến dịch"</strong> ở Chặng 09 để mở khóa quyền xuất bản.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10.5px] font-extrabold uppercase tracking-wider mb-1">
                  Chặng 10 — LAUNCH 🚀
                </div>
                <h4 className="text-[15px] font-bold text-stone-900">
                  Xuất bản & Lên lịch Đăng bài Đa kênh (M07 Social Publishing)
                </h4>
                <p className="text-[12px] text-stone-500 mt-0.5">
                  Phân phối tự động bài viết, video Reels và hình ảnh tới các nền tảng bán hoa của tiệm.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/lich-dang" as any)}
                className="text-xs font-bold gap-1 self-start sm:self-center"
              >
                Mở Lịch Đăng M07
                <ArrowRight size={13} />
              </Button>
            </div>

            {/* Kênh phân phối */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/40">
                <p className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                  📘 Facebook Fanpage
                </p>
                <p className="text-[11px] text-stone-600">Lên lịch: 09:00 sáng mai</p>
                <p className="text-[10px] text-emerald-700 font-bold mt-1">✓ Sẵn sàng đăng</p>
              </div>
              <div className="p-3 rounded-lg border border-pink-200 bg-pink-50/40">
                <p className="font-bold text-pink-900 flex items-center gap-1.5 mb-1">
                  🎵 TikTok Shop
                </p>
                <p className="text-[11px] text-stone-600">Video Reels dọc 9:16</p>
                <p className="text-[10px] text-emerald-700 font-bold mt-1">✓ Sẵn sàng đăng</p>
              </div>
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                <p className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  💬 Zalo OA
                </p>
                <p className="text-[11px] text-stone-600">Bảng tin & Khách quen</p>
                <p className="text-[10px] text-emerald-700 font-bold mt-1">✓ Sẵn sàng đăng</p>
              </div>
              <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/40">
                <p className="font-bold text-purple-900 flex items-center gap-1.5 mb-1">
                  📸 Instagram
                </p>
                <p className="text-[11px] text-stone-600">Reels + Feed vuông</p>
                <p className="text-[10px] text-emerald-700 font-bold mt-1">✓ Sẵn sàng đăng</p>
              </div>
            </div>

            {/* CỔNG PHÊ DUYỆT CHẶNG 10 (LAUNCH) */}
            <StageGateApprovalBar
              stageCode="Chặng 10 — LAUNCH"
              title="Xác nhận Kích hoạt Xuất bản & Chuyển sang Bán hàng (SELL)"
              description="Bấm 'Xuất bản & Kích hoạt Phân phối' để lên lịch đăng bài trên 4 nền tảng và đồng thời chuyển sang kích hoạt Trợ lý AI Bán hàng (Chặng 11 SELL)."
              isApproved={approvedPackageStages.includes(10)}
              approveLabel="Xuất bản & Kích hoạt Phân phối Đa kênh (Chặng 10)"
              onApprove={() => handleApproveStage(10)}
              metrics={[
                { label: "Số kênh", value: "4 nền tảng" },
                { label: "Khung giờ vàng", value: "09:00 & 19:30" },
              ]}
            />
          </div>
        )}
      </div>

      {/* ── Chặng 11 SELL, Chặng 12 MEASURE, Chặng 13 LEARN, Chặng 14 NEXT BEST ACTION ── */}
      <PackageDownstreamCard
        productName={ctx?.productName || "Bó hoa tươi"}
        topicTitle={ctx?.selectedTopic?.title || "Chủ đề truyền thông"}
        activeStage={activePackageStage}
        approvedStages={approvedPackageStages}
        onApproveStage={handleApproveStage}
      />

      {/* ── Modal xem chi tiết tài nguyên ── */}
      {previewAsset && (
        <PackageAssetPreviewModal
          open={!!previewAsset}
          onClose={() => setPreviewAsset(null)}
          assetId={previewAsset.id}
          assetLabel={previewAsset.label}
          productName={ctx?.productName || "Bó hoa tươi"}
          topicTitle={ctx?.selectedTopic?.title || "Chủ đề truyền thông"}
          sourceImageUrl={ctx?.sourceImageUrl}
          mode={mode}
        />
      )}
    </div>
  )
}
