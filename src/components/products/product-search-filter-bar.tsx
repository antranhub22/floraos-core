"use client"

import React, { useState } from "react"
import {
  Search,
  X,
  LayoutGrid,
  LayoutList,
  Sparkles,
  ArrowUpDown,
  CircleDollarSign,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react"
import {
  OCCASIONS,
  PRICE_RANGES,
  SORT_OPTIONS,
  type OccasionId,
  type PriceRangeId,
  type ProductFilterState,
  type SortOptionId,
} from "./product-filter-types"

export interface ProductSearchFilterBarProps {
  filters: ProductFilterState
  onChange: (updater: (prev: ProductFilterState) => ProductFilterState) => void
  onReset: () => void
  viewMode: "grid" | "table"
  onViewModeChange: (mode: "grid" | "table") => void
  totalCount: number
  availableCategories?: string[]
}

const DEFAULT_CATEGORIES = [
  "Tất cả",
  "Bó hoa",
  "Giỏ hoa",
  "Kệ khai trương",
  "Hoa chia buồn",
  "Hộp hoa",
  "Bình hoa",
]

export function ProductSearchFilterBar({
  filters,
  onChange,
  onReset,
  viewMode,
  onViewModeChange,
  totalCount,
  availableCategories = DEFAULT_CATEGORIES,
}: ProductSearchFilterBarProps) {
  const [showCustomPrice, setShowCustomPrice] = useState(filters.priceRange === "custom")

  const activeOccasionDef = OCCASIONS.find((o) => o.id === filters.occasion)
  const activePriceDef = PRICE_RANGES.find((p) => p.id === filters.priceRange)

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.category !== "Tất cả" ||
    filters.occasion !== "all" ||
    filters.priceRange !== "all" ||
    filters.sortBy !== "default"

  const handlePriceChange = (id: PriceRangeId) => {
    if (id === "custom") {
      setShowCustomPrice(true)
      onChange((prev) => ({ ...prev, priceRange: "custom" }))
    } else {
      setShowCustomPrice(false)
      onChange((prev) => ({
        ...prev,
        priceRange: id,
        customMinPrice: null,
        customMaxPrice: null,
      }))
    }
  }

  return (
    <div className="flex flex-shrink-0 flex-col gap-3 border-b border-border bg-surface px-4 py-3">
      {/* Hàng 1: Ô tìm kiếm + Toggle Grid/Table */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            strokeWidth={1.8}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => {
              const val = e.target.value
              onChange((prev) => ({ ...prev, search: val }))
            }}
            placeholder="Tìm theo tên mẫu, mã SKU, loài hoa hoặc dịp tặng..."
            aria-label="Tìm kiếm sản phẩm"
            className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-9 text-body-sm text-text outline-none transition-colors focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, search: "" }))}
              aria-label="Xóa nội dung tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-0.5 rounded-md"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Toggle Grid / Bảng */}
        <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-label="Xem dạng lưới"
            aria-pressed={viewMode === "grid"}
            className={`flex h-10 w-10 items-center justify-center transition-colors ${
              viewMode === "grid"
                ? "bg-primary text-white"
                : "bg-surface text-text-muted hover:bg-surface-alt"
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            aria-label="Xem dạng bảng"
            aria-pressed={viewMode === "table"}
            className={`flex h-10 w-10 items-center justify-center border-l border-border transition-colors ${
              viewMode === "table"
                ? "bg-primary text-white"
                : "bg-surface text-text-muted hover:bg-surface-alt"
            }`}
          >
            <LayoutList size={16} />
          </button>
        </div>
      </div>

      {/* Hàng 2: Bộ lọc nhanh Danh mục (Category Chips) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none" role="group" aria-label="Lọc theo danh mục">
        {availableCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, category: cat }))}
            aria-pressed={filters.category === cat}
            className={`flex-shrink-0 rounded-full border px-3.5 py-1 text-caption font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
              filters.category === cat
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-muted hover:border-primary/50 hover:text-text"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hàng 3: Bộ lọc chuyên sâu theo Dịp, Giá & Sắp xếp */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60">
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc theo Dịp */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-alt/70 px-2.5 py-1.5 text-body-sm">
            <Sparkles size={14} className="text-primary shrink-0" aria-hidden="true" />
            <span className="text-caption font-bold text-text-muted">Dịp:</span>
            <select
              value={filters.occasion}
              onChange={(e) => {
                const occ = e.target.value as OccasionId
                onChange((prev) => ({ ...prev, occasion: occ }))
              }}
              aria-label="Chọn dịp phù hợp"
              className="bg-transparent text-caption font-semibold text-text outline-none cursor-pointer pr-1"
            >
              {OCCASIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Khoảng giá */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-alt/70 px-2.5 py-1.5 text-body-sm">
            <CircleDollarSign size={14} className="text-primary shrink-0" aria-hidden="true" />
            <span className="text-caption font-bold text-text-muted">Giá:</span>
            <select
              value={filters.priceRange}
              onChange={(e) => handlePriceChange(e.target.value as PriceRangeId)}
              aria-label="Chọn mức giá"
              className="bg-transparent text-caption font-semibold text-text outline-none cursor-pointer pr-1"
            >
              {PRICE_RANGES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-alt/70 px-2.5 py-1.5 text-body-sm">
            <ArrowUpDown size={14} className="text-text-muted shrink-0" aria-hidden="true" />
            <span className="text-caption font-bold text-text-muted">Xếp:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => {
                const s = e.target.value as SortOptionId
                onChange((prev) => ({ ...prev, sortBy: s }))
              }}
              aria-label="Sắp xếp sản phẩm"
              className="bg-transparent text-caption font-semibold text-text outline-none cursor-pointer pr-1"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nút Đặt lại bộ lọc */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-caption font-semibold text-danger hover:underline px-2 py-1.5 rounded-lg hover:bg-danger-bg transition-colors"
              title="Khôi phục tất cả bộ lọc về mặc định"
            >
              <RotateCcw size={12} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        {/* Tổng số sản phẩm hiển thị */}
        <div className="text-caption text-text-muted">
          Tìm thấy <span className="font-extrabold text-foreground">{totalCount}</span> mẫu hoa
        </div>
      </div>

      {/* Hộp nhập khoảng giá tùy chọn nếu chọn "Tùy chọn khoảng giá" */}
      {showCustomPrice && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-surface-alt border border-border text-body-sm">
          <span className="text-caption font-bold text-text">Khoảng giá tùy chọn:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              step={50000}
              value={filters.customMinPrice ?? ""}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : null
                onChange((prev) => ({ ...prev, customMinPrice: v }))
              }}
              placeholder="Từ (VNĐ)"
              aria-label="Giá tối thiểu"
              className="h-8 w-28 rounded-lg border border-border bg-surface px-2 text-caption text-text outline-none focus:border-primary"
            />
            <span className="text-text-muted text-caption">—</span>
            <input
              type="number"
              min={0}
              step={50000}
              value={filters.customMaxPrice ?? ""}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : null
                onChange((prev) => ({ ...prev, customMaxPrice: v }))
              }}
              placeholder="Đến (VNĐ)"
              aria-label="Giá tối đa"
              className="h-8 w-28 rounded-lg border border-border bg-surface px-2 text-caption text-text outline-none focus:border-primary"
            />
          </div>
          <span className="text-caption text-text-muted italic">
            (Ví dụ: 300000 đến 1500000)
          </span>
        </div>
      )}

      {/* Hàng 4: Active Filter Chips tóm tắt */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-caption text-text-muted flex items-center gap-1 mr-1">
            <SlidersHorizontal size={12} />
            Đang lọc:
          </span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-surface-alt border border-border px-2 py-0.5 text-caption font-medium text-text">
              Từ khoá: &quot;{filters.search}&quot;
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, search: "" }))}
                aria-label="Bỏ lọc từ khoá"
                className="text-text-muted hover:text-text"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.category !== "Tất cả" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-caption font-bold text-primary">
              {filters.category}
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, category: "Tất cả" }))}
                aria-label="Bỏ lọc danh mục"
                className="text-primary hover:text-primary-dark"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.occasion !== "all" && activeOccasionDef && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-caption font-bold text-primary">
              Dịp: {activeOccasionDef.shortLabel}
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, occasion: "all" }))}
                aria-label="Bỏ lọc dịp"
                className="text-primary hover:text-primary-dark"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.priceRange !== "all" && activePriceDef && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-caption font-bold text-primary">
              Giá: {filters.priceRange === "custom"
                ? `${(filters.customMinPrice ?? 0).toLocaleString("vi-VN")}đ - ${filters.customMaxPrice ? `${filters.customMaxPrice.toLocaleString("vi-VN")}đ` : "..."}`
                : activePriceDef.shortLabel}
              <button
                type="button"
                onClick={() => {
                  setShowCustomPrice(false)
                  onChange((prev) => ({
                    ...prev,
                    priceRange: "all",
                    customMinPrice: null,
                    customMaxPrice: null,
                  }))
                }}
                aria-label="Bỏ lọc giá"
                className="text-primary hover:text-primary-dark"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.sortBy !== "default" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-surface-alt border border-border px-2 py-0.5 text-caption font-medium text-text">
              Xếp: {SORT_OPTIONS.find((s) => s.id === filters.sortBy)?.label}
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, sortBy: "default" }))}
                aria-label="Bỏ sắp xếp"
                className="text-text-muted hover:text-text"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
