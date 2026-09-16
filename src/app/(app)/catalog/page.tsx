"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TabActionHeader } from "@/components/ui/tab-header"
import { CatalogGuidanceCard } from "@/components/templates/catalog/catalog-guidance-card"
import { CatalogManagementTab, type CatalogProduct, type CatalogLinkItem } from "@/components/catalog/catalog-management-tab"
import { LandingCampaignTab } from "@/components/catalog/landing-campaign-tab"

/**
 * Trang Catalog & Website (Chức năng #6, M06 + M05).
 *
 * Orchestrator gọn — chỉ quản lý fetch dữ liệu chung và chuyển tab,
 * mọi nghiệp vụ UI nằm ở CatalogManagementTab / LandingCampaignTab.
 */
export default function CatalogWebsitePage() {
  const router = useRouter()
  const [tab, setTab] = useState<"catalog" | "landing">("catalog")
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [catalogLinks, setCatalogLinks] = useState<CatalogLinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      const [prodRes, analysisRes] = await Promise.all([
        fetch("/api/v1/products"),
        fetch("/api/v1/vision/analyses?approval_state=APPROVED").catch(() => null),
      ])
      if (prodRes.status === 401) { router.push("/dang-nhap"); return }
      if (!prodRes.ok) throw new Error("Không thể tải sản phẩm")
      const prodJson = await prodRes.json()
      const rawProducts: CatalogProduct[] = prodJson.data || []

      // Ghép ảnh và thông tin từ phân tích Vision đã duyệt
      let analysisMap = new Map<string, { imageUrl?: string | null; price?: number | null }>()
      if (analysisRes && analysisRes.ok) {
        const analysisJson = await analysisRes.json().catch(() => ({}))
        const analyses = Array.isArray(analysisJson.data) ? analysisJson.data : []
        for (const a of analyses) {
          if (a.product_id) {
            const raw = (a.raw as Record<string, unknown>) || {}
            const edited = (a.edited as Record<string, unknown>) || {}
            const salesData = (edited.salesData || raw.salesData || {}) as Record<string, unknown>
            const price = typeof salesData.price === "number" ? salesData.price : null
            analysisMap.set(a.product_id, {
              imageUrl: a.image_url || null,
              price,
            })
          }
        }
      }

      const enriched = rawProducts.map((p) => {
        const extra = analysisMap.get(p.id)
        return {
          ...p,
          imageUrl: extra?.imageUrl || p.imageUrl || null,
          price: p.price ?? extra?.price ?? null,
        }
      })

      setProducts(enriched)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định")
    }
  }, [router])

  const fetchCatalogLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/catalog-links?include_revoked=true")
      if (res.status === 401) { router.push("/dang-nhap"); return }
      if (!res.ok) throw new Error("Không thể tải danh sách catalog")
      const data = await res.json()
      setCatalogLinks(data.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định")
    }
  }, [router])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchProducts(), fetchCatalogLinks()])
  }, [fetchProducts, fetchCatalogLinks])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await refreshAll()
      setLoading(false)
    }
    loadData()
  }, [refreshAll])

  const activeCount = products.filter((p) => p.status === "ACTIVE").length

  if (loading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <PageHeader onBack={() => router.push("/")} />
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="mt-4 text-text-muted text-sm">Đang tải danh mục sản phẩm…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader onBack={() => router.push("/")} />

      <div className="flex flex-1 flex-col overflow-y-auto p-[18px] gap-5">
        {error && (
          <div className="rounded-lg bg-destructive-bg px-4 py-2 text-[13px] text-destructive flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* Khối hướng dẫn chuẩn SSOT */}
        <CatalogGuidanceCard />

        {/* Tab Switcher */}
        <TabActionHeader
          tabs={[
            { id: "catalog", label: "Catalog số trực tuyến", icon: BookOpen, badge: `${activeCount} SP`, badgeTone: "neutral" },
            { id: "landing", label: "Landing page chiến dịch", icon: Sparkles, badge: "M05", badgeTone: "accent" },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as "catalog" | "landing")}
        />

        {/* Tab Content */}
        {tab === "catalog" && (
          <CatalogManagementTab
            products={products}
            catalogLinks={catalogLinks}
            onRefresh={refreshAll}
          />
        )}

        {tab === "landing" && (
          <LandingCampaignTab products={products} onRefresh={refreshAll} />
        )}
      </div>
    </div>
  )
}

/* ── Micro-component Header ──────────────────────────────────────────── */

function PageHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
      <div>
        <div className="text-xs text-text-muted">M06 + M05</div>
        <div className="text-[17px] font-extrabold text-primary">Catalog & Website</div>
      </div>
      <Button variant="ghost" onClick={onBack} className="flex items-center gap-1.5">
        <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
      </Button>
    </div>
  )
}