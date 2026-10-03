"use client"

import React, { useState, useMemo } from "react"
import { ListFilter, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PublishedCatalogLinks, type CatalogLinkItem } from "./catalog-link-widgets"
import { CatalogWizardFlow } from "./catalog-wizard-flow"
import { CatalogJourneyEntry, type CatalogExecutionMode } from "./catalog-journey-entry"
import { DualModeHeader } from "./dual-mode-header"
import { SmartInputDropzone, type SmartInputData } from "./smart-input-dropzone"
import { JourneyProcessingState, type ProcessingStep } from "./journey-processing-state"
import type { CatalogStyleVariant } from "@/modules/content-engine/domain/catalog-content-generator"

export interface CatalogProduct {
  id: string
  name: string
  code: string
  category?: string | null
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  occasion_code?: string | null
  color?: string | null
  collection?: string | null
  price?: number | null
  imageUrl?: string | null
}

export type { CatalogLinkItem }

interface CatalogManagementTabProps {
  products: CatalogProduct[]
  catalogLinks: CatalogLinkItem[]
  onRefresh: () => void
}

export function CatalogManagementTab({
  products,
  catalogLinks,
  onRefresh,
}: CatalogManagementTabProps) {
  // Chế độ: 'wizard' (Hành trình 4 bước tạo Catalog) hoặc 'manage' (Chế độ chuyên gia)
  const [viewMode, setViewMode] = useState<"wizard" | "manage">("wizard")
  // Spec §12 J1: chọn mode TRƯỚC khi nhập input
  const [journeyPhase, setJourneyPhase] = useState<"mode-selection" | "input">("mode-selection")
  const [catalogMode, setCatalogMode] = useState<CatalogExecutionMode>("autonomous")
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false)
  const [isAiPreFilled, setIsAiPreFilled] = useState(false)

  // AI prefilled data for wizard
  const [prefilledName, setPrefilledName] = useState("")
  const [prefilledDesc, setPrefilledDesc] = useState("")
  const [prefilledSelectedIds, setPrefilledSelectedIds] = useState<string[]>([])
  const [prefilledStyle, setPrefilledStyle] = useState<CatalogStyleVariant>("MODERN_SHOWROOM")

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOccasion, setFilterOccasion] = useState("")
  const [filterPriceMin, setFilterPriceMin] = useState("")
  const [filterPriceMax, setFilterPriceMax] = useState("")

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "ACTIVE"),
    [products]
  )

  const availableOccasions = useMemo(() => {
    const set = new Set<string>()
    activeProducts.forEach((p) => { if (p.occasion_code) set.add(p.occasion_code) })
    return Array.from(set)
  }, [activeProducts])

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.code.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filterOccasion && p.occasion_code !== filterOccasion) return false
      if (filterPriceMin && (p.price == null || p.price < Number(filterPriceMin))) return false
      if (filterPriceMax && (p.price == null || p.price > Number(filterPriceMax))) return false
      return true
    })
  }, [activeProducts, searchQuery, filterOccasion, filterPriceMin, filterPriceMax])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  const selectAll = () => {
    setSelectedIds(selectedIds.length === filteredProducts.length ? [] : filteredProducts.map((p) => p.id))
  }

  const [catalogAiSteps, setCatalogAiSteps] = useState<ProcessingStep[]>([
    { id: "analyze", label: "Phân tích yêu cầu & sự kiện", status: "pending" },
    { id: "select", label: "Tuyển chọn các mẫu hoa phù hợp nhất", status: "pending" },
    { id: "intro", label: "Sinh lời chào & tiêu đề Catalog bằng AI", status: "pending" },
    { id: "layout", label: "Hoàn thiện cấu hình bộ sưu tập", status: "pending" },
  ])

  const handleSmartAnalyze = async (data: SmartInputData) => {
    setIsAiAnalyzing(true)
    setCatalogAiSteps([
      { id: "analyze", label: "Phân tích yêu cầu & sự kiện", status: "running" },
      { id: "select", label: "Tuyển chọn các mẫu hoa phù hợp nhất", status: "pending" },
      { id: "intro", label: "Sinh lời chào & tiêu đề Catalog bằng AI", status: "pending" },
      { id: "layout", label: "Hoàn thiện cấu hình bộ sưu tập", status: "pending" },
    ])

    try {
      const lower = data.userDirectives.toLowerCase()
      let matchedOccasion = ""
      if (lower.includes("20/10") || lower.includes("phụ nữ")) matchedOccasion = "20-10"
      else if (lower.includes("valentine") || lower.includes("14/2")) matchedOccasion = "valentine"
      else if (lower.includes("8/3")) matchedOccasion = "8-3"
      else if (lower.includes("khai trương")) matchedOccasion = "grand-opening"
      else if (lower.includes("sinh nhật")) matchedOccasion = "birthday"

      // Step 1 done
      await new Promise((r) => setTimeout(r, 800))
      setCatalogAiSteps((prev) =>
        prev.map((s) =>
          s.id === "analyze" ? { ...s, status: "done" } : s.id === "select" ? { ...s, status: "running" } : s
        )
      )

      let matchingProds = matchedOccasion
        ? activeProducts.filter((p) => p.occasion_code === matchedOccasion)
        : []
      if (matchingProds.length === 0) {
        matchingProds = activeProducts.slice(0, 6)
      }
      const chosenIds = matchingProds.map((p) => p.id)
      setPrefilledSelectedIds(chosenIds)

      // Step 2 done
      await new Promise((r) => setTimeout(r, 700))
      setCatalogAiSteps((prev) =>
        prev.map((s) =>
          s.id === "select" ? { ...s, status: "done" } : s.id === "intro" ? { ...s, status: "running" } : s
        )
      )

      let generatedName = "Bộ sưu tập Hoa Tinh Tuyển"
      if (matchedOccasion) {
        const occName = matchedOccasion === "20-10" ? "Ngày Phụ Nữ 20/10" : matchedOccasion
        generatedName = `Bộ sưu tập Hoa ${occName}`
      } else if (data.userDirectives) {
        generatedName = `Bộ sưu tập: ${data.userDirectives.slice(0, 30)}...`
      }
      setPrefilledName(generatedName)
      setPrefilledStyle("EDITORIAL_LOOKBOOK")

      // Gọi API sinh intro nếu có
      try {
        const res = await fetch("/api/v1/content-engine/catalog-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            collectionName: generatedName,
            productCount: chosenIds.length,
            styleVariant: "EDITORIAL_LOOKBOOK",
          }),
        })
        if (res.ok) {
          const json = await res.json()
          if (json.data?.description) setPrefilledDesc(json.data.description)
        } else {
          setPrefilledDesc(`Tuyển chọn ${chosenIds.length} mẫu hoa tươi nghệ thuật được thiết kế tinh tế nhất dành riêng cho bạn.`)
        }
      } catch {
        setPrefilledDesc(`Tuyển chọn ${chosenIds.length} mẫu hoa tươi nghệ thuật được thiết kế tinh tế nhất dành riêng cho bạn.`)
      }

      // Step 3 done
      await new Promise((r) => setTimeout(r, 600))
      setCatalogAiSteps((prev) =>
        prev.map((s) =>
          s.id === "intro" ? { ...s, status: "done" } : s.id === "layout" ? { ...s, status: "running" } : s
        )
      )

      // Step 4 done
      await new Promise((r) => setTimeout(r, 500))
      setCatalogAiSteps((prev) =>
        prev.map((s) => (s.id === "layout" ? { ...s, status: "done" } : s))
      )

      setIsAiPreFilled(true)
      // Autonomous: AI đã hoàn thiện → chuyển sang wizard, nhảy thẳng bước 3 (Review & Xuất bản)
      setCatalogMode("guided")
    } finally {
      setIsAiAnalyzing(false)
    }
  }

  // Chế độ 1: Hành trình tạo Catalog mới
  if (viewMode === "wizard") {
    // J1: Mode selection screen TRƯỚC khi vào wizard
    if (journeyPhase === "mode-selection") {
      return (
        <CatalogJourneyEntry
          onSelectMode={(mode) => {
            setCatalogMode(mode)
            setJourneyPhase("input")
          }}
        />
      )
    }

    return (
      <div className="space-y-6">
        {/* DualModeHeader cho phép chuyển đổi chế độ linh hoạt */}
        <DualModeHeader
          mode={catalogMode === "autonomous" ? "auto" : "manual"}
          onModeChange={(m) => {
            setCatalogMode(m === "auto" ? "autonomous" : "guided")
          }}
          title="Phương thức tạo Catalog số"
          description="Lựa chọn linh hoạt giữa Tự động bằng AI hoặc Tự tuyển chọn từng bước. Bạn có thể đổi bất cứ lúc nào."
        />

        {catalogMode === "autonomous" ? (
          isAiAnalyzing ? (
            <JourneyProcessingState
              title="AI đang phân tích & tuyển chọn sản phẩm cho Catalog"
              steps={catalogAiSteps}
            />
          ) : (
            <SmartInputDropzone
              onAnalyze={handleSmartAnalyze}
              isAnalyzing={isAiAnalyzing}
              onSwitchToManual={() => setCatalogMode("guided")}
            />
          )
        ) : (
          <CatalogWizardFlow
            key={isAiPreFilled ? "prefilled" : "manual"}
            products={products}
            initialSelectedIds={prefilledSelectedIds.length > 0 ? prefilledSelectedIds : undefined}
            initialName={prefilledName || undefined}
            initialDesc={prefilledDesc || undefined}
            initialStyleVariant={prefilledStyle}
            isAiPreFilled={isAiPreFilled}
            initialStep={isAiPreFilled ? 3 : undefined}
            onBackToModeSelection={() => {
              setJourneyPhase("mode-selection")
              setIsAiPreFilled(false)
            }}
            onCreated={() => { setJourneyPhase("mode-selection"); onRefresh() }}
            onCancelToManage={() => { setViewMode("manage"); setJourneyPhase("mode-selection") }}
          />
        )}
      </div>
    )
  }

  // Chế độ 2: Quản lý Catalog đã phát hành & Kho hoa (Chế độ chuyên gia — J7)
  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-alt border border-border text-text-muted text-caption font-bold uppercase tracking-wider mb-1">
            <ListFilter className="h-3.5 w-3.5" />
            <span>Chế độ Quản lý chuyên sâu</span>
          </div>
          <h2 className="text-title font-bold text-text">Danh mục hoa & Liên kết catalog đã tạo</h2>
          <p className="text-body-sm text-text-muted mt-0.5">
            Quản lý các link catalog đang hoạt động, tra cứu mã QR và kiểm tra trạng thái các mẫu hoa.
          </p>
        </div>
        <Button
          onClick={() => { setViewMode("wizard"); setJourneyPhase("mode-selection") }}
          className="bg-primary text-surface hover:bg-primary-dark flex items-center gap-1.5 shrink-0 px-4"
        >
          <Sparkles className="h-4 w-4" />
          <span>Tạo Catalog mới</span>
        </Button>
      </div>

      {/* Published Links Section */}
      <PublishedCatalogLinks catalogLinks={catalogLinks} onRefresh={onRefresh} />

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface border border-border">
        <div>
          <label className="block text-caption font-semibold text-text-muted mb-1">Tìm kiếm</label>
          <Input placeholder="Tên hoặc mã hoa…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 text-body-sm" />
        </div>
        <div>
          <label className="block text-caption font-semibold text-text-muted mb-1">Dịp tặng</label>
          <select value={filterOccasion} onChange={(e) => setFilterOccasion(e.target.value)} className="w-full h-9 rounded-md border border-border bg-surface px-3 text-body-sm text-text focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Tất cả dịp</option>
            {availableOccasions.map((occ) => <option key={occ} value={occ}>{occ}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-caption font-semibold text-text-muted mb-1">Giá từ (VNĐ)</label>
          <Input type="number" placeholder="0" value={filterPriceMin} onChange={(e) => setFilterPriceMin(e.target.value)} className="h-9 text-body-sm" />
        </div>
        <div>
          <label className="block text-caption font-semibold text-text-muted mb-1">Giá đến (VNĐ)</label>
          <Input type="number" placeholder="Tối đa" value={filterPriceMax} onChange={(e) => setFilterPriceMax(e.target.value)} className="h-9 text-body-sm" />
        </div>
      </div>

      {/* Product Selection List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-body-sm font-bold text-text flex items-center gap-2">
            <span>Mẫu hoa sẵn sàng trong kho ({filteredProducts.length})</span>
            {selectedIds.length > 0 && <Badge tone="accent">Đã chọn {selectedIds.length}</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={selectAll} className="text-caption h-8">
            {selectedIds.length === filteredProducts.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const isSelected = selectedIds.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleSelect(p.id)}
                className={`rounded-2xl border p-3.5 flex items-center gap-3 w-full text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isSelected ? "border-primary bg-primary-muted/20 shadow-xs" : "border-border bg-surface hover:border-border-hover"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  tabIndex={-1}
                  aria-hidden="true"
                  className="h-4 w-4 accent-primary rounded pointer-events-none"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-bold text-text-muted">{p.code}</span>
                    <span className="text-body-sm font-bold text-text truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-caption text-text-muted">
                    {p.category && <span>{p.category}</span>}
                    {p.occasion_code && <span>· {p.occasion_code}</span>}
                  </div>
                </div>
                {p.price != null && (
                  <div className="text-body-sm font-black text-primary shrink-0">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.price)}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
