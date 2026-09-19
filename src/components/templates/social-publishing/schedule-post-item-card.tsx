"use client"

import React from "react"
import { Clock, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PlatformFeedPost } from "./platform-feed-preview"

export interface SchedulePostItemCardProps {
  item: PlatformFeedPost
  isChecked: boolean
  isActive: boolean
  onSelect: () => void
  onToggleCheck: () => void
  onRetry: () => void
  formatTime: (isoStr?: string | null) => string
}

export function SchedulePostItemCard({
  item,
  isChecked,
  isActive,
  onSelect,
  onToggleCheck,
  onRetry,
  formatTime,
}: SchedulePostItemCardProps) {
  const isError = item.status === "failed" || item.status === "error"

  return (
    <Card
      onClick={onSelect}
      className={`flex items-center gap-3.5 p-3.5 transition-all cursor-pointer border ${
        isActive
          ? "border-primary ring-1 ring-primary/20 bg-primary/[0.02]"
          : "border-border hover:border-primary/40 bg-surface"
      }`}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => {
          e.stopPropagation()
          onToggleCheck()
        }}
        className="h-4 w-4 rounded accent-primary cursor-pointer"
      />
      {item.media_url && (
        <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-surface-alt border border-border shadow-2xs">
          <img
            src={item.media_url}
            alt={item.title}
            onError={(e) => {
              e.currentTarget.src = "/images/sample-flower.jpg"
            }}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-bold text-text truncate">{item.title}</div>
        <div className="text-[11.5px] text-text-muted flex items-center gap-2 mt-0.5">
          <span className="font-semibold text-primary">{item.channel_label}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {formatTime(item.scheduled_time || item.created_at)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge
          tone={
            item.status === "scheduled"
              ? "success"
              : item.status === "draft"
              ? "neutral"
              : "danger"
          }
          className="text-[11px]"
        >
          {item.status === "scheduled"
            ? "Đã lên lịch"
            : item.status === "draft"
            ? "Bản nháp"
            : "Lỗi"}
        </Badge>

        {isError && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onRetry()
            }}
            className="text-xs text-danger hover:bg-danger/10 gap-1 h-7 px-2"
          >
            <RefreshCw size={12} /> Thử lại
          </Button>
        )}
      </div>
    </Card>
  )
}
