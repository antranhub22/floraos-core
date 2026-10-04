"use client"

import React, { useState } from "react"
import { Check, Sparkles, ChevronLeft, ChevronRight, BookOpen, Quote, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"

interface EditorialStoryDeckProps {
  products: GreetingCatalogProduct[]
  catalogName: string
  selectedProductId: string | null
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

export function EditorialStoryDeck({
  products,
  catalogName,
  selectedProductId,
  onSelectProduct,
}: EditorialStoryDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shortlisted, setShortlisted] = useState<string[]>([])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
        <Sparkles size={40} className="text-primary mb-3" />
        <p className="text-body font-medium">Chưa có tác phẩm nào trong bộ sưu tập này.</p>
      </div>
    )
  }

  const currentProduct = products[currentIndex]
  if (!currentProduct) return null

  const isSelected = selectedProductId === currentProduct.id
  const isHearted = shortlisted.includes(currentProduct.id)

  const flowerMeaning =
    currentProduct.meaning ||
    "Mỗi cánh hoa mang theo một lời chúc bình an, tượng trưng cho tình cảm chân thành và sự trân quý sâu sắc nhất."

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2 pb-20 select-none">
      {/* Editorial Header */}
      <div className="text-center mb-4 space-y-1">
        <span className="text-caption font-bold text-accent tracking-widest uppercase">
          Tạp Chí Hoa Nghệ Thuật
        </span>
        <h2 className="text-title font-extrabold text-foreground">{catalogName}</h2>
        <div className="flex items-center justify-center gap-2 text-caption text-text-muted">
          <span>Tác phẩm số {currentIndex + 1} / {products.length}</span>
          <span>·</span>
          <span>FloraOS Atelier</span>
        </div>
      </div>

      {/* Main Editorial Card */}
      <div className="bg-surface rounded-3xl border border-border shadow-xl overflow-hidden flex flex-col">
        {/* Large 4:5 Art Image Frame */}
        <div className="relative aspect-[4/5] w-full bg-surface-muted overflow-hidden">
          {currentProduct.imageUrl ? (
            <img
              src={currentProduct.imageUrl}
              alt={currentProduct.name}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
              <BookOpen size={48} className="text-primary/30 mb-2" />
              <span className="text-caption">Hình ảnh tác phẩm đang hoàn thiện</span>
            </div>
          )}

          {/* Top Heart Badge */}
          <button
            type="button"
            onClick={() =>
              setShortlisted((prev) =>
                prev.includes(currentProduct.id)
                  ? prev.filter((id) => id !== currentProduct.id)
                  : [...prev, currentProduct.id]
              )
            }
            aria-label="Lưu tác phẩm"
            className={`absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-transform active:scale-90 shadow-md ${
              isHearted
                ? "bg-danger text-white shadow-danger/30"
                : "bg-surface/80 text-foreground hover:bg-surface"
            }`}
          >
            <Heart size={16} className={isHearted ? "fill-current" : ""} />
          </button>

          {/* Occasion / Style Pill */}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-caption font-semibold">
            {currentProduct.style || "Thiết Kế Độc Bản"}
          </div>
        </div>

        {/* Narrative & Story Section */}
        <div className="p-5 flex flex-col gap-3.5 bg-surface">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-title font-extrabold text-foreground">{currentProduct.name}</h3>
              <span className="text-title font-extrabold text-primary whitespace-nowrap">
                {currentProduct.price.toLocaleString("vi-VN")} đ
              </span>
            </div>
            <p className="text-caption text-text-muted mt-0.5">Mã số tác phẩm: {currentProduct.code}</p>
          </div>

          {/* Poetic quote */}
          <div className="p-3.5 rounded-2xl bg-surface-alt/70 border border-border/80 flex items-start gap-2.5">
            <Quote size={18} className="text-primary shrink-0 mt-0.5 rotate-180" />
            <p className="text-caption italic text-text leading-relaxed font-serif">
              {flowerMeaning}
            </p>
          </div>

          {currentProduct.description && (
            <p className="text-caption text-text-muted leading-relaxed">
              {currentProduct.description}
            </p>
          )}

          {/* Navigation thumbnails */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {products.map((p, idx) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-9 h-9 rounded-xl overflow-hidden border shrink-0 transition-all ${
                    idx === currentIndex
                      ? "border-primary ring-2 ring-primary/20 scale-105"
                      : "border-border opacity-60 hover:opacity-100"
                  }`}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-muted" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                title="Tác phẩm trước"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={currentIndex === products.length - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                title="Tác phẩm sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Strictly Preserved Primary Conversion Channel */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
        <Button
          type="button"
          variant={isSelected ? "secondary" : "primary"}
          size="default"
          onClick={() => onSelectProduct(currentProduct)}
          className="w-full h-12 rounded-2xl shadow-xl font-extrabold text-body-sm flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white cursor-pointer"
        >
          <Check size={18} />
          <span>{isSelected ? "ĐÃ CHỌN TÁC PHẨM NÀY" : `CHỌN MẪU NÀY · ${currentProduct.price.toLocaleString("vi-VN")} đ`}</span>
        </Button>
      </div>
    </div>
  )
}
