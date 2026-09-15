"use client"

import React, { useState } from "react"
import { Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SocialPostPreview } from "@/components/templates/content-engine/social-post-preview"
import type { MultichannelPostItem } from "@/components/templates/content-engine/multichannel-post-card"

export interface PlatformFeedPost {
  id: number | string
  title: string
  content: string
  platform: string
  channel_label: string
  status: string
  scheduled_time?: string | null
  created_at?: string
  media_url?: string | null
  image_url?: string | null
  product_name?: string | null
  post_url?: string | null
  error_message?: string | null
  is_mock_media?: boolean | undefined
  is_mock_post?: boolean | undefined
}

export interface PlatformFeedPreviewProps {
  post: PlatformFeedPost | null
  shopName?: string
  fallbackImageUrl?: string
}

/**
 * Tách nội dung bài viết thành các trường nguyên tử (Headline, Body, Hashtags, CTA)
 */
function parsePostContent(rawContent: string, title?: string) {
  const lines = (rawContent || "").split("\n").map((l) => l.trim()).filter(Boolean)

  // Trích xuất hashtags
  const hashtagRegex = /#[\p{L}\w_-]+/gu
  const foundTags: string[] = []
  const matches = rawContent.match(hashtagRegex)
  if (matches) {
    for (const m of matches) {
      if (!foundTags.includes(m)) foundTags.push(m)
    }
  }

  // Nhận diện CTA
  let cta: string | undefined
  const ctaLine = lines.find(
    (l) =>
      l.startsWith("👉") ||
      l.toLowerCase().includes("inbox") ||
      l.toLowerCase().includes("liên hệ") ||
      l.toLowerCase().includes("hotline") ||
      l.toLowerCase().includes("đặt hoa")
  )
  if (ctaLine) {
    cta = ctaLine.replace(/^👉\s*/, "")
  }

  // Tiêu đề
  const headline = title || lines[0] || "Bài đăng hoa tươi"

  // Thân bài (lọc bỏ tiêu đề trùng lặp và các ký tự phân cách như ---)
  let bodyLines = lines
  if (lines.length > 0 && (lines[0] === headline || lines[0] === title)) {
    bodyLines = lines.slice(1)
  }
  bodyLines = bodyLines.filter((l) => l !== "---" && l !== "***" && !l.startsWith("Caption:") && !l.startsWith("Kịch Bản"))

  const bodyText = bodyLines.join("\n\n") || rawContent

  return {
    headline,
    bodyText,
    hashtags: foundTags.length > 0 ? foundTags : ["#HoaTuoiFloraOS", "#ThietKeDocBan", "#HoaTuoiMoiNgay"],
    cta: cta || "Nhắn tin đặt hoa tươi thiết kế giao nhanh tận nơi!",
  }
}

export type PlatformKey = "facebook" | "instagram" | "tiktok" | "zalo" | "linkedin"

function resolvePlatform(p?: string | null): PlatformKey {
  const lower = (p || "facebook").toLowerCase()
  if (lower.includes("insta")) return "instagram"
  if (lower.includes("tik")) return "tiktok"
  if (lower.includes("zalo")) return "zalo"
  if (lower.includes("link")) return "linkedin"
  return "facebook"
}

export function PlatformFeedPreview({
  post,
  shopName = "Tiệm Hoa Tươi FloraOS",
  fallbackImageUrl = "/images/sample-flower.jpg",
}: PlatformFeedPreviewProps) {
  const [platformOverride, setPlatformOverride] = useState<{
    postId: string | number | null
    platform: PlatformKey
  } | null>(null)

  const activePlatform: PlatformKey =
    platformOverride && platformOverride.postId === post?.id
      ? platformOverride.platform
      : resolvePlatform(post?.platform)

  if (!post) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed border-border bg-surface/50 min-h-[220px]">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
          <Sparkles size={18} />
        </div>
        <div className="text-[14px] font-bold text-text">Chưa chọn bài viết để xem trước</div>
        <div className="text-[12px] text-text-muted mt-1 max-w-sm">
          Nhấp vào bất kỳ bài viết nào trong danh sách trên để xem trước giao diện hiển thị thực tế trên các nền tảng mạng xã hội.
        </div>
      </Card>
    )
  }

  const { headline, bodyText, hashtags, cta } = parsePostContent(post.content, post.title)

  // Xác định đường dẫn ảnh thực tế hoặc fallback ảnh mẫu hoa tươi
  const effectiveImageUrl = post.image_url || post.media_url || fallbackImageUrl

  const previewItem: MultichannelPostItem = {
    postId: String(post.id),
    channel: activePlatform,
    channelLabel:
      activePlatform === "facebook"
        ? "Facebook Fanpage"
        : activePlatform === "instagram"
        ? "Instagram"
        : activePlatform === "tiktok"
        ? "TikTok Video"
        : activePlatform === "linkedin"
        ? "LinkedIn"
        : "Zalo OA",
    headline,
    bodyText,
    hashtags,
    cta,
    script: {
      hook: headline,
      audio_suggestion: "Nhạc Lofi nhẹ nhàng du dương · Tiệm hoa FloraOS",
      duration: "30-45 giây",
      visual_cues: ["Cận cảnh hoa tươi nghệ thuật", "Toàn cảnh góc cắm tinh tế", "Banner hotline & ưu đãi"],
    },
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Bộ chọn nền tảng xem trước */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { key: "facebook", label: "Facebook", desc: "Bảng tin Fanpage" },
          { key: "instagram", label: "Instagram", desc: "Aesthetic Grid" },
          { key: "tiktok", label: "TikTok", desc: "Video Script" },
          { key: "zalo", label: "Zalo OA", desc: "Broadcast Chat" },
          { key: "linkedin", label: "LinkedIn", desc: "B2B & Đối tác" },
        ].map((item) => {
          const isSelected = activePlatform === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() =>
                setPlatformOverride({
                  postId: post.id,
                  platform: item.key as PlatformKey,
                })
              }
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-xs text-primary font-bold"
                  : "border-border bg-surface hover:border-primary/40 text-text"
              }`}
            >
              <div className="text-[12.5px] font-bold flex items-center justify-center gap-1.5">
                {item.label}
                {isSelected && <Badge tone="success" className="text-[9px] px-1 py-0">Đang xem</Badge>}
              </div>
              <div className="mt-0.5 text-[10.5px] text-text-muted">{item.desc}</div>
            </button>
          )
        })}
      </div>

      {/* Khung mô phỏng hiển thị thực tế kèm ảnh theo template SSOT */}
      <div className="p-4 border border-border rounded-xl bg-surface/60 shadow-xs max-w-2xl mx-auto w-full space-y-2.5">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
          <span className="text-[11.5px] font-bold text-text-muted flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary" />
            Mô phỏng hiển thị trên mạng xã hội
          </span>
          <div className="flex items-center gap-1.5">
            {post.is_mock_media && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1">
                <span>🖼️</span> Ảnh mẫu (Mock Media)
              </span>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border">
              Giao diện mô phỏng (Mock Preview)
            </span>
          </div>
        </div>

        <SocialPostPreview
          post={previewItem}
          productName={post.product_name || post.title || "Bó hoa tươi thiết kế"}
          productImageUrl={effectiveImageUrl}
          shopName={shopName}
        />
      </div>
    </div>
  )
}
