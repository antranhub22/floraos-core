"use client"

import React, { useState } from "react"
import { Copy, Check, Send, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface MultichannelPostItem {
  channel: "facebook" | "instagram" | "tiktok" | "zalo"
  channelLabel: string
  headline: string
  bodyText: string
  hashtags: string[]
}

export interface MultichannelPostCardProps {
  posts: MultichannelPostItem[]
  productName?: string
  onSchedulePost?: (post: MultichannelPostItem) => void
}

/**
 * MultichannelPostCard (Thẻ bài đăng bán hàng đa kênh M06)
 */
export function MultichannelPostCard({
  posts,
  productName = "Sản phẩm",
  onSchedulePost,
}: MultichannelPostCardProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>(posts[0]?.channel || "facebook")
  const [copied, setCopied] = useState(false)

  const currentPost = posts.find((p) => p.channel === selectedChannel) || posts[0]

  const handleCopy = () => {
    if (!currentPost) return
    const text = `${currentPost.headline}\n\n${currentPost.bodyText}\n\n${currentPost.hashtags.join(" ")}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!currentPost) return null

  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M06 Content Engine</div>
          <div className="text-[16px] font-extrabold text-text">Bài đăng tiếp thị đa kênh</div>
        </div>
        <Badge tone="success" className="gap-1">
          <Sparkles size={12} />
          {productName}
        </Badge>
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {posts.map((post) => (
          <button
            key={post.channel}
            type="button"
            onClick={() => setSelectedChannel(post.channel)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              selectedChannel === post.channel
                ? "bg-primary text-white"
                : "bg-muted text-text-muted hover:text-text"
            }`}
          >
            {post.channelLabel}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4">
        <div className="text-sm font-bold text-text">{currentPost.headline}</div>
        <div className="text-xs text-text leading-relaxed whitespace-pre-line">
          {currentPost.bodyText}
        </div>
        <div className="mt-2 flex flex-wrap gap-1 text-[11px] font-semibold text-primary">
          {currentPost.hashtags.map((tag, idx) => (
            <span key={idx}>{tag}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="secondary" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          {copied ? "Đã chép nội dung" : "Sao chép bài viết"}
        </Button>
        {onSchedulePost && (
          <Button size="sm" onClick={() => onSchedulePost(currentPost)} className="gap-1.5">
            <Send size={14} />
            Lên lịch đăng
          </Button>
        )}
      </div>
    </Card>
  )
}
