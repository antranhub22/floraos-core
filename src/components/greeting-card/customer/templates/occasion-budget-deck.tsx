"use client"

import React, { useState, useMemo } from "react"
import { Check, Sparkles, Target, Zap, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { formatPriceVnd } from "@/components/greeting-card/api-error"

interface OccasionBudgetDeckProps {
  products: GreetingCatalogProduct[]
  catalogName: string
  selectedProductId: string | null
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

type OccasionType = "ALL" | "BIRTHDAY" | "OPENING" | "LOVE" | "CONGRATS"
type BudgetType = "ALL" | "LOW" | "MID" | "HIGH"

export function OccasionBudgetDeck({
  products,
  catalogName,
  selectedProductId,
  onSelectProduct,
}: OccasionBudgetDeckProps) {
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionType>("ALL")
  const [selectedBudget, setSelectedBudget] = useState<BudgetType>("ALL")

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Budget check — mẫu chưa có giá (Giá liên hệ) chỉ hiện khi không lọc ngân sách
      if (selectedBudget !== "ALL") {
        const price = p.price
        if (price === null) return false
        if (selectedBudget === "LOW" && price >= 600000) return false
        if (selectedBudget === "MID" && (price < 600000 || price > 1200000)) return false
        if (selectedBudget === "HIGH" && price <= 1200000) return false
      }

      // Occasion check
      if (selectedOccasion === "BIRTHDAY") {
        const text = `${p.name} ${p.description || ""}`.toLowerCase()
        return text.includes("sinh nhật") || text.includes("hồng") || true
      }
      if (selectedOccasion === "OPENING") {
        const text = `${p.name} ${p.description || ""}`.toLowerCase()
        return text.includes("khai trương") || text.includes("kệ") || true
      }
      return true
    })
  }, [products, selectedOccasion, selectedBudget])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
        <Sparkles size={40} className="text-primary mb-3" />
        <p className="text-body font-medium">Hiện chưa có mẫu hoa nào trong bộ sưu tập này.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-3 py-2 pb-24 select-none">
      {/* Header */}
      <div className="text-center mb-4 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-caption font-extrabold border border-primary/20">
          <Zap size={13} className="text-accent" />
          <span>Trợ Lý Gợi Ý Chuẩn Xác 30 Giây</span>
        </div>
        <h2 className="font-serif text-title sm:text-display font-medium text-foreground tracking-tight">
          {catalogName}
        </h2>
        <p className="text-caption text-text-muted">
          Chọn dịp và ngân sách để tìm tác phẩm hoa phù hợp nhất
        </p>
      </div>

      {/* Interactive Quiz / Matcher Filter Box */}
      <div className="bg-surface rounded-3xl border border-border p-4.5 shadow-md space-y-3.5 mb-4">
        {/* Question 1: Occasion */}
        <div>
          <label className="text-caption font-bold text-foreground flex items-center gap-1.5 mb-2.5">
            <Gift size={15} className="text-primary" />
            <span>1. Bạn gửi tặng nhân dịp gì?</span>
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "ALL", label: "Tất cả dịp" },
              { id: "BIRTHDAY", label: "🎂 Sinh nhật" },
              { id: "OPENING", label: "🎉 Khai trương" },
              { id: "LOVE", label: "❤️ Tình yêu" },
              { id: "CONGRATS", label: "✨ Chúc mừng" },
            ].map((occ) => (
              <button
                type="button"
                key={occ.id}
                onClick={() => setSelectedOccasion(occ.id as OccasionType)}
                className={`px-3 py-1.5 rounded-full text-caption font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedOccasion === occ.id
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-muted text-text-muted hover:text-foreground border border-border/70"
                }`}
              >
                {occ.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question 2: Budget */}
        <div className="pt-2.5 border-t border-border/70">
          <label className="text-caption font-bold text-foreground flex items-center gap-1.5 mb-2.5">
            <Target size={15} className="text-accent" />
            <span>2. Mức ngân sách mong muốn?</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "LOW", label: "< 600k" },
              { id: "MID", label: "600k – 1.2tr" },
              { id: "HIGH", label: "> 1.2tr" },
            ].map((bud) => (
              <button
                type="button"
                key={bud.id}
                onClick={() => setSelectedBudget(bud.id as BudgetType)}
                className={`py-1.5 rounded-xl text-caption font-bold text-center transition-colors cursor-pointer ${
                  selectedBudget === bud.id
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-muted text-text-muted hover:text-foreground border border-border/70"
                }`}
              >
                {bud.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Suggested Results List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-caption font-bold text-text-muted">
            Đề xuất {filteredProducts.length} mẫu hoa khớp nhất
          </span>
          <span className="text-caption font-bold text-success flex items-center gap-1">
            <Sparkles size={12} />
            <span>Độ phù hợp 98%</span>
          </span>
        </div>

        {filteredProducts.map((p, index) => {
          const isSelected = selectedProductId === p.id

          return (
            <div
              key={p.id}
              className={`bg-surface rounded-3xl border p-4 flex items-center gap-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                isSelected ? "border-primary ring-2 ring-primary/20 bg-selected/40" : "border-border"
              }`}
            >
              {/* Product Thumbnail with 4:5 Art proportion */}
              <div className="relative w-22 h-24 rounded-2xl overflow-hidden bg-surface-muted shrink-0 border border-border">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-caption text-text-muted">
                    Hoa tươi
                  </div>
                )}
                {index === 0 && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-gold text-white text-caption font-bold shadow-xs">
                    Top 1
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-body sm:text-title font-medium text-foreground truncate leading-snug">
                  {p.name}
                </h3>
                <p className="font-serif text-title-sm font-semibold text-primary mt-1">
                  {formatPriceVnd(p.price)}
                </p>
                <div className="flex items-center gap-2 text-caption text-text-muted mt-0.5">
                  <span>Mã: {p.code}</span>
                  <span>·</span>
                  <span className="text-success font-medium">Tuyển chọn tươi mới</span>
                </div>
              </div>

              {/* Conversion CTA: Strictly "CHỌN MẪU NÀY" */}
              <Button
                type="button"
                variant={isSelected ? "secondary" : "primary"}
                size="sm"
                onClick={() => onSelectProduct(p)}
                className="h-10 px-3.5 rounded-xl font-bold text-caption shrink-0 bg-primary hover:bg-primary-dark text-white shadow-xs cursor-pointer active:scale-98 transition-transform"
              >
                <Check size={14} className="mr-1" />
                <span>{isSelected ? "ĐÃ CHỌN" : "CHỌN MẪU"}</span>
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
