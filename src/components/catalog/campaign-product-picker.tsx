"use client"

import React from "react"
import { Layers, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CatalogProduct } from "./catalog-management-tab"

interface CampaignProductPickerProps {
  activeProducts: CatalogProduct[]
  selectedProductIds: string[]
  onToggleProduct: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onOpenQuickUpload: () => void
}

export function CampaignProductPicker({
  activeProducts,
  selectedProductIds,
  onToggleProduct,
  onSelectAll,
  onDeselectAll,
  onOpenQuickUpload,
}: CampaignProductPickerProps) {
  const isAllSelected = selectedProductIds.length === activeProducts.length && activeProducts.length > 0

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <label className="text-xs font-bold text-text flex items-center gap-1.5">
          <Layers size={14} className="text-primary" />
          <span>Tuyển chọn mẫu hoa bán ({selectedProductIds.length}/{activeProducts.length})</span>
        </label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenQuickUpload}
            className="h-7 text-caption gap-1 text-primary border-primary/30 hover:bg-primary-bg/20 font-bold"
          >
            <Camera size={13} />
            <span>📸 Tải ảnh hoa mới vào chiến dịch</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="text-caption h-7"
          >
            {isAllSelected ? "Bỏ chọn" : "Chọn tất cả"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-surface border">
        {activeProducts.map((p) => {
          const isSelected = selectedProductIds.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggleProduct(p.id)}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2 transition-colors text-left ${
                isSelected ? "border-primary bg-white font-bold" : "border-border bg-white/70"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                tabIndex={-1}
                className="h-3.5 w-3.5 accent-primary pointer-events-none"
              />
              <span className="truncate">{p.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
