"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, Send, ShieldCheck, BookOpen, RefreshCw, GitMerge, Wand2, LayoutList } from "lucide-react"
import { TabActionHeader, type TabItem } from "@/components/ui/tab-header"
import { cn } from "@/lib/utils"
import { SalesBrochureTab } from "@/components/greeting-card/sales/sales-brochure-tab"
import { AdminBrochurePaymentTab } from "@/components/greeting-card/admin/admin-brochure-payment-tab"
import { CatalogListTab } from "@/components/greeting-card/catalog/catalog-list-tab"
import { CatalogDetailPanel } from "@/components/greeting-card/catalog/catalog-detail-panel"
import { JourneyWizard } from "@/components/greeting-card/journey/journey-wizard"
import { CoordinatorBrochureTab } from "@/components/greeting-card/coordinator/coordinator-brochure-tab"
import { BrochureOrderTrackingTab } from "@/components/greeting-card/tracking/brochure-order-tracking-tab"

type ActiveTab = "sales" | "payment" | "catalog" | "coordinator" | "tracking"
type ViewMode = "wizard" | "manager"
type CatalogBasic = { id: string; name: string }

const MODES: { id: ViewMode; label: string; icon: typeof Wand2 }[] = [
  { id: "wizard", label: "Gửi nhanh", icon: Wand2 },
  { id: "manager", label: "Quản lý", icon: LayoutList },
]

export default function TheChaoPage() {
  const router = useRouter()
  // "wizard": luồng 3 bước gửi thẻ · "manager": bảng quản lý chi tiết
  const [viewMode, setViewMode] = useState<ViewMode>("wizard")
  const [activeTab, setActiveTab] = useState<ActiveTab>("catalog")
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogBasic | null>(null)
  const [catalogCount, setCatalogCount] = useState<number | null>(null)
  const [sessionCount, setSessionCount] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadCounts = useCallback(async () => {
    try {
      const [catRes, sesRes] = await Promise.all([
        fetch("/api/v1/greeting-card/catalogs").then((r) => r.json()).catch(() => ({ data: null })),
        fetch("/api/v1/greeting-card/send-links").then((r) => r.json()).catch(() => ({ data: null })),
      ])
      if (Array.isArray(catRes.data)) setCatalogCount(catRes.data.length)
      if (Array.isArray(sesRes.data)) setSessionCount(sesRes.data.length)
    } catch {
      // Số đếm chỉ để tham khảo — bỏ qua lỗi
    }
  }, [])

  useEffect(() => {
    void loadCounts()
  }, [loadCounts])

  const tabs: TabItem[] = [
    { id: "catalog", icon: BookOpen, label: "Bộ sưu tập", ...(catalogCount !== null ? { badge: catalogCount } : {}) },
    { id: "tracking", icon: GitMerge, label: "Theo dõi tiến độ" },
    { id: "sales", icon: Send, label: "Bán hàng", ...(sessionCount !== null ? { badge: sessionCount } : {}) },
    { id: "payment", icon: ShieldCheck, label: "Điều hành" },
    { id: "coordinator", icon: Sparkles, label: "Điều phối" },
  ]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <Link
            href="/don-hang"
            className="mb-2 inline-flex items-center gap-1 text-body-sm font-medium text-text-muted hover:text-foreground"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Sổ đơn hàng
          </Link>
          <h1 className="text-title font-bold text-foreground">Thẻ chào mẫu hoa</h1>
          <p className="mt-1 max-w-2xl text-body-sm text-text-muted">
            Gửi khách một bộ sưu tập để lướt xem, chọn mẫu và tự đặt hoa, thanh toán ngay trên điện thoại.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="Chế độ làm việc" className="inline-flex rounded-xl border border-border bg-surface-alt p-1">
            {MODES.map((m) => {
              const active = viewMode === m.id
              const Icon = m.icon
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setViewMode(m.id)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-body-sm font-semibold transition-colors",
                    active ? "bg-surface text-primary shadow-xs" : "text-text-muted hover:text-foreground",
                  )}
                >
                  <Icon size={16} aria-hidden="true" />
                  {m.label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              void loadCounts()
              setRefreshKey((k) => k + 1)
              router.refresh()
            }}
            aria-label="Làm mới dữ liệu"
            title="Làm mới dữ liệu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-text-muted hover:bg-surface-alt hover:text-foreground"
          >
            <RefreshCw size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      {viewMode === "wizard" ? (
        <JourneyWizard
          key={refreshKey}
          onFinish={() => {
            void loadCounts()
            setActiveTab("sales")
            setViewMode("manager")
          }}
        />
      ) : (
        <div key={refreshKey} className="flex flex-col gap-4">
          <TabActionHeader
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(id) => {
              setActiveTab(id as ActiveTab)
              if (id !== "catalog") setSelectedCatalog(null)
            }}
          />

          {activeTab === "catalog" &&
            (selectedCatalog ? (
              <CatalogDetailPanel
                catalogId={selectedCatalog.id}
                catalogName={selectedCatalog.name}
                onBack={() => {
                  setSelectedCatalog(null)
                  void loadCounts()
                }}
              />
            ) : (
              <CatalogListTab onSelectCatalog={(c) => setSelectedCatalog({ id: c.id, name: c.name })} />
            ))}
          {activeTab === "tracking" && <BrochureOrderTrackingTab />}
          {activeTab === "sales" && (
            <SalesBrochureTab
              onNavigateToCatalog={() => {
                setSelectedCatalog(null)
                setActiveTab("catalog")
              }}
            />
          )}
          {activeTab === "coordinator" && <CoordinatorBrochureTab />}
          {activeTab === "payment" && <AdminBrochurePaymentTab />}
        </div>
      )}
    </div>
  )
}
