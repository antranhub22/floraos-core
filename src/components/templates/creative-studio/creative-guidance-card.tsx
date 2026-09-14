"use client"

import React from "react"
import { Wand2, Sparkles } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export interface CreativeGuidanceCardProps {
  area?: "area-a" | "area-b"
}

export function CreativeGuidanceCard({ area = "area-a" }: CreativeGuidanceCardProps) {
  if (area === "area-b") {
    return (
      <FeatureGuidanceCard
        tag="HƯỚNG DẪN BIẾN THỂ MARKETING M04b"
        icon={Sparkles}
        title="Sinh biến thể tiếp thị trên Master Image đã duyệt"
        description="Tách nền trong suốt PNG (AIC-11) hoặc ghép bó hoa vào bối cảnh sang trọng. Biến thể tiếp thị tuyệt đối không làm biến dạng hình dáng và màu sắc hoa thật."
        tips={[
          "🎯 Tách nền trong suốt (AIC-11) sẵn sàng cho thiết kế banner quảng cáo",
          "✨ Chọn bối cảnh Studio, Tiệc cưới, Phòng khách theo từng chiến dịch",
          "🔒 Ranh giới bất biến: Bó hoa được bảo toàn 100%, không sinh pixel làm sai hoa",
          "🏷️ Tự động đóng dấu Watermark bản quyền logo thương hiệu của shop",
        ]}
      />
    )
  }

  return (
    <FeatureGuidanceCard
      tag="HƯỚNG DẪN TỐI ƯU ẢNH GỐC M04a"
      icon={Wand2}
      title="Tối ưu ảnh xưởng hoa & Kiểm duyệt Identity Guard"
      description="Nâng cấp ảnh chụp thô tại xưởng hoa thành Master Image chuẩn HD, cân bằng sáng tự nhiên và kiểm soát sai lệch qua 4 cổng Identity Guard."
      tips={[
        "📸 Chọn ảnh chụp xưởng rõ nét, đủ ánh sáng và thấy trọn vẹn bó hoa",
        "🛡️ Cổng Identity Guard chấm 4 điểm bất biến (Dáng khối, Màu sắc, BOM, Hình học)",
        "📐 Tự động sinh 4 tỷ lệ Smart Reframe: 1:1, 4:5, 9:16 và 16:9",
      ]}
    />
  )
}
