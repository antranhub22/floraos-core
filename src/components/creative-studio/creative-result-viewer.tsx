"use client"

import React, { useState, useContext, useMemo } from "react"
import {
  Sparkles,
  Copy,
  Check,
  Film,
  FileText,
  Volume2,
  Share2,
  ArrowRight,
  Layers,
  Wand2,
  Clock,
  Quote,
  Hash,
  Edit3,
  CheckCircle2,
  Eye,
  Globe,
  Grid,
  Heart,
  MessageCircle,
  Send,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StageGateApprovalBar } from "@/components/ui/stage-gate-approval-bar"
import { CreativeStudioContext } from "@/app/(app)/creative-studio/page"
import {
  generateAllPlatformPosts,
  type GeneratedSocialPost,
} from "@/modules/creative-production/domain/social-post-generator"

interface NarrativeScene {
  sceneIndex: number
  beat?: string
  beatTitle?: string
  sceneDescription?: string
  voiceScript: string
  textOverlay: string
  durationSeconds: number
  motionEffect?: string
}

interface CaptionRequest {
  platform: "facebook" | "tiktok" | "instagram" | "zalo"
  tone: string
  hook: string
  cta: string
  productName?: string
  maxLength?: number
}

interface CreativeTopicResultItem {
  topicId: string
  topicTitle: string
  arc?: {
    emotionalTone?: string
    narrativeReasoning?: string
    totalDurationSeconds?: number
    scenes: NarrativeScene[]
  }
  briefs?: {
    contentBrief?: {
      captionRequests?: CaptionRequest[]
      hashtagSuggestions?: string[]
    }
    videoBrief?: {
      videoFormat?: string
      totalDurationSeconds?: number
    }
    imageBrief?: {
      variantRequests?: Array<{
        prompt: string
        preset: string
        lighting: string
        surface: string
      }>
    }
  }
}

export interface CreativeResultViewerProps {
  mode: "CREATIVE" | "AUTHENTIC"
  topicResults: CreativeTopicResultItem[]
  totalCredits?: number
  onGoToAudio?: () => void
  onGoToPackage?: () => void
}

const PLATFORMS: Array<"facebook" | "instagram" | "tiktok" | "zalo"> = [
  "facebook",
  "instagram",
  "tiktok",
  "zalo",
]

const PLATFORM_LABELS: Record<"facebook" | "instagram" | "tiktok" | "zalo", { label: string; icon: string; bgActive: string }> = {
  facebook: { label: "Facebook Fanpage", icon: "📘", bgActive: "bg-blue-600 text-white" },
  instagram: { label: "Instagram Reels & Feed", icon: "📸", bgActive: "bg-gradient-to-r from-purple-600 to-pink-600 text-white" },
  tiktok: { label: "TikTok Video (9:16)", icon: "🎵", bgActive: "bg-stone-900 text-white" },
  zalo: { label: "Zalo OA Bán hàng", icon: "💬", bgActive: "bg-blue-500 text-white" },
}

export function CreativeResultViewer({
  mode,
  topicResults,
  totalCredits = 0,
  onGoToAudio,
  onGoToPackage,
}: CreativeResultViewerProps) {
  const ctx = useContext(CreativeStudioContext)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<"facebook" | "instagram" | "tiktok" | "zalo">("facebook")
  const [viewMode, setViewMode] = useState<"tabbed" | "grid">("tabbed")
  const [customEdits, setCustomEdits] = useState<Record<string, string>>({})
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)

  const currentResult = topicResults[0]
  if (!currentResult) return null

  const arc = currentResult.arc
  const briefs = currentResult.briefs
  const captions = briefs?.contentBrief?.captionRequests || []
  const baseHashtags = briefs?.contentBrief?.hashtagSuggestions || [
    "#hoatuoi",
    "#hoasinhnhat",
    "#quatanghoatuoi",
    "#floristvietnam",
  ]

  // Trích xuất thông tin sản phẩm và topic
  const productName = ctx?.productName || currentResult.topicTitle || "Bó hoa tươi thiết kế"
  const components =
    ctx?.commercialPassport?.components ||
    ctx?.report?.components?.map((c) => c.flowerType) ||
    ["Hoa hồng kem dâu", "Hoa baby trắng", "Lá bạc Eucalyptus"]
  const colors =
    ctx?.commercialPassport?.colors ||
    ctx?.report?.attributes?.mainColors ||
    ["Pastel hồng", "Trắng kem"]
  const style =
    ctx?.commercialPassport?.style ||
    ctx?.report?.attributes?.style ||
    "Hiện đại & Tinh tế"
  const price =
    ctx?.commercialPassport?.priceRange ||
    ctx?.report?.context?.suggestedPrice ||
    "599.000đ"
  const hook = captions[0]?.hook || currentResult.topicTitle
  const cta = captions[0]?.cta || "Nhắn tin cho tiệm để nhận ưu đãi ngay hôm nay!"

  // Sinh trọn bộ 4 bài viết hoàn chỉnh đa kênh
  const generatedPosts = useMemo(() => {
    return generateAllPlatformPosts({
      mode,
      productName,
      components,
      colors,
      style,
      price,
      topicTitle: currentResult.topicTitle,
      hook,
      cta,
      hashtags: baseHashtags,
    })
  }, [mode, productName, components, colors, style, price, currentResult.topicTitle, hook, cta, baseHashtags])

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  const handleCopyAllHashtags = () => {
    const text = baseHashtags.join(" ")
    handleCopy(text, "all-hashtags")
  }

  const getPostContent = (platform: "facebook" | "instagram" | "tiktok" | "zalo") => {
    return customEdits[platform] ?? generatedPosts[platform]?.fullContent ?? ""
  }

  const handleUpdateContent = (platform: string, newText: string) => {
    setCustomEdits((prev) => ({ ...prev, [platform]: newText }))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Tiêu đề kết quả & Thông tin tổng hợp ── */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-stone-50 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Sparkles size={18} />
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-extrabold uppercase tracking-wider mb-0.5">
                {mode === "CREATIVE" ? "✨ AI CREATIVE SẢN XUẤT THÀNH CÔNG" : "🌿 AUTHENTIC XƯỞNG HOÀN THÀNH"}
              </div>
              <h3 className="text-[16px] font-extrabold text-stone-900">
                {currentResult.topicTitle || "Nội dung truyền thông hoa tươi"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {arc?.totalDurationSeconds && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-semibold">
                <Clock size={12} /> Thời lượng video: {arc.totalDurationSeconds}s
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold">
              {totalCredits} credits
            </span>
          </div>
        </div>

        {arc?.narrativeReasoning && (
          <div className="pt-3 text-xs text-stone-600 leading-relaxed">
            <span className="font-bold text-stone-800">Ý đồ kịch bản: </span>
            {arc.narrativeReasoning}
          </div>
        )}
      </div>

      {/* ── Cung truyện 5 nhịp (Narrative Arc) ── */}
      {arc && arc.scenes && arc.scenes.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Film size={18} className="text-purple-600" />
              <h4 className="text-sm font-bold text-stone-900">
                1. Kịch bản video cốt truyện 5 nhịp ({arc.scenes.length} cảnh)
              </h4>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">
              Tone cảm xúc: <strong className="text-purple-700">{arc.emotionalTone || "Chạm cảm xúc"}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {arc.scenes.map((scene) => {
              const sceneKey = `scene-${scene.sceneIndex}`
              return (
                <div
                  key={scene.sceneIndex}
                  className="rounded-xl border border-stone-100 bg-stone-50/60 p-3.5 space-y-2 text-xs hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-[10px] font-extrabold">
                        {scene.sceneIndex}
                      </span>
                      <span className="font-bold text-stone-800">
                        {scene.beatTitle || `Nhịp ${scene.sceneIndex}`}
                      </span>
                      {scene.beat && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 uppercase">
                          {scene.beat}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono flex items-center gap-1">
                      <Clock size={11} /> {scene.durationSeconds}s
                    </span>
                  </div>

                  {/* Lời thoại lồng tiếng */}
                  <div className="rounded-lg bg-white p-2.5 border border-stone-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-stone-500 text-[10.5px] font-semibold">
                      <span className="flex items-center gap-1 text-purple-700">
                        <Volume2 size={12} /> Giọng đọc lồng tiếng (Voiceover):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(scene.voiceScript, sceneKey)}
                        className="text-stone-400 hover:text-stone-700 flex items-center gap-1 transition"
                      >
                        {copiedKey === sceneKey ? (
                          <><Check size={11} className="text-emerald-600" /> Đã chép</>
                        ) : (
                          <><Copy size={11} /> Chép lời</>
                        )}
                      </button>
                    </div>
                    <p className="text-stone-800 leading-relaxed font-medium">
                      "{scene.voiceScript}"
                    </p>
                  </div>

                  {/* Text Overlay & Góc quay */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 pt-0.5">
                    {scene.textOverlay && (
                      <div>
                        Chữ video: <strong className="text-stone-800">"{scene.textOverlay}"</strong>
                      </div>
                    )}
                    {scene.motionEffect && (
                      <div>
                        Chuyển động: <span className="font-mono text-stone-700">{scene.motionEffect}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          2. BÀI VIẾT MẠNG XÃ HỘI ĐA KÊNH HOÀN CHỈNH (FULL POST COPY)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <div>
              <h4 className="text-sm font-bold text-stone-900">
                2. Bài viết mạng xã hội hoàn chỉnh đa kênh (Facebook, Instagram, TikTok, Zalo)
              </h4>
              <p className="text-[11.5px] text-stone-500">
                Nội dung đã được biên soạn và tối ưu cấu trúc riêng biệt cho từng nền tảng bán hoa.
              </p>
            </div>
          </div>

          {/* Toggle View Mode: Tabbed vs Grid */}
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setViewMode("tabbed")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === "tabbed" ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <Eye size={12} /> Xem từng kênh
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === "grid" ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <Grid size={12} /> Xem cả 4 kênh
            </button>
          </div>
        </div>

        {/* Platform Switcher Tabs (khi ở chế độ tabbed) */}
        {viewMode === "tabbed" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {PLATFORMS.map((p) => {
              const info = PLATFORM_LABELS[p]
              const isSelected = selectedPlatform === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPlatform(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? info.bgActive + " shadow-sm scale-102"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  <span className="text-sm">{info.icon}</span>
                  <span>{info.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── RENDER NỘI DUNG BÀI VIẾT (TABBED HOẶC GRID) ── */}
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
          {(viewMode === "grid" ? PLATFORMS : [selectedPlatform]).map((platform) => {
            const post = generatedPosts[platform]
            if (!post) return null
            const content = getPostContent(platform)
            const isEditing = editingPlatform === platform
            const copyKey = `post-${platform}`

            return (
              <div
                key={platform}
                className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-3 flex flex-col justify-between transition-all hover:border-stone-300"
              >
                {/* Header thẻ bài viết */}
                <div className="space-y-2 border-b border-stone-200/80 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{post.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-900">{post.platformLabel}</span>
                          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-200">
                            ✓ Đã tối ưu
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-500 block">
                          Khung giờ vàng: <strong className="text-stone-700">{post.recommendedPostingTime}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPlatform(isEditing ? null : platform)}
                        className="text-stone-600 hover:text-stone-900 text-xs font-semibold h-7 px-2 gap-1"
                      >
                        <Edit3 size={12} />
                        {isEditing ? "Đóng sửa" : "Chỉnh sửa"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(content, copyKey)}
                        className="text-xs font-bold gap-1 h-7 px-2.5 bg-white shadow-2xs hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                      >
                        {copiedKey === copyKey ? (
                          <><Check size={12} className="text-emerald-600" /> Đã sao chép</>
                        ) : (
                          <><Copy size={12} /> Sao chép bài</>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10.5px] text-stone-500 flex-wrap">
                    <span className="bg-white px-2 py-0.5 rounded border border-stone-200">
                      {post.characterCount} ký tự
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded border border-stone-200 truncate max-w-xs">
                      {post.targetAudience}
                    </span>
                  </div>
                </div>

                {/* Body bài viết (Social Post Preview) */}
                <div className="rounded-lg bg-white p-3.5 border border-stone-200 text-xs text-stone-800 shadow-2xs leading-relaxed">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={content}
                        onChange={(e) => handleUpdateContent(platform, e.target.value)}
                        rows={12}
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-xs text-stone-900 focus:border-blue-500 focus:outline-none font-mono"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setEditingPlatform(null)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-7 px-3"
                        >
                          <Check size={12} className="mr-1" /> Lưu chỉnh sửa
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line font-sans text-stone-800 space-y-1">
                      {content}
                    </div>
                  )}
                </div>

                {/* Footer thẻ: Hashtags */}
                {post.hashtags.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1">
                    {Array.from(new Set(post.hashtags)).map((tag, tagIdx) => (
                      <span
                        key={`${platform}-${tag}-${tagIdx}`}
                        className="inline-block px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10.5px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Nút sao chép toàn bộ tất cả bài viết */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
          <span>💡 Bạn có thể nhấp <strong>"Sao chép bài"</strong> ở từng kênh để dán trực tiếp lên Facebook Fanpage, TikTok Shop hoặc Zalo OA.</span>
          <button
            type="button"
            onClick={handleCopyAllHashtags}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 transition shrink-0"
          >
            {copiedKey === "all-hashtags" ? "✓ Đã sao chép tất cả hashtags" : "Sao chép tất cả hashtags →"}
          </button>
        </div>
      </div>

      {/* ── CỔNG PHÊ DUYỆT CHẶNG 06a (STAGE-GATE APPROVAL) ── */}
      {(onGoToAudio || onGoToPackage) && (
        <div className="space-y-2">
          <StageGateApprovalBar
            stageCode="Chặng 06a — NỘI DUNG & BÀI VIẾT"
            title="Phê duyệt Trọn bộ Nội dung & Bài viết Đa Kênh"
            description="Đã sản xuất hoàn chỉnh: Cung truyện 5 nhịp, 4 bài viết mạng xã hội chuyên sâu (Facebook Fanpage, Instagram Reels, TikTok Video 9:16, Zalo OA) và bộ hashtags. Chủ shop phê duyệt để tiến sang Tạo Audio Lồng tiếng & Nhạc nền (Khu vực C)."
            isApproved={false}
            approveLabel="Phê duyệt Nội dung & Chuyển sang Tạo Audio (Khu vực C) →"
            onApprove={onGoToAudio || onGoToPackage!}
            metrics={[
              { label: "Cung kịch bản", value: `${arc?.scenes?.length || 5} cảnh` },
              { label: "Bài viết đa kênh", value: "4 nền tảng đầy đủ" },
              { label: "Hashtags", value: `${baseHashtags.length} thẻ` },
            ]}
          />
          {onGoToPackage && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onGoToPackage}
                className="text-[11.5px] font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1 transition underline decoration-dotted"
              >
                ⚡ Bỏ qua tạo Audio/Ảnh/Video, đi thẳng đến Đóng gói chiến dịch (Chặng 07) →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
