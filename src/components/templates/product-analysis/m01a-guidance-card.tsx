import React from "react"
import { Camera, Info } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export interface M01aGuidanceCardProps {
  className?: string
}

/**
 * Template Hướng dẫn Nhận diện Sản phẩm M01a
 * Dành riêng cho chức năng Phân tích ảnh hoa từ thiết bị.
 */
export function M01aGuidanceCard({ className }: M01aGuidanceCardProps) {
  return (
    <FeatureGuidanceCard
      badgeLabel="Hướng dẫn nhận diện M01a"
      badgeIcon={Info}
      title="Tải ảnh sản phẩm & Nhận diện tự động"
      titleIcon={Camera}
      description="Tải ảnh hoa chụp từ thiết bị để AI tự động nhận diện loại hoa, đếm số lượng cành, phân tích tone màu sắc và xác định phong cách thiết kế (M01a)."
      tips={[
        "📸 Chụp góc chính diện hoặc 45°",
        "💡 Đủ sáng, rõ nét hoa & lá",
        "⚡ Tối đa 10 ảnh mỗi lần",
      ]}
      className={className}
    />
  )
}
