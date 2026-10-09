"use client"

import React, { useState, useCallback } from "react"
import Link from "next/link"
import { useSWRConfig } from "swr"
import { useApi } from "@/components/greeting-card/greeting-api"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, Send, ShieldCheck, BookOpen, RefreshCw, GitMerge, Wand2, LayoutList } from "lucide-react"
import { TabActionHeader, type TabItem } from "@/components/ui/tab-header"
import { cn } from "@/lib/utils"
import { useSession } from "@/lib/session"
import { SalesBrochureTab } from "@/components/greeting-card/sales/sales-brochure-tab"
import { AdminBrochurePaymentTab } from "@/components/greeting-card/admin/admin-brochure-payment-tab"
import { CatalogListTab } from "@/components/greeting-card/catalog/catalog-list-tab"
import { CatalogDetailPanel } from "@/components/greeting-card/catalog/catalog-detail-panel"
import { JourneyWizard } from "@/components/greeting-card/journey/journey-wizard"
import { CoordinatorBrochureTab } from "@/components/greeting-card/coordinator/coordinator-brochure-tab"
import { BrochureOrderTrackingTab } from "@/components/greeting-card/tracking/brochure-order-tracking-tab"
import { InboxButton } from "@/components/greeting-card/inbox/inbox-button"
import { BrochureUserGuideModal } from "@/components/greeting-card/brochure-user-guide-modal"
import { ShopProfileReadiness } from "@/components/greeting-card/shop-profile-readiness"
import { defaultTheChaoView } from "@/components/greeting-card/default-view"
import { ExportOrdersButton } from "@/components/orders/export-orders-button"
import type { InboxTarget } from "@/components/greeting-card/inbox/inbox-panel"

type ActiveTab = "sales" | "payment" | "catalog" | "coordinator" | "tracking"
type ViewMode = "wizard" | "manager"
type CatalogBasic = { id: string; name: string }

const MODES: { id: ViewMode; label: string; icon: typeof Wand2 }[] = [
  { id: "wizard", label: "Gửi nhanh", icon: Wand2 },
  { id: "manager", label: "Quản lý", icon: LayoutList },
]

export default function TheChaoPage() {
  const router = useRouter()
  const { can } = useSession()
  // "wizard": luồng 3 bước gửi thẻ · "manager": bảng quản lý chi tiết — mở theo vai (Điều hành/Điều phối/Sale)
  const [viewMode, setViewMode] = useState<ViewMode>(() => defaultTheChaoView(can).viewMode)
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => defaultTheChaoView(can).activeTab)
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogBasic | null>(null)
  // Số đếm cho huy hiệu tab (SWR). Danh sách phân trang: quá 100 thì hiện "100+".
  const catalogList = useApi<{ data: unknown[]; next_cursor: string | null }>("/api/v1/greeting-card/catalogs?limit=100")
  const sessionList = useApi<{ data: unknown[]; next_cursor: string | null }>("/api/v1/greeting-card/send-links?limit=100")
  const countOf = (r: { data: unknown[]; next_cursor: string | null } | undefined) =>
    r ? (r.next_cursor ? "100+" : r.data.length) : null
  const catalogCount = countOf(catalogList.data)
  const sessionCount = countOf(sessionList.data)
  const cancellationList = useApi<{ data: unknown[] }>(
    can("R11") ? "/api/v1/greeting-card/cancellation-requests" : null,
    { refreshInterval: 20_000 }
  )
  const pendingCancelCount = cancellationList.data?.data.length ? cancellationList.data.data.length : null
  const [refreshKey, setRefreshKey] = useState(0)

  // Từ Hộp việc: mở đúng tab rồi cuộn tới đúng thẻ đơn (chờ dữ liệu tab tải xong tối đa ~4 giây)
  const openInboxTarget = useCallback((t: InboxTarget) => {
    setViewMode("manager")
    setActiveTab(t.tab)
    const key = t.orderId ?? t.sessionId
    if (!key) return
    let tries = 0
    const timer = window.setInterval(() => {
      const el = document.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(key)}"]`)
      if (el || ++tries > 20) {
        window.clearInterval(timer)
        if (!el) return
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add("ring-2", "ring-primary")
        window.setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 2500)
      }
    }, 200)
  }, [])

  // "Làm mới" = mọi danh sách SWR trên trang tải lại
  const { mutate } = useSWRConfig()
  const refreshAll = useCallback(() => void mutate(() => true), [mutate])

  // Chỉ hiện tab người dùng có năng lực làm (ẩn hiện giao diện — máy chủ vẫn kiểm ở mọi endpoint)
  const allowed: Record<ActiveTab, boolean> = {
    catalog: can("L1"),
    tracking: can("R1"),
    sales: can("R2"),
    payment: can("R11"),
    coordinator: can("R3") || can("R4") || can("R5"),
  }
  const tabs: TabItem[] = ([
    { id: "catalog", icon: BookOpen, label: "Bộ sưu tập", ...(catalogCount !== null ? { badge: catalogCount } : {}) },
    { id: "tracking", icon: GitMerge, label: "Theo dõi tiến độ" },
    { id: "sales", icon: Send, label: "Bán hàng", ...(sessionCount !== null ? { badge: sessionCount } : {}) },
    { id: "payment", icon: ShieldCheck, label: "Điều hành", ...(pendingCancelCount !== null ? { badge: pendingCancelCount } : {}) },
    { id: "coordinator", icon: Sparkles, label: "Điều phối" },
  ] satisfies TabItem[]).filter((t) => allowed[t.id as ActiveTab])
  // Tab đang chọn bị ẩn (không đủ quyền) → mở tab đầu tiên được phép
  const shownTab: ActiveTab = allowed[activeTab] ? activeTab : ((tabs[0]?.id as ActiveTab | undefined) ?? activeTab)

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

        <div className="flex flex-wrap items-center gap-2">
          <BrochureUserGuideModal />
          <InboxButton onOpenTarget={openInboxTarget} />
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
              refreshAll()
              setRefreshKey((k) => k + 1)
              router.refresh()
            }}
            aria-label="Làm mới dữ liệu"
            title="Làm mới dữ liệu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-text-muted hover:bg-surface-alt hover:text-foreground"
          >
            <RefreshCw size={16} aria-hidden="true" />
          </button>
          {(can("R11") || can("R1")) && (
            <ExportOrdersButton
              apiPath="/api/v1/orders/export"
              extraParams={{ source: "BROCHURE" }}
              filename="the-chao-don-hang.xlsx"
              label="Xuất Excel"
            />
          )}
        </div>
      </header>

      <ShopProfileReadiness />

      {viewMode === "wizard" ? (
        <JourneyWizard
          key={refreshKey}
          onFinish={() => {
            refreshAll()
            setActiveTab("sales")
            setViewMode("manager")
          }}
        />
      ) : (
        <div key={refreshKey} className="flex flex-col gap-4">
          <TabActionHeader
            tabs={tabs}
            activeTab={shownTab}
            onTabChange={(id) => {
              setActiveTab(id as ActiveTab)
              if (id !== "catalog") setSelectedCatalog(null)
            }}
          />

          {shownTab === "catalog" &&
            (selectedCatalog ? (
              <CatalogDetailPanel
                catalogId={selectedCatalog.id}
                catalogName={selectedCatalog.name}
                onBack={() => {
                  setSelectedCatalog(null)
                  refreshAll()
                }}
              />
            ) : (
              <CatalogListTab onSelectCatalog={(c) => setSelectedCatalog({ id: c.id, name: c.name })} />
            ))}
          {shownTab === "tracking" && <BrochureOrderTrackingTab />}
          {shownTab === "sales" && (
            <SalesBrochureTab
              onNavigateToCatalog={() => {
                setSelectedCatalog(null)
                setActiveTab("catalog")
              }}
            />
          )}
          {shownTab === "coordinator" && <CoordinatorBrochureTab />}
          {shownTab === "payment" && <AdminBrochurePaymentTab />}
        </div>
      )}
    </div>
  )
}
