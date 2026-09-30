"use client"

import React, { useState } from "react"
import {
  Calendar,
  Clock,
  Sparkles,
  Zap,
  Sun,
  Moon,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import type { PlatformFeedPost } from "./platform-feed-preview"

export interface ScheduleConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (scheduledTimeIso: string) => Promise<void>
  selectedPosts: PlatformFeedPost[]
  isLoading?: boolean
}

type ScheduleMode = "now" | "lunch" | "evening" | "custom"

export function ScheduleConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  selectedPosts,
  isLoading = false,
}: ScheduleConfirmModalProps) {
  const [mode, setMode] = useState<ScheduleMode>("lunch")
  
  // Thời gian tùy chỉnh mặc định: 11:30 ngày mai
  const [customTime, setCustomTime] = useState(() => {
    const d = new Date()
    d.setHours(11, 30, 0, 0)
    return d.toISOString().slice(0, 16)
  })

  // Tính toán thời gian theo chế độ đã chọn
  function resolveSelectedTime(): string {
    const now = new Date()
    if (mode === "now") {
      return now.toISOString()
    }
    if (mode === "lunch") {
      const lunch = new Date()
      lunch.setHours(11, 30, 0, 0)
      if (lunch.getTime() <= now.getTime()) {
        // Nếu đã qua 11:30 hôm nay, dời sang 11:30 ngày mai
        lunch.setDate(lunch.getDate() + 1)
      }
      return lunch.toISOString()
    }
    if (mode === "evening") {
      const evening = new Date()
      evening.setHours(19, 30, 0, 0)
      if (evening.getTime() <= now.getTime()) {
        evening.setDate(evening.getDate() + 1)
      }
      return evening.toISOString()
    }
    return new Date(customTime).toISOString()
  }

  const handleSubmit = async () => {
    const iso = resolveSelectedTime()
    await onConfirm(iso)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose()
      }}
      size="md"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Calendar size={16} />
          </div>
          <span>Thiết Lập Lịch Đăng Bài</span>
        </div>
      }
      description="Lên lịch xuất bản tự động cho mạng xã hội"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            Hủy bỏ
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isLoading || selectedPosts.length === 0}
            className="text-xs font-bold gap-1.5 shadow-xs"
          >
            {isLoading && <RefreshCw size={13} className="animate-spin" />}
            Xác nhận lên lịch ({selectedPosts.length})
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-xs">
        {/* Danh sách bài viết được chọn */}
        <div>
          <div className="text-caption font-bold uppercase tracking-wider text-text-muted mb-2">
            Bài viết đã chọn ({selectedPosts.length})
          </div>
          <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
            {selectedPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-surface-alt/40"
              >
                {post.media_url && (
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                    <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-meta font-bold text-text truncate">{post.title}</div>
                  <div className="text-caption text-text-muted capitalize">{post.channel_label}</div>
                </div>
                <Badge tone="neutral" className="text-caption">
                  Bản nháp
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Chọn khung giờ vàng */}
        <div>
          <div className="text-caption font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
            <Sparkles size={12} className="text-primary" />
            Chọn thời điểm phát bài tối ưu
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Option 1: Đăng ngay */}
            <button
              type="button"
              aria-pressed={mode === "now"}
              onClick={() => setMode("now")}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                mode === "now"
                  ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                  : "border-border bg-surface hover:border-border-hover"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${mode === "now" ? "bg-primary text-white" : "bg-surface-alt text-text-muted"}`}>
                  <Zap size={16} />
                </div>
                <div>
                  <div className="text-body-sm font-bold text-text">Đăng ngay bây giờ</div>
                  <div className="text-caption text-text-muted">Đưa ngay vào hàng đợi xuất bản tức thì</div>
                </div>
              </div>
              {mode === "now" && <CheckCircle2 size={16} className="text-primary" />}
            </button>

            {/* Option 2: Giờ trưa vàng */}
            <button
              type="button"
              aria-pressed={mode === "lunch"}
              onClick={() => setMode("lunch")}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                mode === "lunch"
                  ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                  : "border-border bg-surface hover:border-border-hover"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${mode === "lunch" ? "bg-primary text-white" : "bg-surface-alt text-text-muted"}`}>
                  <Sun size={16} />
                </div>
                <div>
                  <div className="text-body-sm font-bold text-text">Giờ trưa vàng (11:30)</div>
                  <div className="text-caption text-text-muted">Khung giờ nghỉ trưa, tương tác cao nhất trong ngày</div>
                </div>
              </div>
              {mode === "lunch" && <CheckCircle2 size={16} className="text-primary" />}
            </button>

            {/* Option 3: Giờ tối vàng */}
            <button
              type="button"
              aria-pressed={mode === "evening"}
              onClick={() => setMode("evening")}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                mode === "evening"
                  ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                  : "border-border bg-surface hover:border-border-hover"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${mode === "evening" ? "bg-primary text-white" : "bg-surface-alt text-text-muted"}`}>
                  <Moon size={16} />
                </div>
                <div>
                  <div className="text-body-sm font-bold text-text">Giờ tối vàng (19:30)</div>
                  <div className="text-caption text-text-muted">Thời điểm mua sắm, đặt hoa tặng và thư giãn</div>
                </div>
              </div>
              {mode === "evening" && <CheckCircle2 size={16} className="text-primary" />}
            </button>

            {/* Option 4: Tùy chỉnh ngày & giờ */}
            <button
              type="button"
              aria-pressed={mode === "custom"}
              onClick={() => setMode("custom")}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                mode === "custom"
                  ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                  : "border-border bg-surface hover:border-border-hover"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${mode === "custom" ? "bg-primary text-white" : "bg-surface-alt text-text-muted"}`}>
                  <Clock size={16} />
                </div>
                <div>
                  <div className="text-body-sm font-bold text-text">Tùy chỉnh ngày & giờ</div>
                  <div className="text-caption text-text-muted">Chủ động chọn mốc thời gian cụ thể</div>
                </div>
              </div>
              {mode === "custom" && <CheckCircle2 size={16} className="text-primary" />}
            </button>
          </div>

          {/* Input ngày giờ tùy chỉnh */}
          {mode === "custom" && (
            <div className="mt-3 p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-text">Thời gian phát bài:</label>
              <input
                type="datetime-local"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}

