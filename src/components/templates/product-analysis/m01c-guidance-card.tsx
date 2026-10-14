import React from "react"
import { FileText, Info } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export interface M01cGuidanceCardProps {
  className?: string
}

/**
 * Template Hướng dẫn Tạo Thẻ Chào Khách M01c
 * Dành riêng cho chức năng tổng hợp Thẻ A6 và Kịch bản tư vấn Zalo.
 */
export function M01cGuidanceCard({ className }: M01cGuidanceCardProps) {
  return (
    <FeatureGuidanceCard
      badgeLabel="Hướng dẫn tạo thẻ chào mẫu hoa"
      badgeIcon={Info}
      title="Tạo Thẻ Chào Sản Phẩm từ Kho đã duyệt"
      titleIcon={FileText}
      description="Chọn một mẫu hoa đã duyệt để tự động tổng hợp thành phần hoa và nội dung tư vấn thành Thẻ chào & Báo giá hoàn chỉnh cho nhân viên bán hàng."
      tips={[
        "📋 Tổng hợp thành phần hoa & kịch bản chốt đơn",
        "💬 Copy 1 chạm gửi Zalo / Chat",
        "🖼️ Xuất ảnh báo giá A6 / PNG",
      ]}
      className={className}
    />
  )
}
