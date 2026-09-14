"use client"

import React, { useState } from "react"
import { Play, Pause, Download, Share2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface VideoPlayerCardProps {
  videoUrl?: string
  posterUrl?: string
  title?: string
  productName?: string
  price?: string
  onDownload?: () => void
  onShare?: () => void
}

/**
 * VideoPlayerCard (Thẻ khung chiếu video sản phẩm 9:16 M05)
 */
export function VideoPlayerCard({
  videoUrl,
  posterUrl,
  title = "Video ngắn giới thiệu bó hoa",
  productName = "Bó Hoa Nắng Mai",
  price = "450.000đ",
  onDownload,
  onShare,
}: VideoPlayerCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col items-center gap-4">
      <div className="w-full flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M05 Video Preview</div>
          <div className="text-[16px] font-extrabold text-text">{title}</div>
        </div>
        <Badge tone="success">Chuẩn 9:16 Mobile</Badge>
      </div>

      <div className="relative aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={posterUrl}
            controls={false}
            className="h-full w-full object-cover"
            loop
          />
        ) : (
          <img
            src={posterUrl || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80"}
            alt={productName}
            className="h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-4">
          <div className="text-xs font-bold text-white/90">@FloraOS Studio</div>

          <div className="flex flex-col gap-2">
            <div className="text-sm font-extrabold text-white">{productName}</div>
            <div className="text-xs font-semibold text-amber-300">{price}</div>
            <div className="mt-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md hover:bg-white/40 transition"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex items-center justify-between border-t border-border pt-4">
        <div className="text-xs text-text-muted">Định dạng MP4 1080x1920</div>
        <div className="flex items-center gap-2">
          {onShare && (
            <Button variant="secondary" size="sm" onClick={onShare} className="gap-1.5">
              <Share2 size={14} />
              Đăng TikTok
            </Button>
          )}
          {onDownload && (
            <Button size="sm" onClick={onDownload} className="gap-1.5">
              <Download size={14} />
              Tải MP4
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
