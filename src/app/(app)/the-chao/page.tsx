"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, Send, ShieldCheck, BookOpen, RefreshCw, SlidersHorizontal, Wand2, GitMerge } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SalesBrochureTab } from "@/components/greeting-card/sales/sales-brochure-tab"
import { AdminBrochurePaymentTab } from "@/components/greeting-card/admin/admin-brochure-payment-tab"
import { CatalogListTab } from "@/components/greeting-card/catalog/catalog-list-tab"
import { CatalogDetailPanel } from "@/components/greeting-card/catalog/catalog-detail-panel"
import { JourneyWizard } from "@/components/greeting-card/journey/journey-wizard"
import { CoordinatorBrochureTab } from "@/components/greeting-card/coordinator/coordinator-brochure-tab"
import { BrochureOrderTrackingTab } from "@/components/greeting-card/tracking/brochure-order-tracking-tab"

type ActiveTab = "sales" | "payment" | "catalog" | "coordinator" | "tracking"
type CatalogBasic = { id: string; name: string }

export default function TheChaoPage() {
  const router = useRouter()
  // viewMode: "wizard" (luồng tuần tự 3 bước tinh gọn) | "manager" (bảng chi tiết)
  const [viewMode, setViewMode] = useState<"wizard" | "manager">("wizard")
  const [activeTab, setActiveTab] = useState<ActiveTab>("catalog")
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogBasic | null>(null)
  const [catalogCount, setCatalogCount] = useState<number>(0)
  const [sessionCount, setSessionCount] = useState<number>(0)

  const loadCounts = useCallback(async () => {
    try {
      const [catRes, sesRes] = await Promise.all([
        fetch("/api/v1/greeting-card/catalogs").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/v1/greeting-card/send-links").then((r) => r.json()).catch(() => ({ data: [] })),
      ])
      if (Array.isArray(catRes.data)) setCatalogCount(catRes.data.length)
      if (Array.isArray(sesRes.data)) setSessionCount(sesRes.data.length)
    } catch {
      // Ignore count fetch errors
    }
  }, [])

  useEffect(() => {
    void loadCounts()
  }, [loadCounts])

  const tabs: { id: ActiveTab; icon: React.ReactNode; label: string }[] = [
    { id: "catalog", icon: <BookOpen size={16} />, label: "Bộ Sưu Tập" },
    { id: "tracking", icon: <GitMerge size={16} />, label: "Theo Dõi Tiến Độ" },
    { id: "sales", icon: <Send size={16} />, label: "Sale" },
    { id: "payment", icon: <ShieldCheck size={16} />, label: "Điều hành" },
    { id: "coordinator", icon: <Sparkles size={16} />, label: "Điều phối" },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-foreground">Thẻ Chào Mẫu Hoa</h1>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-caption font-bold">
                Swipe Brochure
              </span>
            </div>
            <p className="text-body-sm text-text-muted mt-0.5">
              Tạo bộ sưu tập hoa, sinh link gửi khách hàng lướt thẻ chọn hoa và chốt đơn tự động
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Mode Switcher */}
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === "wizard" ? "manager" : "wizard"))}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-body-sm font-bold border transition-colors ${
              viewMode === "manager"
                ? "bg-selected text-primary border-primary shadow-xs"
                : "bg-surface text-text-muted border-border hover:text-foreground"
            }`}
          >
            {viewMode === "wizard" ? (
              <>
                <SlidersHorizontal size={14} />
                <span>Xem Bảng Quản Lý Chi Tiết</span>
              </>
            ) : (
              <>
                <Wand2 size={14} />
                <span>Vào Luồng Hướng Dẫn Từng Bước</span>
              </>
            )}
          </button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/don-hang")}
            className="text-body-sm gap-1.5 h-9"
          >
            <ArrowLeft size={14} />
            <span>Sổ đơn hàng</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void loadCounts()
              router.refresh()
            }}
            aria-label="Làm mới trang"
            className="text-body-sm gap-1.5 h-9"
          >
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* VIEW MODE 1: JOURNEY WIZARD (MẶC ĐỊNH - RÕ RÀNG, CHỈ 1 ĐƯỜNG ĐI) */}
      {viewMode === "wizard" ? (
        <JourneyWizard
          onFinish={() => {
            void loadCounts()
            setActiveTab("sales")
            setViewMode("manager")
          }}
          onGoToManager={() => setViewMode("manager")}
        />
      ) : (
        /* VIEW MODE 2: BẢNG QUẢN LÝ CHUYÊN SÂU (EXPERT MODE) */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 border-b border-border bg-surface px-4 py-1 rounded-xl overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.id !== "catalog") setSelectedCatalog(null)
                  }}
                  className={`flex items-center gap-2 py-2 px-3 text-body-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-text-muted hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setViewMode("wizard")}
              className="text-primary font-bold text-body-sm underline hidden sm:inline-flex items-center gap-1"
            >
              <Wand2 size={14} />
              <span>Quay lại luồng tạo nhanh</span>
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === "catalog" && (
            selectedCatalog ? (
              <CatalogDetailPanel
                catalogId={selectedCatalog.id}
                catalogName={selectedCatalog.name}
                onBack={() => {
                  setSelectedCatalog(null)
                  void loadCounts()
                }}
              />
            ) : (
              <CatalogListTab
                onSelectCatalog={(c) => setSelectedCatalog({ id: c.id, name: c.name })}
              />
            )
          )}
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


