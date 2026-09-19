// Dữ liệu mẫu cho popup xem trước — nhóm Video Studio (M05). Chỉ để minh
// hoạ giao diện, KHÔNG phải dữ liệu thật.
import React from "react"
import { VideoGuidanceCard } from "@/components/templates/video-studio/video-guidance-card"
import { StoryboardScriptCard, type StoryboardScene } from "@/components/templates/video-studio/storyboard-script-card"
import { VideoPlayerCard } from "@/components/templates/video-studio/video-player-card"

const SAMPLE_SCENES: StoryboardScene[] = [
  { sceneNumber: 1, durationSeconds: 4, visualCue: "Cận cảnh bó hoa xoay 360°", voiceoverText: "Một bó hoa, một câu chuyện yêu thương." },
  { sceneNumber: 2, durationSeconds: 6, visualCue: "Zoom chi tiết từng cánh hoa hồng", voiceoverText: "Hồng đỏ Ecuador tươi mới mỗi ngày." },
  { sceneNumber: 3, durationSeconds: 5, visualCue: "Logo shop & nút đặt hàng", voiceoverText: "Đặt ngay hôm nay tại SiiN Store." },
]

export const videoStudioPreviews: Record<string, React.ReactNode> = {
  "video-guidance-card.tsx": <VideoGuidanceCard />,
  "storyboard-script-card.tsx": <StoryboardScriptCard scenes={SAMPLE_SCENES} />,
  "video-player-card.tsx": <VideoPlayerCard title="Video ngắn giới thiệu bó hoa" productName="Nồng Nàn Yêu Thương" price="650.000đ" />,
}
