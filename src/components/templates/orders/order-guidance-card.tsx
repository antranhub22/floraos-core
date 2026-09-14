"use client"

import React from "react"
import { Package } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export function OrderGuidanceCard() {
  return (
    <FeatureGuidanceCard
      tag="HƯỚNG DẪN QUẢN LÝ ĐƠN HÀNG M09"
      icon={Package}
      title="Quy trình xưởng hoa & Giao vận chính xác"
      description="Chuyển hóa đơn hàng thành phiếu cắm hoa chi tiết cho nghệ nhân cắm hoa (Florist Ticket) và phiếu giao hoa kèm mã QR xác nhận hoàn tất."
      tips={[
        "✂️ Phiếu thợ cắm hoa phân rã rõ ràng: Số lượng từng loại cành hoa, giấy gói và tone màu chuẩn",
        "📸 Chụp ảnh nghiệm thu thành phẩm trước khi giao để gửi khách duyệt",
        "🛵 In phiếu giao hàng khổ A6 kèm thiệp chúc mừng và thông tin người nhận",
      ]}
    />
  )
}
