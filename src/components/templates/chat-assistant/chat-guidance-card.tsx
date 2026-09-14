"use client"

import React from "react"
import { Bot } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export function ChatGuidanceCard() {
  return (
    <FeatureGuidanceCard
      tag="HƯỚNG DẪN TRỢ LÝ AI TƯ VẤN M10"
      icon={Bot}
      title="Tư vấn mẫu hoa & Chốt đơn tự động 24/7"
      description="Trợ lý AI thấu hiểu nhu cầu của khách hàng, gợi ý mẫu hoa chính xác theo ngân sách và dịp tặng, tự động chuyển nhân viên khi gặp trường hợp phức tạp."
      tips={[
        "💬 AI gợi ý 2-3 mẫu hoa phù hợp kèm ảnh & link báo giá ngay trong tin nhắn",
        "🛑 Chuyển giao thông minh: Khi khách khiếu nại hoặc đòi giảm giá, hệ thống rung chuông báo nhân viên tiếp quản",
        "⚡ Đồng bộ tức thì thông tin khách hàng vào sổ đơn hàng mà không cần gõ lại",
      ]}
    />
  )
}
