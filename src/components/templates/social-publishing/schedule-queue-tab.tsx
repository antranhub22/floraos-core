"use client"

import React from "react"
import { Calendar, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SchedulePostItemCard } from "./schedule-post-item-card"
import { PlatformFeedPreview, type PlatformFeedPost } from "./platform-feed-preview"

export interface ScheduleQueueTabProps {
  calendarPosts: PlatformFeedPost[]
  selectedIds: number[]
  selectedPost: PlatformFeedPost | null
  actionLoading: boolean
  notice: string | null
  formatTime: (isoStr?: string | null) => string
  onSelectPost: (item: PlatformFeedPost) => void
  onToggleCheck: (id: number) => void
  onToggleSelectAll: () => void
  onRetryPost: (id: number | string) => void
  onOpenScheduleModal: () => void
  onGoToContentEngine: () => void
}

/**
 * ScheduleQueueTab - Tab duyệt hàng đợi & lên lịch phát sóng hàng loạt
 */
export function ScheduleQueueTab({
  calendarPosts,
  selectedIds,
  selectedPost,
  actionLoading,
  notice,
  formatTime,
  onSelectPost,
  onToggleCheck,
  onToggleSelectAll,
  onRetryPost,
  onOpenScheduleModal,
  onGoToContentEngine,
}: ScheduleQueueTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="text-[17px] font-extrabold text-text">❺ Xác nhận lịch đăng</div>
        <div className="mt-1 text-[13px] text-text-muted">
          Chọn bài từ Thư viện nội dung đã duyệt → chọn nền tảng + thời điểm → xác nhận
        </div>
      </div>

      {calendarPosts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-border bg-surface">
          <div className="w-12 h-12 rounded-2xl bg-surface-hover text-text-muted flex items-center justify-center mb-3">
            <Sparkles size={24} />
          </div>
          <div className="text-[15px] font-bold text-text">Chưa có bài viết nào chờ lên lịch</div>
          <div className="text-xs text-text-muted max-w-sm mt-1">
            Hãy vào tab <strong>Sinh Nội Dung AI (M07)</strong> để tạo và duyệt bài viết hoa tươi cho Facebook, Instagram, TikTok, Zalo và LinkedIn.
          </div>
          <Button
            className="mt-4 text-xs font-bold"
            onClick={onGoToContentEngine}
          >
            Đến Cỗ Máy Sinh Nội Dung
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {calendarPosts.map((item) => (
            <SchedulePostItemCard
              key={item.id}
              item={item}
              isChecked={selectedIds.includes(Number(item.id))}
              isActive={selectedPost?.id === item.id}
              onSelect={() => onSelectPost(item)}
              onToggleCheck={() => onToggleCheck(Number(item.id))}
              onRetry={() => onRetryPost(item.id)}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col gap-2.5 border-t border-border pt-4">
        {notice && (
          <div className="rounded-xl bg-success-bg border border-success/30 px-4 py-2.5 text-[13px] font-semibold text-secondary flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-success flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSelectAll}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              {selectedIds.length === calendarPosts.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            <div className="text-[12.5px] text-text-muted font-medium">
              {selectedIds.length > 0 ? (
                <span><strong>{selectedIds.length}</strong> bài đã chọn để lên lịch</span>
              ) : selectedPost ? (
                <span>Đang chọn bài: <strong>{selectedPost.title.slice(0, 25)}...</strong></span>
              ) : (
                <span>Chưa chọn bài viết</span>
              )}
            </div>
          </div>
          <Button
            onClick={onOpenScheduleModal}
            disabled={actionLoading || calendarPosts.length === 0}
            className="font-bold gap-1.5"
          >
            {actionLoading && <RefreshCw size={13} className="animate-spin" />}
            <Calendar size={14} />
            Xác nhận lịch đăng
          </Button>
        </div>
      </div>

      {/* Khung Xem trước nền tảng thực tế */}
      <div className="border-t border-border pt-5">
        <div className="text-[14px] font-bold text-text mb-3 flex items-center justify-between">
          <span>Xem trước nền tảng</span>
          {selectedPost && (
            <span className="text-xs font-normal text-text-muted">
              Đang xem: <strong className="text-primary">{selectedPost.title}</strong>
            </span>
          )}
        </div>
        <PlatformFeedPreview post={selectedPost} />
      </div>
    </div>
  )
}
