import React, { useState } from "react"
import { Copy, Check, Send, Sparkles, Edit3, MessageCircle, Eye } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SocialPostPreview } from "./social-post-preview"

export interface MultichannelPostItem {
  postId?: string
  channel: "facebook" | "instagram" | "tiktok" | "zalo" | "linkedin"
  channelLabel: string
  headline: string
  bodyText: string
  hashtags: string[]
  cta?: string
  script?: {
    hook?: string
    duration?: string
    audio_suggestion?: string
    visual_cues?: string[]
  }
}

export interface MultichannelPostCardProps {
  posts: MultichannelPostItem[]
  productName?: string | undefined
  productImageUrl?: string | undefined
  modelInfo?: {
    provider?: string | undefined
    modelName?: string | undefined
    isFallback?: boolean | undefined
  } | undefined
  onSchedulePost?: (post: MultichannelPostItem) => void
  onUpdatePost?: (channel: string, updated: Partial<MultichannelPostItem>) => void
}

/**
 * MultichannelPostCard (Thẻ bài đăng bán hàng đa kênh M07 — SocialFlow)
 * Hỗ trợ Preview giao diện thực tế và phân rã trường nguyên tử để sửa trực tiếp.
 */
export function MultichannelPostCard({
  posts,
  productName = "Sản phẩm hoa tươi",
  productImageUrl,
  modelInfo,
  onSchedulePost,
  onUpdatePost,
}: MultichannelPostCardProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>(posts[0]?.channel || "facebook")
  const [copied, setCopied] = useState(false)
  const [copiedZalo, setCopiedZalo] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview")

  const currentPost = posts.find((p) => p.channel === selectedChannel) || posts[0]

  const handleCopyAll = () => {
    if (!currentPost) return
    const ctaText = currentPost.cta ? `\n\n${currentPost.cta}` : ""
    const tagText = currentPost.hashtags?.length ? `\n\n${currentPost.hashtags.join(" ")}` : ""
    const text = `${currentPost.headline}\n\n${currentPost.bodyText}${ctaText}${tagText}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyZaloQuick = () => {
    if (!currentPost) return
    const text = `🌸 [${productName}] ${currentPost.headline}\n\n${currentPost.bodyText}\n\n👉 ${currentPost.cta || "Nhắn tiệm để nhận báo giá & ảnh thực tế ạ!"}`
    navigator.clipboard.writeText(text)
    setCopiedZalo(true)
    setTimeout(() => setCopiedZalo(false), 2000)
  }

  if (!currentPost) return null

  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted">M07 AI Content Engine</span>
            {modelInfo?.isFallback ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                🛡️ Offline Fallback
              </span>
            ) : modelInfo?.provider === "ollama" ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                🤖 Local LLM: {modelInfo.modelName || "qwen2.5:7b"} (GPU Metal)
              </span>
            ) : modelInfo?.provider === "openai" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                ⚡ Cloud AI: OpenAI ({modelInfo.modelName || "gpt-4o"})
              </span>
            ) : modelInfo?.provider === "gemini" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                ✨ Cloud AI: Google Gemini ({modelInfo.modelName || "gemini-flash"})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 dark:text-gray-400 bg-gray-500/10 px-2.5 py-0.5 rounded-full border border-gray-500/30">
                🚀 AI: {modelInfo?.provider} ({modelInfo?.modelName})
              </span>
            )}
          </div>
          <div className="text-[16px] font-extrabold text-text">Nội dung tiếp thị đa kênh đã sẵn sàng</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="success" className="gap-1">
            <Sparkles size={12} />
            {productName}
          </Badge>
        </div>
      </div>

      {/* Thanh công cụ: Chọn Kênh & Chuyển đổi Xem trước / Biên tập */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        {/* Thanh chọn Kênh */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {posts.map((post) => (
            <button
              key={post.channel}
              type="button"
              onClick={() => setSelectedChannel(post.channel)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                selectedChannel === post.channel
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-text-muted hover:text-text hover:bg-surface-alt border border-border/50"
              }`}
            >
              {post.channel === "facebook" && "📘"}
              {post.channel === "instagram" && "📸"}
              {post.channel === "tiktok" && "🎵"}
              {post.channel === "zalo" && "💬"}
              {post.channel === "linkedin" && "💼"}
              {post.channelLabel}
            </button>
          ))}
        </div>

        {/* Chuyển đổi giữa Chế độ Xem trước thực tế và Biên tập chi tiết */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border flex-shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              viewMode === "preview"
                ? "bg-primary text-white shadow-xs"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Eye size={13} />
            <span>Xem trước thực tế</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              viewMode === "edit"
                ? "bg-primary text-white shadow-xs"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Edit3 size={13} />
            <span>Biên tập chi tiết</span>
          </button>
        </div>
      </div>

      {/* Nội dung theo Chế độ hiển thị */}
      {viewMode === "preview" ? (
        <div className="py-2 bg-surface/30 rounded-xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-muted flex items-center gap-1.5 uppercase tracking-wider">
              <Eye size={14} className="text-primary" />
              Giao diện bài đăng thực tế ({currentPost.channelLabel})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("edit")}
              className="text-xs gap-1 text-primary hover:underline font-semibold h-7 px-2"
            >
              <Edit3 size={12} />
              Chỉnh sửa câu từ
            </Button>
          </div>

          <SocialPostPreview
            post={currentPost}
            productName={productName}
            productImageUrl={productImageUrl}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-background p-4.5">
          {/* Tiêu đề / Hook */}
          <div>
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1">
              {currentPost.channel === "tiktok" ? "Hook mở đầu (0-3s)" : "Tiêu đề bài viết"}
            </label>
          {isEditing ? (
            <input
              type="text"
              value={currentPost.headline}
              onChange={(e) =>
                onUpdatePost?.(currentPost.channel, { headline: e.target.value })
              }
              className="w-full text-sm font-bold text-text border border-border rounded-lg px-3 py-1.5 bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <div className="text-sm font-bold text-text">{currentPost.headline}</div>
          )}
        </div>

        {/* Thân bài / Kịch bản */}
        <div>
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1">
            Nội dung chi tiết
          </label>
          {isEditing ? (
            <textarea
              rows={6}
              value={currentPost.bodyText}
              onChange={(e) =>
                onUpdatePost?.(currentPost.channel, { bodyText: e.target.value })
              }
              className="w-full text-xs text-text border border-border rounded-lg p-3 bg-surface focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          ) : (
            <div className="text-xs text-text leading-relaxed whitespace-pre-line bg-surface/50 p-3 rounded-lg border border-border/50">
              {currentPost.bodyText}
            </div>
          )}
        </div>

        {/* Kịch bản quay TikTok nếu có */}
        {currentPost.channel === "tiktok" && currentPost.script && (
          <div className="rounded-lg border border-border bg-surface p-3 text-xs flex flex-col gap-1.5">
            <div className="font-bold text-primary flex items-center gap-1.5">
              <span>🎬</span> Gợi ý kịch bản quay video (30-45s)
            </div>
            {currentPost.script.audio_suggestion && (
              <div className="text-text-muted">
                <span className="font-semibold text-text">Âm thanh:</span> {currentPost.script.audio_suggestion}
              </div>
            )}
            {currentPost.script.visual_cues && (
              <ul className="list-disc list-inside text-text-muted pl-1 space-y-0.5">
                {currentPost.script.visual_cues.map((cue, idx) => (
                  <li key={idx}>{cue}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Lời kêu gọi hành động (CTA) */}
        <div>
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1">
            Lời kêu gọi hành động (CTA)
          </label>
          {isEditing ? (
            <input
              type="text"
              value={currentPost.cta || ""}
              onChange={(e) =>
                onUpdatePost?.(currentPost.channel, { cta: e.target.value })
              }
              className="w-full text-xs text-text border border-border rounded-lg px-3 py-1.5 bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <div className="text-xs font-medium text-primary italic">
              {currentPost.cta || "Nhắn tin cho tiệm để được tư vấn thiết kế hoa riêng nhé!"}
            </div>
          )}
        </div>

        {/* Hashtags */}
        <div>
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1">
            Hashtags ({currentPost.hashtags?.length || 0})
          </label>
          {isEditing ? (
            <input
              type="text"
              value={currentPost.hashtags?.join(" ") || ""}
              onChange={(e) =>
                onUpdatePost?.(currentPost.channel, {
                  hashtags: e.target.value.split(" ").filter((t) => t.trim().length > 0),
                })
              }
              className="w-full text-xs text-primary border border-border rounded-lg px-3 py-1.5 bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="#HoaTuoi #Florist #HoaSinhNhat"
            />
          ) : (
            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-primary">
              {currentPost.hashtags?.map((tag, idx) => (
                <span key={idx} className="bg-primary/10 px-2 py-0.5 rounded-md">
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )}

      {/* Thanh công cụ hành động phía dưới */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyZaloQuick}
            className="gap-1.5 text-xs text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-50"
          >
            {copiedZalo ? <Check size={14} className="text-emerald-600" /> : <MessageCircle size={14} />}
            {copiedZalo ? "Đã chép mẫu Zalo" : "Copy nhanh Zalo"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCopyAll} className="gap-1.5 text-xs">
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copied ? "Đã sao chép" : "Sao chép toàn bài"}
          </Button>
        </div>

        {onSchedulePost && (
          <Button size="sm" onClick={() => onSchedulePost(currentPost)} className="gap-1.5 text-xs">
            <Send size={14} />
            Duyệt & Đưa vào lịch đăng
          </Button>
        )}
      </div>
    </Card>
  )
}
