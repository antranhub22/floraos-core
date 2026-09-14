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
      badgeLabel="Hướng dẫn sinh nội dung M01b"
      badgeIcon={Info}
      title="Kho sản phẩm & phân tích đã duyệt"
      titleIcon={Sparkles}
      description="Chọn một sản phẩm từ kho đã duyệt đặc điểm (M01a) để AI tự động sinh nội dung bán hàng (M01b: tên gợi ý, mô tả thương mại, thẻ SEO, dịp tặng, phân khúc giá)."
      tips={[
        "✨ Tự động đọc từ Product Master đã duyệt",
        "📝 Tùy chỉnh trực tiếp trước khi duyệt",
        "🎯 Chuẩn hóa theo Brand Profile",
      ]}
      className={className}
    />
  )
}
