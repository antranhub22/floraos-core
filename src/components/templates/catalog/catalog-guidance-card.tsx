"use client"

import React from "react"
import { BookOpen } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export function CatalogGuidanceCard() {
  return (
    <FeatureGuidanceCard
      tag="HƯỚNG DẪN DANH MỤC SẢN PHẨM M02/M03"
      icon={BookOpen}
      title="Quản lý danh mục & Báo giá điện tử"
      description="Chuẩn hóa kho sản phẩm chính thức (Product Master) với định lượng hoa, bảng giá động theo chi nhánh và đường dẫn chia sẻ danh mục trực tuyến."
      tips={[
        "💰 Thiết lập biên lợi nhuận và phụ phí công thợ linh hoạt theo từng sự kiện/ngày lễ",
        "🔍 Tra cứu siêu tốc theo tone màu, loại hoa, dịp tặng và khoảng giá",
        "📱 Chia sẻ link E-Catalog tối ưu hiển thị trên điện thoại cho khách hàng chọn mẫu",
      ]}
    />
  )
}
