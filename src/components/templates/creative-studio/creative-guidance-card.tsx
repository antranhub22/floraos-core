"use client"

import React from "react"
import { Wand2 } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export function CreativeGuidanceCard() {
  return (
    <FeatureGuidanceCard
      tag="HƯỚNG DẪN STUDIO SÁNG TẠO M04"
      icon={Wand2}
      title="Tối ưu & Tạo phối cảnh ảnh sản phẩm"
      description="Biến ảnh chụp thô tại xưởng thành ảnh thương mại cao cấp với phông nền studio, ánh sáng tự nhiên và biến thể bối cảnh chân thực."
      tips={[
        "🎨 Tự động xóa nền xưởng hoa và giữ chi tiết cánh hoa sắc nét",
        "💡 Chọn bối cảnh sang trọng: Bàn tiệc cưới, phòng khách, cầm tay",
        "📐 Tùy biến tỷ lệ khung hình 1:1, 4:5 hoặc 9:16 cho từng kênh",
      ]}
    />
  )
}
