"use client"

import React, { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PublishedCatalogLinks, CreateCatalogModal, type CatalogLinkItem } from "./catalog-link-widgets"

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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOccasion, setFilterOccasion] = useState("")
  const [filterPriceMin, setFilterPriceMin] = useState("")
  const [filterPriceMax, setFilterPriceMax] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-border shadow-xs">
        <div>
          <h2 className="text-base font-bold text-text">Danh mục hoa & Liên kết chia sẻ</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Chọn mẫu hoa muốn đưa vào bộ sưu tập hoặc xuất bản toàn bộ sản phẩm đang hoạt động.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-primary text-white flex items-center gap-1.5 shrink-0">
          <Plus size={16} />
          <span>Xuất bản Catalog mới ({selectedIds.length > 0 ? `${selectedIds.length} SP` : "Tất cả"})</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface border border-border">
        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1">Tìm kiếm</label>
          <Input placeholder="Tên hoặc mã hoa…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 text-xs" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1">Dịp tặng</label>
          <select value={filterOccasion} onChange={(e) => setFilterOccasion(e.target.value)} className="w-full h-9 rounded-md border border-border bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Tất cả dịp</option>
            {availableOccasions.map((occ) => <option key={occ} value={occ}>{occ}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1">Giá từ (VNĐ)</label>
          <Input type="number" placeholder="0" value={filterPriceMin} onChange={(e) => setFilterPriceMin(e.target.value)} className="h-9 text-xs" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1">Giá đến (VNĐ)</label>
          <Input type="number" placeholder="Tối đa" value={filterPriceMax} onChange={(e) => setFilterPriceMax(e.target.value)} className="h-9 text-xs" />
        </div>
      </div>

      {/* Product Selection List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-text flex items-center gap-2">
            <span>Mẫu hoa sẵn sàng ({filteredProducts.length})</span>
            {selectedIds.length > 0 && <Badge tone="accent">Đã chọn {selectedIds.length}</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-8">
            {selectedIds.length === filteredProducts.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const isSelected = selectedIds.includes(p.id)
            return (
              <Card key={p.id} onClick={() => toggleSelect(p.id)} className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all border ${isSelected ? "border-primary bg-primary-bg/20 shadow-xs" : "hover:border-border-hover"}`}>
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} onClick={(e) => e.stopPropagation()} className="h-4 w-4 accent-primary rounded cursor-pointer" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-text-muted">{p.code}</span>
                    <span className="text-xs font-bold text-text truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted">
                    {p.category && <span>{p.category}</span>}
                    {p.occasion_code && <span>· {p.occasion_code}</span>}
                  </div>
                </div>
                {p.price != null && (
                  <div className="text-xs font-black text-primary shrink-0">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.price)}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Published Links Section */}
      <PublishedCatalogLinks catalogLinks={catalogLinks} onRefresh={onRefresh} />

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCatalogModal
          selectedIds={selectedIds}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); setSelectedIds([]); onRefresh() }}
        />
      )}
    </div>
  )
}
