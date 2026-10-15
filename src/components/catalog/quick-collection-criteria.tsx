"use client"

import React from "react"
import { DollarSign, Sparkles, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { GREETING_TEMPLATE_LIST } from "@/modules/greeting-card/domain/greeting-template-registry"
import { COMMON_CATEGORIES, COMMON_COLORS, COMMON_FLOWERS, COMMON_OCCASIONS } from "./quick-collection-options"
import { usePriceBudgets } from "./use-price-budgets"

export interface QuickCollectionCriteriaState {
  customerName: string
  customerPhone: string
  occasion: string
  category: string
  flowerType: string
  colorTone: string
  selectedBudgetIds: string[]
  priceMin: number | undefined
  priceMax: number | undefined
  productLimit: number
  templateId: string
}

/** Bảng tiêu chí của "Tạo nhanh bộ sưu tập": khách (tuỳ chọn), giá, dịp, dáng, loại hoa, màu, số mẫu, giao diện. */
export function QuickCollectionCriteriaPanel({
  value,
  onChange,
}: {
  value: QuickCollectionCriteriaState
  onChange: (patch: Partial<QuickCollectionCriteriaState>) => void
}) {
  const priceBudgets = usePriceBudgets()
  const { customerName, customerPhone, occasion, category, flowerType, colorTone, selectedBudgetIds, priceMin, priceMax, productLimit, templateId } = value
  const handleToggleBudget = (id: string) =>
    onChange({ selectedBudgetIds: selectedBudgetIds.includes(id) ? selectedBudgetIds.filter((item) => item !== id) : [...selectedBudgetIds, id] })

  return (
    <>
    {/* 1. KHỐI THÔNG TIN KHÁCH (TÙY CHỌN) */}
    <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary/5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-caption font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide">
          <User size={13} />
          Khách hàng (tùy chọn)
        </div>
        <span className="text-caption text-text-muted">Lời chào gắn tên riêng</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <Input
            value={customerName}
            onChange={(e) => onChange({ customerName: e.target.value })}
            placeholder="Tên khách (vd: Chị Lan)"
            className="h-9 text-body-sm"
          />
        </div>
        <div>
          <Input
            value={customerPhone}
            onChange={(e) => onChange({ customerPhone: e.target.value })}
            placeholder="Số điện thoại"
            className="h-9 text-body-sm"
          />
        </div>
      </div>
    </div>

    {/* 2. BẢNG TIÊU CHÍ */}
    <div className="p-3.5 rounded-2xl border border-border bg-surface space-y-3.5">
      {/* Khoảng giá */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-caption font-bold text-text flex items-center gap-1.5">
            <DollarSign size={14} className="text-primary" />
            Khoảng giá (chọn nhiều khung)
          </label>
          <div className="flex items-center gap-1">
            {priceBudgets.map((qb) => {
              const isSelected = selectedBudgetIds.includes(qb.id)
              return (
                <button
                  type="button"
                  key={qb.id}
                  onClick={() => handleToggleBudget(qb.id)}
                  className={`px-2 py-0.5 rounded-full text-caption font-medium transition border ${
                    isSelected
                      ? "border-primary bg-primary text-white font-bold"
                      : "border-border bg-surface text-text-muted hover:border-primary/40"
                  }`}
                >
                  {qb.label}
                </button>
              )
            })}
            {(selectedBudgetIds.length > 0 || priceMin !== undefined || priceMax !== undefined) && (
              <button
                type="button"
                onClick={() => {
                  onChange({ selectedBudgetIds: [], priceMin: undefined, priceMax: undefined })
                }}
                className="px-1.5 py-0.5 text-caption text-text-muted hover:text-text underline"
              >
                Bỏ chọn
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Giá từ"
            value={priceMin ?? ""}
            onChange={(e) => onChange({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
            className="h-9 text-body-sm"
          />
          <Input
            type="number"
            placeholder="Đến"
            value={priceMax ?? ""}
            onChange={(e) => onChange({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
            className="h-9 text-body-sm"
          />
        </div>
      </div>

      {/* Dịp tặng */}
      <div>
        <label className="block text-caption font-bold text-text mb-1.5">
          Dịp tặng
        </label>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_OCCASIONS.map((occ) => (
            <button
              type="button"
              key={occ}
              onClick={() => onChange({ occasion: occasion === occ ? "" : occ })}
              className={`px-2.5 py-1 rounded-xl text-caption font-medium transition border ${
                occasion === occ
                  ? "border-primary bg-primary text-white font-bold shadow-xs"
                  : "border-border bg-surface text-text hover:border-primary/40"
              }`}
            >
              {occ}
            </button>
          ))}
        </div>
      </div>

      {/* Dáng hoa & Loại hoa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-caption font-bold text-text mb-1.5">
            Dáng hoa
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => onChange({ category: category === cat ? "" : cat })}
                className={`px-2 py-0.5 rounded-lg text-caption font-medium transition border ${
                  category === cat
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border bg-surface text-text hover:border-primary/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-caption font-bold text-text mb-1.5">
            Loại hoa
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_FLOWERS.map((fl) => (
              <button
                type="button"
                key={fl}
                onClick={() => onChange({ flowerType: flowerType === fl ? "" : fl })}
                className={`px-2 py-0.5 rounded-lg text-caption font-medium transition border ${
                  flowerType === fl
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border bg-surface text-text hover:border-primary/40"
                }`}
              >
                {fl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tone màu & Số lượng mẫu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border">
        <div>
          <label className="block text-caption font-bold text-text mb-1.5">
            Tone màu
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_COLORS.map((col) => (
              <button
                type="button"
                key={col}
                onClick={() => onChange({ colorTone: colorTone === col ? "" : col })}
                className={`px-2 py-0.5 rounded-lg text-caption font-medium transition border ${
                  colorTone === col
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border bg-surface text-text hover:border-primary/40"
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-caption font-bold text-text">
              Số mẫu gửi khách
            </label>
            <span className="text-caption font-bold text-primary">{productLimit} mẫu</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[4, 6, 8, 10, 12].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => onChange({ productLimit: num })}
                className={`flex-1 py-1 rounded-lg text-caption font-medium transition border text-center ${
                  productLimit === num
                    ? "border-primary bg-primary text-white font-bold"
                    : "border-border bg-surface text-text hover:border-primary/40"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Giao diện Thẻ Chào Mẫu Hoa (Dropdown) */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-caption font-bold text-text flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary" />
            Mẫu giao diện
          </label>
          <span className="text-caption text-text-muted">
            Vuốt 3D · {GREETING_TEMPLATE_LIST.length} mẫu
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2">
            <select
              value={templateId}
              onChange={(e) => onChange({ templateId: e.target.value })}
              className="w-full h-9 rounded-xl border border-border bg-surface px-3 text-body-sm text-text font-medium focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            >
              {GREETING_TEMPLATE_LIST.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.styleNumber ? `#${tmpl.styleNumber} · ` : ""}{tmpl.name} ({tmpl.subtitle || tmpl.tag})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center px-3 py-1.5 rounded-xl bg-surface-alt border border-border text-caption text-text-muted truncate">
            <span className="font-semibold text-text mr-1">Phong cách:</span>
            <span className="truncate">
              {GREETING_TEMPLATE_LIST.find((t) => t.id === templateId)?.tag || "Sang trọng"}
            </span>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
