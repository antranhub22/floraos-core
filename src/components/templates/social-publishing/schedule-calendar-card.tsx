"use client"

import React from "react"
import { Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface ScheduledPostItem {
  id: string
  scheduledTime: string
  channel: string
  title: string
  status: "scheduled" | "published" | "failed"
}

export interface ScheduleCalendarCardProps {
  posts: ScheduledPostItem[]
  dateLabel?: string
}

/**
 * ScheduleCalendarCard (Thẻ lịch đăng bài mạng xã hội M07)
 */
export function ScheduleCalendarCard({
  posts,
  dateLabel = "Hôm nay, 14/09/2026",
}: ScheduleCalendarCardProps) {
  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M07 Social Calendar</div>
          <div className="text-[16px] font-extrabold text-text">Lịch trình xuất bản bài viết</div>
        </div>
        <Badge tone="neutral" className="gap-1">
          <Calendar size={12} />
          {dateLabel}
        </Badge>
      </div>

      <div className="flex flex-col gap-2.5">
        {posts.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs font-bold text-text-muted">
                <Clock size={13} />
                {item.scheduledTime}
              </div>
              <div>
                <div className="text-xs font-bold text-text">{item.title}</div>
                <div className="text-[11px] text-text-muted capitalize">Kênh: {item.channel}</div>
              </div>
            </div>

            <Badge
              tone={
                item.status === "published"
                  ? "success"
                  : item.status === "scheduled"
                  ? "neutral"
                  : "danger"
              }
              className="gap-1"
            >
              {item.status === "published" ? (
                <>
                  <CheckCircle2 size={12} />
                  Đã đăng
                </>
              ) : item.status === "scheduled" ? (
                <>
                  <Clock size={12} />
                  Chờ phát
                </>
              ) : (
                <>
                  <AlertCircle size={12} />
                  Thất bại
                </>
              )}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
