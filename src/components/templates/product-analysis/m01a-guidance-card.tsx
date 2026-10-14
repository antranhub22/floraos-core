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
      badgeLabel="Hướng dẫn chụp ảnh hoa"
      badgeIcon={Info}
      title="Chụp ảnh thế nào để AI nhận diện chính xác hơn"
      titleIcon={Camera}
      description="Chụp chính diện, đủ sáng và phông nền gọn để AI nhận diện đúng loại hoa và số cành."
      tips={[
        "📸 Chụp đủ cả bó hoặc giỏ hoa, không để che phần gốc hay ngọn",
        "💡 Tránh chụp ngược sáng hoặc để bóng đổ gắt lên cánh hoa",
        "✨ Ảnh càng rõ nét, AI càng nhận ra đúng lá phụ và phụ kiện",
      ]}
      className={className}
    />
  )
}
