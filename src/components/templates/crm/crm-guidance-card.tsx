"use client"

import React from "react"
import { Users } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export function CrmGuidanceCard() {
  return (
    <FeatureGuidanceCard
      tag="HƯỚNG DẪN QUẢN LÝ KHÁCH HÀNG CRM M08"
      icon={Users}
      title="Chăm sóc khách hàng & Nhắc lịch hoa định kỳ"
      description="Lưu trữ lịch sử mua hàng, ngân sách quen thuộc, sở thích tone màu và tự động cảnh báo ngày sinh nhật, kỷ niệm của người thân khách hàng."
      tips={[
        "🎂 Tự động gửi thông báo trước 3-5 ngày cho các dịp sinh nhật, kỷ niệm ngày cưới của khách VIP",
        "💐 Gợi ý đúng mẫu hoa khách từng yêu thích để chốt đơn tái mua nhanh gấp 3 lần",
        "⭐ Phân hạng thẻ thành viên tự động: Đồng, Bạc, Vàng, Kim Cương theo tổng chi tiêu",
      ]}
    />
  )
}
