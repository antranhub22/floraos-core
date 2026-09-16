"use client"

import React from "react"
import { Film, Clock, Music, Copy } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface StoryboardScene {
  sceneNumber: number
  durationSeconds: number
  visualCue: string
  voiceoverText: string
  audioTone?: string
}

export interface StoryboardScriptCardProps {
  title?: string
  totalDurationSeconds?: number
  musicTrackName?: string
  scenes: StoryboardScene[]
  onCopyScript?: () => void
  onRegenerate?: () => void
}

/**
 * StoryboardScriptCard (Thẻ kịch bản phân cảnh video ngắn M05)
 */
export function StoryboardScriptCard({
  title = "Kịch bản video TikTok 15s — Tone Cảm Xúc",
  totalDurationSeconds = 15,
  musicTrackName = "Acoustic Warm Guitar (Bản quyền miễn phí)",
  scenes,
  onCopyScript,
  onRegenerate,
}: StoryboardScriptCardProps) {
  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M05 Storyboard Script</div>
          <div className="text-[16px] font-extrabold text-text">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral" className="gap-1">
            <Clock size={12} />
            {totalDurationSeconds} giây
          </Badge>
          <Badge tone="success" className="gap-1">
            <Music size={12} />
            {musicTrackName}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {scenes.map((scene) => (
          <div
            key={scene.sceneNumber}
            className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              #{scene.sceneNumber}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text">{scene.visualCue}</span>
                <span className="text-[11px] text-text-muted">{scene.durationSeconds}s</span>
              </div>
              <p className="mt-1 text-xs text-text-muted leading-relaxed italic">
                &ldquo;{scene.voiceoverText}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        {onRegenerate && (
          <Button variant="secondary" size="sm" onClick={onRegenerate} className="gap-1.5">
            <Film size={14} />
            Đổi kịch bản
          </Button>
        )}
        {onCopyScript && (
          <Button size="sm" onClick={onCopyScript} className="gap-1.5">
            <Copy size={14} />
            Sao chép lời thoại
          </Button>
        )}
      </div>
    </Card>
  )
}
