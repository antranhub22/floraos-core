"use client"

import React from "react"
import { Share2 } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export function PublishingGuidanceCard() {
  return (
    <FeatureGuidanceCard
      tag="HƯỚNG DẪN ĐĂNG BÀI MẠNG XÃ HỘI M07"
      icon={Share2}
      title="Lập lịch & Tự động xuất bản đa kênh"
      description="Quản lý lịch phân phối bài viết đồng bộ lên Facebook Fanpage, Zalo OA và Instagram theo các khung giờ tương tác cao nhất trong ngày."
      tips={[
        "⏰ Khung giờ vàng khuyến nghị: 8h30 sáng (chào ngày mới), 11h30 trưa (thư giãn) và 19h30 tối (đặt hoa ngày mai)",
        "🔗 Kiểm tra kết nối token trang trước khi xếp lịch để đảm bảo bài không bị ngắt quãng",
        "📊 Xem trạng thái xuất bản tức thì qua nhật ký phân phối đa kênh",
      ]}
    />
  )
}
