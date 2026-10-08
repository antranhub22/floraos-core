"use client"

import React, { useState } from "react"
import { Building2, Palette, Sparkles, ShieldCheck, CalendarHeart, RotateCcw, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { FeatureGuidanceCard } from "@/components/ui/feature-guidance-card"
import { TabActionHeader, type TabItem, type TabAction, type TabOverflowAction } from "@/components/ui/tab-header"
import { useTenantProfile } from "@/lib/hooks/use-tenant-profile"
import { BusinessProfileForm } from "@/components/profiles/business-profile-form"
import { BrandProfileForm } from "@/components/profiles/brand-profile-form"
import { BrandAssetsManagerTab } from "@/components/profiles/brand-assets-manager-tab"
import { SalesDefaultsForm } from "@/components/profiles/sales-defaults-form"
import { GreetingLineOverrideForm } from "@/components/profiles/greeting-line-override-form"
import { OccasionsSettingsForm } from "@/components/organization/occasions-settings-form"
import { ProfileJourneyWorkspace } from "@/components/profiles/journey/profile-journey-workspace"
import { StorePoliciesEditor } from "@/components/profiles/store-policies-editor"
import { useApi, apiSend } from "@/components/greeting-card/greeting-api"
import {
  parseStorePolicies,
  STORE_POLICIES_SETTINGS_KEY,
  type StorePoliciesConfig,
} from "@/modules/greeting-card/domain/store-policy"

const EXPERT_MODE_STORAGE_KEY = "floraos_profile_expert_mode"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<string>("business")
  const [isExpertMode, setIsExpertMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(EXPERT_MODE_STORAGE_KEY) === "true"
    }
    return false
  })

  const toggleExpertMode = () => {
    setIsExpertMode((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem(EXPERT_MODE_STORAGE_KEY, String(next))
      }
      return next
    })
  }

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
      id: "assets",
      label: "Tài nguyên thương hiệu",
      icon: Sparkles,
      badge: "Master",
      badgeTone: "accent",
    },
    {
      id: "sales",
      label: "Chính sách & Cam kết",
      icon: ShieldCheck,
    },
    {
      id: "occasions",
      label: "Dịp lễ & Giọng văn",
      icon: CalendarHeart,
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
      {/* 1. LỚP JOURNEY-FIRST UX WORKSPACE (Mặc định chào đón Store Admin) */}
      <ProfileJourneyWorkspace
        business={business}
        brand={brand}
        onSelectTab={setActiveTab}
        onToggleExpertMode={toggleExpertMode}
        isExpertMode={isExpertMode}
      />

      {/* 2. Thanh Điều Hướng Tab (Hiển thị khi ở Chế độ Chuyên gia hoặc người dùng muốn chuyển tab nhanh) */}
      {isExpertMode && (
        <TabActionHeader
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          primaryActions={primaryActions}
          overflowActions={overflowActions}
        />
      )}

      {/* Thông báo trạng thái (Alert Banners) */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-secondary/30 bg-secondary-bg p-4 text-body-sm font-medium text-secondary animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 size={18} className="text-secondary flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-danger/30 bg-danger-bg p-4 text-body-sm font-medium text-danger animate-in fade-in duration-200 shadow-xs">
          <AlertCircle size={18} className="text-danger flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Nội dung Form theo từng Tab */}
      {loading ? (
        <div className="p-4 rounded-2xl border border-border bg-surface">
          <SkeletonBlock lines={5} label="Đang tải dữ liệu hồ sơ tổ chức" />
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

          {activeTab === "assets" && (
            <BrandAssetsManagerTab
              initialData={brand}
              onSave={saveBrand}
              saving={saving}
            />
          )}

          {activeTab === "sales" && (
            <div className="space-y-6">
              {/* Quản lý tập trung Ưu đãi, Cam kết & Thỏa thuận (Task #2) */}
              <StorePoliciesSection />
              <SalesDefaultsForm
                initialBrandData={brand}
                onSave={saveBrand}
                saving={saving}
              />
              {/* Ghi đè template theo tenant (nợ #99/#105) — tự lưu riêng qua
                  /api/v1/template-overrides, KHÔNG qua saveBrand/brand_profiles
                  ở trên. Xem chú thích đầu tệp component. */}
              <GreetingLineOverrideForm />
            </div>
          )}

          {activeTab === "occasions" && <OccasionsSettingsForm />}
        </div>
      )}
    </div>
  )
}

function StorePoliciesSection() {
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const [saving, setSaving] = useState(false)
  const policies = org.data ? parseStorePolicies(org.data.settings) : null

  async function handleSave(updatedPolicies: StorePoliciesConfig): Promise<boolean> {
    setSaving(true)
    try {
      await apiSend(
        "/api/v1/organizations/current",
        "PATCH",
        {
          settings: {
            [STORE_POLICIES_SETTINGS_KEY]: updatedPolicies,
          },
        },
        "Không lưu được chính sách & cam kết"
      )
      await org.mutate()
      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }

  // Editor giữ bản nháp riêng — chỉ dựng khi đã có dữ liệu thật, tránh ghi đè mặc định lên chính sách đã lưu
  if (!policies) return <p className="text-body-sm text-text-muted">Đang tải chính sách…</p>
  return (
    <StorePoliciesEditor
      initialPolicies={policies}
      onSave={handleSave}
      saving={saving || org.isLoading}
    />
  )
}
