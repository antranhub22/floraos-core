"use client"

import React, { useState, useEffect, useMemo } from "react"
import { X, Heart, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { useSwipeGesture } from "./use-swipe-gesture"
import { SwipeCardItem } from "./swipe-card-item"
import { getTemplateStyleConfig } from "./styles/template-style-configs"
import { EnterpriseSpecSheet } from "./enterprise-spec-sheet"

interface SwipeBrochureEngineProps {
  products: GreetingCatalogProduct[]
  catalogName: string
  selectedProductId: string | null
  onSelectProduct: (product: GreetingCatalogProduct) => void
  styleKey?: string
}

export function SwipeBrochureEngine({
  products,
  catalogName,
  selectedProductId,
  onSelectProduct,
  styleKey = "01",
}: SwipeBrochureEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [inspectProduct, setInspectProduct] = useState<GreetingCatalogProduct | null>(null)

  const styleConfig = useMemo(() => getTemplateStyleConfig(styleKey), [styleKey])

  // Preload next 2 images
  useEffect(() => {
    if (products.length === 0) return
    const preloadIndices = [currentIndex, currentIndex + 1, currentIndex + 2]
    preloadIndices.forEach((idx) => {
      const p = products[idx]
      if (p?.imageUrl) {
        const img = new Image()
        img.src = p.imageUrl
      }
    })
  }, [currentIndex, products])

  const {
    isDragging,
    triggerNext,
    triggerPrev,
    handleTouchStart,
    handleTouchMove,
    handleDragEnd,
    handleMouseDown,
    handleMouseMove,
    transformStyle,
    transitionStyle,
    dragProgress,
  } = useSwipeGesture({
    currentIndex,
    totalItems: products.length,
    onIndexChange: setCurrentIndex,
  })

  if (!products || products.length === 0) {
    return (
      <div className="w-full max-w-sm mx-auto min-h-[500px] flex flex-col items-center justify-center p-6 text-center text-text-muted">
        <Sparkles size={40} className="text-primary mb-3" />
        <p className="text-body font-medium">Hiện chưa có mẫu hoa nào trong bộ sưu tập này.</p>
      </div>
    )
  }

  const activeProduct: GreetingCatalogProduct = products[currentIndex] ?? products[0]!
  const nextProduct = products[currentIndex + 1]
  const thirdProduct = products[currentIndex + 2]
  const isSelected = selectedProductId === activeProduct.id
  const isFavorite = favoriteIds.has(activeProduct.id)

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleFavoriteAction = () => {
    toggleFavorite(activeProduct.id)
    if (currentIndex < products.length - 1) {
      setTimeout(() => triggerNext(), 150)
    }
  }

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col items-center px-3 py-2">
      {/* 3-Layer Card Stack Canvas */}
      <div
        className="relative w-full h-[650px] max-h-[82vh] flex items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Layer 3 (Bottom) */}
        {thirdProduct && (
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-300"
            style={{
              transform: `scale(${0.92 + dragProgress * 0.04}) translateY(${24 - dragProgress * 12}px)`,
              opacity: 0.25 + dragProgress * 0.15,
              zIndex: 1,
            }}
          >
            <SwipeCardItem
              product={thirdProduct}
              styleConfig={styleConfig}
              isActive={false}
              isFavorite={favoriteIds.has(thirdProduct.id)}
              currentIndex={currentIndex + 2}
              totalCount={products.length}
            />
          </div>
        )}

        {/* Layer 2 (Middle) */}
        {nextProduct && (
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-300"
            style={{
              transform: `scale(${0.96 + dragProgress * 0.04}) translateY(${12 - dragProgress * 12}px)`,
              opacity: 0.6 + dragProgress * 0.35,
              zIndex: 2,
            }}
          >
            <SwipeCardItem
              product={nextProduct}
              styleConfig={styleConfig}
              isActive={false}
              isFavorite={favoriteIds.has(nextProduct.id)}
              currentIndex={currentIndex + 1}
              totalCount={products.length}
            />
          </div>
        )}

        {/* Layer 1 (Active Top Card with Drag Follow & Rotation Clamp ±7deg) */}
        <div
          className="absolute inset-0 z-10"
          style={{
            transform: transformStyle,
            transition: isDragging ? "none" : transitionStyle,
          }}
        >
          <SwipeCardItem
            product={activeProduct}
            styleConfig={styleConfig}
            isActive={true}
            isFavorite={isFavorite}
            currentIndex={currentIndex}
            totalCount={products.length}
            onTapDetail={() => setInspectProduct(activeProduct)}
            onToggleFavorite={() => toggleFavorite(activeProduct.id)}
          />
        </div>
      </div>

      {/* Floating Action Controls Bar (X, Heart, Next) */}
      <div className="w-full mt-4 flex items-center justify-center gap-6 z-20">
        {/* Reject / Skip Button */}
        <button
          type="button"
          aria-label="Bỏ qua mẫu này (Lướt sang trái)"
          onClick={triggerPrev}
          disabled={currentIndex === 0}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${styleConfig.controlsTheme.rejectBtnClass}`}
          title="Mẫu trước"
        >
          <X size={20} />
        </button>

        {/* Favorite / Heart Button */}
        <button
          type="button"
          aria-label="Thích mẫu này"
          onClick={handleFavoriteAction}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${styleConfig.controlsTheme.favBtnClass}`}
          title="Thả tim mẫu này"
        >
          <Heart size={24} className={isFavorite ? "fill-current text-white" : ""} />
        </button>

        {/* Next Button */}
        <button
          type="button"
          aria-label="Mẫu tiếp theo (Lướt sang phải)"
          onClick={triggerNext}
          disabled={currentIndex >= products.length - 1}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${styleConfig.controlsTheme.nextBtnClass}`}
          title="Mẫu tiếp theo"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Invariant Universal Conversion CTA: CHỌN MẪU NÀY */}
      <div className="w-full mt-3 px-2 z-20">
        <button
          type="button"
          onClick={() => onSelectProduct(activeProduct)}
          className={`w-full py-3 px-4 rounded-2xl font-bold text-body flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md cursor-pointer ${
            isSelected
              ? "bg-success hover:bg-success/90 text-white"
              : styleConfig.controlsTheme.ctaBtnClass
          }`}
        >
          <CheckCircle2 size={18} />
          <span>
            {isSelected ? "BẠN ĐÃ CHỌN MẪU NÀY" : "CHỌN MẪU NÀY — " + activeProduct.name}
          </span>
        </button>
      </div>

      {/* Inspect Spec Sheet Modal */}
      {inspectProduct && (
        <EnterpriseSpecSheet
          product={inspectProduct}
          isOpen={true}
          onClose={() => setInspectProduct(null)}
          onSelectProduct={(p) => {
            onSelectProduct(p)
            setInspectProduct(null)
          }}
        />
      )}
    </div>
  )
}
