"use client"

import React from "react"
import { Package } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export function OrderGuidanceCard() {
  return (
    <FeatureGuidanceCard
      tag="HƯỚNG DẪN XỬ LÝ ĐƠN HÀNG"
      icon={Package}
      title="Quy trình cắm hoa và giao hàng"
      description="Mỗi đơn hàng có phiếu cắm hoa cho thợ và phiếu giao hoa kèm mã QR để xác nhận giao thành công."
      tips={[
        "✂️ Phiếu cắm hoa ghi rõ số lượng từng loại hoa, giấy gói và tông màu chuẩn",
        "📸 Chụp ảnh thành phẩm gửi khách duyệt trước khi giao",
        "🛵 In phiếu giao hoa kèm thiệp và thông tin người nhận",
      ]}
    />
  )
}
