"use client"

import React, { useState } from "react"
import { Check, Sparkles, ChevronLeft, ChevronRight, ZoomIn, Ruler, Flower2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"

interface SplitCompareDeckProps {
  products: GreetingCatalogProduct[]
  catalogName: string
  selectedProductId: string | null
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

export function SplitCompareDeck({
  products,
  catalogName,
  selectedProductId,
  onSelectProduct,
}: SplitCompareDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
        <Sparkles size={40} className="text-primary mb-3" />
        <p className="text-body font-medium">Hiện chưa có mẫu hoa trong bộ sưu tập này.</p>
      </div>
    )
  }

  const currentProduct = products[currentIndex]
  if (!currentProduct) return null

  const isSelected = selectedProductId === currentProduct.id

  return (
    <div className="w-full max-w-md mx-auto px-3 py-2 pb-24 select-none">
      {/* Catalog Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-body font-extrabold text-foreground truncate">{catalogName}</h2>
          <span className="text-caption text-text-muted">Mẫu {currentIndex + 1} / {products.length}</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-caption font-bold">
          Split Lens Focus
        </span>
      </div>

      {/* Top Split: Detailed Zoom Visual Frame */}
      <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden border border-border shadow-lg bg-surface-muted mb-3">
        {currentProduct.imageUrl ? (
          <button
            type="button"
            onClick={() => setIsZoomed((z) => !z)}
            aria-label="Phóng to hoặc thu nhỏ ảnh hoa"
            className="w-full h-full block p-0 m-0 border-0 bg-transparent cursor-pointer overflow-hidden"
          >
            <img
              src={currentProduct.imageUrl}
              alt={currentProduct.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"
              }`}
            />
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-caption text-text-muted">
            Hoa tươi nhập khẩu
          </div>
        )}

        {/* Zoom Tooltip */}
        <button
          type="button"
          onClick={() => setIsZoomed((z) => !z)}
          aria-label="Phóng to chi tiết"
          className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-caption font-bold flex items-center gap-1 shadow-md"
        >
          <ZoomIn size={12} />
          <span>{isZoomed ? "Thu nhỏ" : "Chạm phóng to"}</span>
        </button>

        {/* Navigation arrows */}
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => {
            setIsZoomed(false)
            setCurrentIndex((i) => i - 1)
          }}
          aria-label="Mẫu trước"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed hover:bg-black/70"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          disabled={currentIndex === products.length - 1}
          onClick={() => {
            setIsZoomed(false)
            setCurrentIndex((i) => i + 1)
          }}
          aria-label="Mẫu sau"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed hover:bg-black/70"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Bottom Split: Atomic Spec Sheet & Dimension Details */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-3.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-body font-extrabold text-foreground">{currentProduct.name}</h3>
              <p className="text-caption text-text-muted mt-0.5">Mã: {currentProduct.code}</p>
            </div>
            <span className="text-title font-extrabold text-primary whitespace-nowrap">
              {currentProduct.price.toLocaleString("vi-VN")} đ
            </span>
          </div>
          {currentProduct.description && (
            <p className="text-caption text-text-muted mt-2 leading-relaxed">
              {currentProduct.description}
            </p>
          )}
        </div>

        {/* Dimension & Freshness Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/70">
          <div className="p-2.5 rounded-xl bg-surface-alt/70 border border-border/80 flex items-center gap-2">
            <Ruler size={16} className="text-info shrink-0" />
            <div>
              <span className="text-caption text-text-muted block">Kích thước chuẩn</span>
              <span className="text-caption font-extrabold text-foreground">Cao ~60cm · Tán ~45cm</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-alt/70 border border-border/80 flex items-center gap-2">
            <ShieldCheck size={16} className="text-success shrink-0" />
            <div>
              <span className="text-caption text-text-muted block">Độ tươi rực rỡ</span>
              <span className="text-caption font-extrabold text-foreground">3 – 5 ngày ổn định</span>
            </div>
          </div>
        </div>

        {/* Floral composition */}
        <div className="p-3 rounded-xl bg-surface-muted border border-border/60 flex items-start gap-2.5">
          <Flower2 size={16} className="text-primary shrink-0 mt-0.5" />
          <div className="text-caption text-text-muted leading-relaxed">
            <span className="font-bold text-foreground">Cấu phần tuyển chọn: </span>
            {currentProduct.flowersSummary || "Hoa tươi loại 1 kết hợp lá đệm nhập khẩu và giấy gói cao cấp phong cách hiện đại."}
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
          <span>{isSelected ? "ĐÃ CHỌN MẪU NÀY" : `CHỌN MẪU NÀY · ${currentProduct.price.toLocaleString("vi-VN")} đ`}</span>
        </Button>
      </div>
    </div>
  )
}
