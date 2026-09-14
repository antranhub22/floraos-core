"use client"

import React from "react"
import { Video } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export function VideoGuidanceCard() {
  return (
    <FeatureGuidanceCard
      tag="HƯỚNG DẪN STUDIO VIDEO M05"
      icon={Video}
      title="Tạo video ngắn sản phẩm tự động"
      description="Tự động biên tập video dọc chuẩn TikTok / Reels / Shorts từ ảnh sản phẩm, kịch bản thuyết minh và nhạc nền bản quyền."
      tips={[
        "🎬 AI tự động sinh kịch bản phân cảnh 3 nhịp: Mở đầu ấn tượng - Cận cảnh hoa - Lời kêu gọi",
        "🎵 Tích hợp kho nhạc nền cảm xúc phù hợp với từng dịp tặng",
        "⏱️ Khuyến nghị độ dài tối ưu: 15s đến 30s để đạt tỷ lệ giữ chân khách cao nhất",
      ]}
    />
  )
}
