"use client"

import React, { useState } from "react"
import {
  Calendar,
  Clock,
  Sparkles,
  X,
  Zap,
  Sun,
  Moon,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

  if (!isOpen) return null

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold text-text">Thiết Lập Lịch Đăng Bài</div>
              <div className="text-[11.5px] text-text-muted">Lên lịch xuất bản tự động cho mạng xã hội</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {/* Danh sách bài viết được chọn */}
          <div>
            <div className="text-[11.5px] font-bold uppercase tracking-wider text-text-muted mb-2">
              Bài viết đã chọn ({selectedPosts.length})
            </div>
            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
              {selectedPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-background"
                >
                  {post.media_url && (
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                      <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-bold text-text truncate">{post.title}</div>
                    <div className="text-[11px] text-text-muted capitalize">{post.channel_label}</div>
                  </div>
                  <Badge tone="neutral" className="text-[10px]">
                    Bản nháp
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Chọn khung giờ vàng */}
          <div>
            <div className="text-[11.5px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-primary" />
              Chọn thời điểm phát bài tối ưu
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Option 1: Đăng ngay */}
              <button
                type="button"
                onClick={() => setMode("now")}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  mode === "now"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mode === "now" ? "bg-primary text-white" : "bg-surface-hover text-text-muted"}`}>
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-text">Đăng ngay bây giờ</div>
                    <div className="text-[11px] text-text-muted">Đưa ngay vào hàng đợi xuất bản tức thì</div>
                  </div>
                </div>
                {mode === "now" && <CheckCircle2 size={16} className="text-primary" />}
              </button>

              {/* Option 2: Giờ trưa vàng */}
              <button
                type="button"
                onClick={() => setMode("lunch")}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  mode === "lunch"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mode === "lunch" ? "bg-primary text-white" : "bg-surface-hover text-text-muted"}`}>
                    <Sun size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-text">Giờ trưa vàng (11:30)</div>
                    <div className="text-[11px] text-text-muted">Khung giờ nghỉ trưa, tương tác cao nhất trong ngày</div>
                  </div>
                </div>
                {mode === "lunch" && <CheckCircle2 size={16} className="text-primary" />}
              </button>

              {/* Option 3: Giờ tối vàng */}
              <button
                type="button"
                onClick={() => setMode("evening")}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  mode === "evening"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mode === "evening" ? "bg-primary text-white" : "bg-surface-hover text-text-muted"}`}>
                    <Moon size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-text">Giờ tối vàng (19:30)</div>
                    <div className="text-[11px] text-text-muted">Thời điểm mua sắm, đặt hoa tặng và thư giãn</div>
                  </div>
                </div>
                {mode === "evening" && <CheckCircle2 size={16} className="text-primary" />}
              </button>

              {/* Option 4: Tùy chỉnh ngày & giờ */}
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  mode === "custom"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mode === "custom" ? "bg-primary text-white" : "bg-surface-hover text-text-muted"}`}>
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-text">Tùy chỉnh ngày & giờ</div>
                    <div className="text-[11px] text-text-muted">Chủ động chọn mốc thời gian cụ thể</div>
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

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border bg-surface">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading} className="text-xs">
            Hủy bỏ
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isLoading || selectedPosts.length === 0}
            className="text-xs font-bold gap-1.5"
          >
            {isLoading && <RefreshCw size={13} className="animate-spin" />}
            Xác nhận lên lịch ({selectedPosts.length})
          </Button>
        </div>
      </div>
    </div>
  )
}
