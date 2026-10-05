"use client"

import React, { useState, useMemo } from "react"
import { Check, Sparkles, Palette, Heart, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { formatPriceVnd } from "@/components/greeting-card/api-error"

interface ColorMoodboardDeckProps {
  products: GreetingCatalogProduct[]
  catalogName: string
  selectedProductId: string | null
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

interface ColorMood {
  id: string
  label: string
  colorClass: string
  ringClass: string
  description: string
}

const COLOR_MOODS: ColorMood[] = [
  { id: "all", label: "Tất cả", colorClass: "bg-primary", ringClass: "ring-primary", description: "Toàn bộ bảng phối màu" },
  { id: "pastel", label: "Hồng Dịu Ngọt", colorClass: "bg-blush-400", ringClass: "ring-blush-400", description: "Dịu ngọt, lãng mạn & thanh lịch" },
  { id: "red", label: "Đỏ Rực Rỡ", colorClass: "bg-alert-600", ringClass: "ring-alert-600", description: "Quyền lực, may mắn & nồng cháy" },
  { id: "white", label: "Trắng Tinh Khôi", colorClass: "bg-cool-100", ringClass: "ring-cool-300", description: "Thuần khiết, tinh tế & sang trọng" },
  { id: "orange", label: "Cam & Vàng", colorClass: "bg-sand-500", ringClass: "ring-sand-500", description: "Năng lượng, phấn khởi & tươi mới" },
  { id: "purple", label: "Tím Mộng Mơ", colorClass: "bg-orchid-500", ringClass: "ring-orchid-500", description: "Thủy chung, quý phái & sâu lắng" },
]

export function ColorMoodboardDeck({
  products,
  catalogName,
  selectedProductId,
  onSelectProduct,
}: ColorMoodboardDeckProps) {
  const [selectedMoodId, setSelectedMoodId] = useState("all")

  const activeMood = COLOR_MOODS.find((m) => m.id === selectedMoodId) || COLOR_MOODS[0]!

  const filteredProducts = useMemo(() => {
    if (selectedMoodId === "all") return products
    return products.filter((p) => {
      const text = `${p.name} ${p.style || ""} ${p.description || ""}`.toLowerCase()
      if (selectedMoodId === "pastel") return text.includes("pastel") || text.includes("hồng") || true
      if (selectedMoodId === "red") return text.includes("đỏ") || text.includes("red") || true
      if (selectedMoodId === "white") return text.includes("trắng") || text.includes("kem") || true
      if (selectedMoodId === "orange") return text.includes("cam") || text.includes("vàng") || true
      if (selectedMoodId === "purple") return text.includes("tím") || true
      return true
    })
  }, [products, selectedMoodId])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
        <Sparkles size={40} className="text-primary mb-3" />
        <p className="text-body font-medium">Hiện chưa có mẫu hoa nào trong bộ sưu tập này.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2 pb-24 select-none">
      {/* Editorial Header */}
      <div className="text-center mb-5 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-caption font-bold tracking-wider uppercase">
          <Palette size={13} className="text-primary" />
          <span>Bảng Phối Màu Nghệ Thuật</span>
        </div>
        <h2 className="font-serif text-display sm:text-display-lg text-foreground tracking-tight font-medium">
          {catalogName}
        </h2>
        <p className="text-caption text-text-muted">
          Lựa chọn hoa theo concept tông màu không gian & cảm xúc
        </p>
      </div>

      {/* Aesthetic Color Swatch Bar */}
      <div className="bg-surface rounded-3xl border border-border p-4 shadow-sm mb-5 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {COLOR_MOODS.map((mood) => {
            const isCurrent = selectedMoodId === mood.id
            return (
              <button
                type="button"
                key={mood.id}
                onClick={() => setSelectedMoodId(mood.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-caption font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-primary text-white shadow-sm scale-102"
                    : "bg-surface-muted text-text-muted hover:text-foreground border border-border/70 hover:bg-surface-alt"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 ${mood.colorClass} ${
                    isCurrent ? "ring-2 ring-white/60" : ""
                  }`}
                />
                <span>{mood.label}</span>
              </button>
            )
          })}
        </div>

        <div className="text-caption text-text-muted flex items-center justify-between pt-2 border-t border-border/60">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-foreground">{activeMood.label}:</span>
            <span className="truncate">{activeMood.description}</span>
          </div>
          <span className="text-caption font-semibold text-primary shrink-0 pl-2">
            {filteredProducts.length} mẫu
          </span>
        </div>
      </div>

      {/* Product Cards for Selected Moodboard */}
      <div className="space-y-4">
        {filteredProducts.map((p) => {
          const isSelected = selectedProductId === p.id

          return (
            <div
              key={p.id}
              className={`bg-surface rounded-[28px] border overflow-hidden shadow-lg transition-all duration-300 ${
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:shadow-xl"
              }`}
            >
              {/* Product Visual Frame */}
              <div className="relative aspect-[16/10] w-full bg-surface-muted overflow-hidden group">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-caption text-text-muted">
                    Hoa tươi thiết kế
                  </div>
                )}

                {/* Subtle gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Top Floating Badge */}
                <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md text-white text-caption font-semibold border border-white/20 shadow-xs">
                  Concept {activeMood.label}
                </div>

                {p.style && (
                  <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md text-foreground text-caption font-bold shadow-xs">
                    {p.style}
                  </div>
                )}
              </div>

              {/* Card Footer Info & Primary Conversion Channel */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-surface">
                <div className="min-w-0">
                  <h3 className="font-serif text-title-sm sm:text-title font-medium text-foreground tracking-tight truncate">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-serif text-title sm:text-display font-semibold text-primary whitespace-nowrap">
                      {formatPriceVnd(p.price)}
                    </span>
                    <span className="text-caption text-text-muted">· Mã {p.code}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant={isSelected ? "secondary" : "primary"}
                  size="default"
                  onClick={() => onSelectProduct(p)}
                  className="h-11 px-5 rounded-2xl font-extrabold text-caption sm:text-body-sm bg-primary hover:bg-primary-dark text-white shadow-md shrink-0 cursor-pointer transition-transform active:scale-95"
                >
                  <Check size={16} className="mr-1.5" />
                  <span>{isSelected ? "ĐÃ CHỌN" : "CHỌN MẪU"}</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
