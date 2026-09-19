// Dữ liệu mẫu cho popup xem trước — nhóm Social Publishing (M07). Chỉ để
// minh hoạ giao diện, KHÔNG phải dữ liệu thật.
import React from "react"
import { PublishingGuidanceCard } from "@/components/templates/social-publishing/publishing-guidance-card"
import { PostStatusReportCard } from "@/components/templates/social-publishing/post-status-report-card"
import { PlatformFeedPreview, type PlatformFeedPost } from "@/components/templates/social-publishing/platform-feed-preview"
import { ChannelStatusCard, type ConnectedChannel } from "@/components/templates/social-publishing/channel-status-card"
import { ScheduleQueueTab } from "@/components/templates/social-publishing/schedule-queue-tab"
import { SmartRepostTab } from "@/components/templates/social-publishing/smart-repost-tab"
import { ScheduleConfirmModal } from "@/components/templates/social-publishing/schedule-confirm-modal"
import { SchedulePostItemCard } from "@/components/templates/social-publishing/schedule-post-item-card"
import { ScheduleCalendarCard, type ScheduledPostItem } from "@/components/templates/social-publishing/schedule-calendar-card"
import { AutoApprovePanel } from "@/components/templates/social-publishing/auto-approve-panel"

const formatTime = (isoStr?: string | null) => {
  if (!isoStr) return "--:--"
  try {
    const d = new Date(isoStr)
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
  } catch {
    return "--:--"
  }
}

const SAMPLE_FEED_POST: PlatformFeedPost = {
  id: 1,
  title: "Nồng Nàn Yêu Thương",
  content: "🌹 Bó hồng đỏ Ecuador phối baby trắng, tôn lên trọn vẹn tình cảm.\n#hoatuoi #SiiNStore\n👉 Inbox đặt hoa ngay",
  platform: "facebook",
  channel_label: "Facebook",
  status: "scheduled",
  scheduled_time: new Date().toISOString(),
  product_name: "Nồng Nàn Yêu Thương",
}

const SAMPLE_CHANNELS: ConnectedChannel[] = [
  { id: "fb", name: "Facebook Fanpage", accountName: "SiiN Store", isConnected: true, lastSyncTime: "5 phút trước" },
  { id: "zalo", name: "Zalo OA", accountName: "SiiN Store OA", isConnected: true, lastSyncTime: "1 giờ trước" },
  { id: "ig", name: "Instagram", accountName: "@siinstore", isConnected: false },
]

const SAMPLE_QUEUE_POSTS: PlatformFeedPost[] = [
  SAMPLE_FEED_POST,
  { ...SAMPLE_FEED_POST, id: 2, title: "Chúc Mừng Khai Trương", status: "draft", channel_label: "Zalo", platform: "zalo" },
  { ...SAMPLE_FEED_POST, id: 3, title: "Sinh Nhật Rực Rỡ", status: "failed", channel_label: "Instagram", platform: "instagram", error_message: "Hết hạn token đăng nhập" },
]

const SAMPLE_CALENDAR_POSTS: ScheduledPostItem[] = [
  { id: "1", scheduledTime: new Date().toISOString(), channel: "facebook", channelLabel: "Facebook", title: "Nồng Nàn Yêu Thương", status: "scheduled" },
  { id: "2", scheduledTime: new Date().toISOString(), channel: "zalo", channelLabel: "Zalo", title: "Chúc Mừng Khai Trương", status: "published" },
]

export const socialPublishingPreviews: Record<string, React.ReactNode> = {
  "publishing-guidance-card.tsx": <PublishingGuidanceCard />,
  "schedule-calendar-card.tsx": <ScheduleCalendarCard posts={SAMPLE_CALENDAR_POSTS} selectedId="1" onSelectPost={() => {}} onNewSchedule={() => {}} />,
  "channel-status-card.tsx": <ChannelStatusCard channels={SAMPLE_CHANNELS} onReconnect={() => {}} />,
  "schedule-queue-tab.tsx": (
    <ScheduleQueueTab
      calendarPosts={SAMPLE_QUEUE_POSTS}
      selectedIds={[1]}
      selectedPost={SAMPLE_FEED_POST}
      actionLoading={false}
      notice={null}
      formatTime={formatTime}
      onSelectPost={() => {}}
      onToggleCheck={() => {}}
      onToggleSelectAll={() => {}}
      onRetryPost={() => {}}
      onOpenScheduleModal={() => {}}
      onGoToContentEngine={() => {}}
    />
  ),
  "schedule-post-item-card.tsx": (
    <SchedulePostItemCard
      item={SAMPLE_FEED_POST}
      isChecked={true}
      isActive={true}
      onSelect={() => {}}
      onToggleCheck={() => {}}
      onRetry={() => {}}
      formatTime={formatTime}
    />
  ),
  "platform-feed-preview.tsx": <PlatformFeedPreview post={SAMPLE_FEED_POST} shopName="SiiN Store" />,
  "schedule-confirm-modal.tsx": (
    <ScheduleConfirmModal isOpen={true} onClose={() => {}} onConfirm={async () => {}} selectedPosts={[SAMPLE_FEED_POST]} />
  ),
  "post-status-report-card.tsx": (
    <PostStatusReportCard
      post={{
        id: 1,
        title: "Nồng Nàn Yêu Thương",
        channel: "facebook",
        channelLabel: "Facebook",
        status: "published",
        dateStr: "Hôm nay, 19:30",
        postUrl: "https://www.facebook.com/me",
      }}
    />
  ),
  "auto-approve-panel.tsx": <AutoApprovePanel autoApprove={true} onToggle={() => {}} />,
  "smart-repost-tab.tsx": <SmartRepostTab posts={SAMPLE_QUEUE_POSTS} formatTime={formatTime} onSelectForRepost={() => {}} />,
}

// Các template tự dựng modal fixed inset-0 riêng (không dùng chrome popup
// chung của trang) — wiring ở page.tsx cần biết để không lồng 2 lớp modal.
export const SOCIAL_PUBLISHING_SELF_MODAL_FILES = new Set(["schedule-confirm-modal.tsx"])
