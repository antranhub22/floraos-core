import React from "react"
import { Sparkles, Info } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export interface M01bGuidanceCardProps {
  className?: string
}

/**
 * Template Hướng dẫn Sinh Nội dung Bán hàng M01b
 * Dành riêng cho chức năng tạo dữ liệu thương mại từ Product Master đã duyệt.
 */
export function M01bGuidanceCard({ className }: M01bGuidanceCardProps) {
  return (
    <FeatureGuidanceCard
      badgeLabel="Hướng dẫn soạn nội dung bán hàng"
      badgeIcon={Info}
      title="Kho sản phẩm & phân tích đã duyệt"
      titleIcon={Sparkles}
      description="Chọn một mẫu hoa từ kho đã duyệt để AI tự động soạn nội dung bán hàng: tên gợi ý, mô tả sản phẩm, thẻ tìm kiếm, dịp tặng và phân khúc giá."
      tips={[
        "✨ Tự động đọc từ mẫu hoa đã duyệt",
        "📝 Tùy chỉnh trực tiếp trước khi duyệt",
        "🎯 Chuẩn hóa theo hồ sơ cửa hàng",
      ]}
      className={className}
    />
  )
}
