"use client"

import React from "react"
import { BarChart3 } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export function AnalyticsGuidanceCard() {
  return (
    <FeatureGuidanceCard
      tag="HƯỚNG DẪN BÁO CÁO & GIÁM SÁT AI M11"
      icon={BarChart3}
      title="Giám sát doanh thu & Kiểm soát hạn mức AI"
      description="Thống kê trực quan hiệu quả bán hàng, tỷ lệ chuyển đổi đơn từ các kênh và giám sát chi tiêu token AI của từng chi nhánh/tổ chức."
      tips={[
        "📈 Báo cáo tỷ lệ chốt đơn theo từng mẫu hoa và từng góc tiếp cận bài viết",
        "🛡️ Cơ chế Aegis Protection tự động cảnh báo khi chi phí token AI vượt 80% hạn mức tháng",
        "💵 Phân tích biên lợi nhuận ròng thực tế sau khi trừ chi phí hoa tươi và công thợ",
      ]}
    />
  )
}
