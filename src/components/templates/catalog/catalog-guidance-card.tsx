"use client"

import React from "react"
import { BookOpen } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export function CatalogGuidanceCard() {
  return (
    <FeatureGuidanceCard
      tag="HƯỚNG DẪN CATALOG & WEBSITE M06/M05"
      icon={BookOpen}
      title="Quản lý Catalog số trực tuyến & Landing Page chiến dịch"
      description="Xuất bản danh mục mẫu hoa điện tử tự động đồng bộ từ Product Master, sinh mã QR chia sẻ Zalo/Mạng xã hội và tạo trang đích chiến dịch bán hoa theo dịp lễ."
      tips={[
        "📱 Mọi mẫu hoa đã duyệt sẽ tự động cập nhật vào Catalog số trực tuyến",
        "⚡ Sinh mã QR tải về ngay lập tức để in ấn thiệp hoặc gửi cho khách hàng quét trên điện thoại",
        "🌐 Trang xem trước /c/[slug] tối ưu hiển thị hoàn hảo trên màn hình Zalo di động",
        "🎯 Tùy chọn dịp chiến dịch và phong cách thiết kế theo đúng nhận diện thương hiệu",
      ]}
    />
  )
}
