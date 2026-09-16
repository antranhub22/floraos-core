"use client"

import React, { useState } from "react"
import { Building2, Palette, ShieldCheck, RotateCcw, Save, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/ui/feature-guidance-card"
import { TabActionHeader, type TabItem, type TabAction, type TabOverflowAction } from "@/components/ui/tab-header"
import { useTenantProfile } from "@/lib/hooks/use-tenant-profile"
import { BusinessProfileForm } from "@/components/profiles/business-profile-form"
import { BrandProfileForm } from "@/components/profiles/brand-profile-form"
import { SalesDefaultsForm } from "@/components/profiles/sales-defaults-form"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<string>("business")
  const {
    business,
    brand,
    loading,
    saving,
    error,
    successMessage,
    reload,
    saveBusiness,
    saveBrand,
  } = useTenantProfile()

  const tabs: TabItem[] = [
    {
      id: "business",
      label: "Hồ sơ kinh doanh",
      icon: Building2,
    },
    {
      id: "brand",
      label: "Nhận diện thương hiệu",
      icon: Palette,
      badge: "5 Màu Hex",
      badgeTone: "accent",
    },
    {
      id: "sales",
      label: "Chính sách & Cam kết",
      icon: ShieldCheck,
    },
  ]

  const primaryActions: TabAction[] = [
    {
      id: "reload",
      label: "Tải lại",
      icon: RotateCcw,
      variant: "outline",
      onClick: reload,
      disabled: loading || saving,
    },
  ]

  const overflowActions: TabOverflowAction[] = [
    {
      id: "view-catalog",
      label: "Xem Catalog cửa hàng",
      icon: ExternalLink,
      onClick: () => {
        window.open("/catalog", "_blank")
      },
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* 1. Khối Hướng dẫn Thao tác Chuẩn FloraOS (FeatureGuidanceCard) */}
      <FeatureGuidanceCard
        tag="HƯỚNG DẪN THIẾT LẬP HỒ SƠ"
        title="Hồ Sơ Cửa Hàng & Nhận Diện Thương Hiệu (Master Profile)"
        titleIcon={Building2}
        description="Thông tin cấu hình tại đây là Nguồn Chân Lý Duy Nhất (SSOT), tự động nạp vào Thẻ chào khách A6, Kịch bản Zalo, Watermark Video Studio, Theme E-Catalog và Rào chắn ngôn từ AI Content."
        maxWidthClassName="max-w-4xl"
        tips={[
          "🏬 Nhập chính xác hotline/Zalo để tự động tạo link đặt hoa nhanh",
          "🎨 Cài đặt 5 mã màu hex để đồng bộ giao diện nhận diện đa kênh",
          "✨ Tone giọng và từ cấm giúp AI không bao giờ nói sai định vị của shop",
        ]}
      />

      {/* 2. Thanh Điều Hướng Tab & Hành Động Góc Trên Bên Phải (Standardized Tab Action Header) */}
      <TabActionHeader
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryActions={primaryActions}
        overflowActions={overflowActions}
      />

      {/* Thông báo trạng thái (Alert Banners) */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs sm:text-sm font-medium text-emerald-800 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs sm:text-sm font-medium text-red-800 animate-in fade-in duration-200 shadow-xs">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Nội dung Form theo từng Tab */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-border bg-surface text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
          <p className="text-xs font-semibold text-text-muted">Đang tải dữ liệu hồ sơ tổ chức...</p>
        </div>
      ) : (
        <div>
          {activeTab === "business" && (
            <BusinessProfileForm
              initialData={business}
              onSave={saveBusiness}
              saving={saving}
            />
          )}

          {activeTab === "brand" && (
            <BrandProfileForm
              initialData={brand}
              onSave={saveBrand}
              saving={saving}
            />
          )}

          {activeTab === "sales" && (
            <SalesDefaultsForm
              initialBrandData={brand}
              onSave={saveBrand}
              saving={saving}
            />
          )}
        </div>
      )}
    </div>
  )
}
