"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  ChevronLeft, ChevronRight, Check, Sparkles, Heart,
  ShieldCheck, ArrowRight, ArrowLeft, Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { EnterpriseSpecSheet } from "./enterprise-spec-sheet"
import { EnterpriseShortlistDock } from "./enterprise-shortlist-dock"
import { EnterpriseFrostedCard } from "./enterprise-frosted-card"
import { useSwipeGesture } from "./use-swipe-gesture"

interface EnterpriseLuxuryDeckProps {
  products: GreetingCatalogProduct[]
  catalogName: string
  selectedProductId: string | null
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

export function EnterpriseLuxuryDeck({
  products,
  catalogName,
  selectedProductId,
  onSelectProduct,
}: EnterpriseLuxuryDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shortlistIds, setShortlistIds] = useState<string[]>([])
  const [showHeartBurst, setShowHeartBurst] = useState(false)
  const [isOpenSpecSheet, setIsOpenSpecSheet] = useState(false)
  const lastTapRef = useRef<number>(0)

  const currentProduct = products[currentIndex]
  const nextProduct = products[currentIndex + 1]
  const previewStackProduct = products[currentIndex + 2]

  const triggerHaptic = useCallback((ms = 12) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(ms)
      } catch {}
    }
  }, [])

  const gesture = useSwipeGesture({
    currentIndex,
    totalItems: products.length,
    onIndexChange: setCurrentIndex,
    onHaptic: triggerHaptic,
  })

  // Preload upcoming images
  useEffect(() => {
    if (nextProduct?.imageUrl) {
      const img = new Image()
      img.src = nextProduct.imageUrl
    }
    if (previewStackProduct?.imageUrl) {
      const img = new Image()
      img.src = previewStackProduct.imageUrl
    }
  }, [nextProduct, previewStackProduct])

  const toggleHeart = useCallback(
    (product: GreetingCatalogProduct) => {
      triggerHaptic(20)
      setShortlistIds((prev) => {
        const exists = prev.includes(product.id)
        if (exists) return prev.filter((id) => id !== product.id)
        return [...prev, product.id]
      })
    },
    [triggerHaptic]
  )

  const handleCardTap = useCallback(() => {
    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY && currentProduct) {
      setShowHeartBurst(true)
      toggleHeart(currentProduct)
      setTimeout(() => setShowHeartBurst(false), 800)
    }
    lastTapRef.current = now
  }, [currentProduct, toggleHeart])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
        <Sparkles size={40} className="text-primary mb-3" />
        <p className="text-body font-medium">Hiện chưa có mẫu hoa nào trong bộ sưu tập này.</p>
      </div>
    )
  }

  if (!currentProduct) return null
  const isSelected = selectedProductId === currentProduct.id
  const isHearted = shortlistIds.includes(currentProduct.id)

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto select-none px-4 py-1 pb-16">
      {/* Story Progress Bar */}
      <div className="w-full flex items-center gap-1.5 mb-2.5">
        {products.map((p, idx) => (
          <div
            key={p.id}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? "bg-primary shadow-xs"
                : idx < currentIndex
                ? "bg-primary/50"
                : "bg-surface-muted"
            }`}
          />
        ))}
      </div>

      {/* Catalog & Count Header */}
      <div className="flex items-center justify-between w-full px-1 mb-2.5">
        <div className="flex items-center gap-1.5 truncate max-w-[210px]">
          <span className="text-caption font-bold text-foreground truncate">{catalogName}</span>
          <span className="px-1.5 py-0.2 rounded-md bg-accent/15 text-accent text-caption font-bold shrink-0">
            PRO
          </span>
        </div>
        <span className="text-caption font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full shrink-0">
          Mẫu {currentIndex + 1} / {products.length}
        </span>
      </div>

      {/* 3-Layer Spatial Deck */}
      <div className="relative w-full aspect-[3/4] max-w-sm">
        {/* Layer 3: Preview Stack Card */}
        {previewStackProduct && (
          <div
            style={{
              transform: `scale(${gesture.layer3Scale}) translateY(${gesture.layer3TranslateY}px)`,
              opacity: 0.35 + gesture.dragProgress * 0.3,
            }}
            className="absolute inset-0 rounded-[30px] overflow-hidden border border-border/60 bg-surface shadow-md pointer-events-none transition-all duration-200"
          >
            {previewStackProduct.imageUrl ? (
              <img
                src={previewStackProduct.imageUrl}
                alt={previewStackProduct.name}
                className="w-full h-full object-cover brightness-75"
              />
            ) : (
              <div className="w-full h-full bg-surface-muted" />
            )}
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        {/* Layer 2: Next Stack Card */}
        {nextProduct && (
          <div
            style={{
              transform: `scale(${gesture.layer2Scale}) translateY(${gesture.layer2TranslateY}px)`,
              opacity: 0.72 + gesture.dragProgress * 0.28,
            }}
            className="absolute inset-0 rounded-[30px] overflow-hidden border border-border/80 bg-surface shadow-lg pointer-events-none transition-all duration-200"
          >
            {nextProduct.imageUrl ? (
              <img
                src={nextProduct.imageUrl}
                alt={nextProduct.name}
                className="w-full h-full object-cover brightness-90"
              />
            ) : (
              <div className="w-full h-full bg-surface-muted" />
            )}
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}

        {/* Layer 1: Active Interactive Card */}
        <div
          role="button"
          tabIndex={0}
          style={{ transform: gesture.transformStyle, transition: gesture.transitionStyle }}
          onTouchStart={gesture.handleTouchStart}
          onTouchMove={gesture.handleTouchMove}
          onTouchEnd={gesture.handleDragEnd}
          onClick={handleCardTap}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleCardTap()
          }}
          onMouseDown={gesture.handleMouseDown}
          onMouseMove={gesture.handleMouseMove}
          onMouseUp={gesture.handleDragEnd}
          onMouseLeave={gesture.handleDragEnd}
          className={`absolute inset-0 rounded-[30px] overflow-hidden shadow-2xl border border-white/20 bg-surface flex flex-col justify-between ${
            gesture.isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {/* Product Image */}
          {currentProduct.imageUrl ? (
            <img
              src={currentProduct.imageUrl}
              alt={currentProduct.name}
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-surface-muted flex flex-col items-center justify-center text-text-muted">
              <Sparkles size={48} className="text-primary/40 mb-2" />
              <span className="text-caption">Hình ảnh hoa đang cập nhật</span>
            </div>
          )}

          {/* Double-tap Heart Burst Animation */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in zoom-in-50 fade-in duration-300">
              <div className="w-24 h-24 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center shadow-2xl">
                <Heart size={54} className="text-danger fill-current animate-pulse" />
              </div>
            </div>
          )}

          {/* Top Floating Glass Badges */}
          <div className="relative z-10 p-3.5 flex items-start justify-between w-full pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-caption font-bold shadow-md">
              <ShieldCheck size={13} className="text-success" />
              <span>Tiệm Hoa FloraOS</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full bg-accent/85 backdrop-blur-md text-white text-caption font-extrabold flex items-center gap-1 shadow-md">
                <Star size={11} className="fill-current text-white" />
                <span>Mẫu Thiết Kế</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleHeart(currentProduct)
                }}
                aria-label="Thả tim lưu mẫu"
                className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-transform active:scale-90 pointer-events-auto shadow-md ${
                  isHearted
                    ? "bg-danger text-white border-danger shadow-danger/30"
                    : "bg-black/50 text-white border-white/25 hover:bg-black/70"
                }`}
              >
                <Heart size={16} className={isHearted ? "fill-current" : ""} />
              </button>
            </div>
          </div>

          {/* Swipe indicator badges */}
          {gesture.isDragging && gesture.dragX < -25 && (
            <div
              style={{ opacity: Math.min(1, Math.abs(gesture.dragX) / 80) }}
              className="absolute top-16 right-5 z-20 px-3 py-1.5 rounded-full bg-primary text-white text-caption font-extrabold flex items-center gap-1 shadow-lg pointer-events-none"
            >
              <span>MẪU TIẾP THEO</span>
              <ArrowRight size={14} />
            </div>
          )}
          {gesture.isDragging && gesture.dragX > 25 && (
            <div
              style={{ opacity: Math.min(1, Math.abs(gesture.dragX) / 80) }}
              className="absolute top-16 left-5 z-20 px-3 py-1.5 rounded-full bg-surface/90 text-foreground text-caption font-extrabold flex items-center gap-1 shadow-lg pointer-events-none"
            >
              <ArrowLeft size={14} />
              <span>MẪU TRƯỚC</span>
            </div>
          )}

          {/* Floating Frosted Glass Panel at Bottom */}
          <EnterpriseFrostedCard
            product={currentProduct}
            onOpenSpecSheet={() => setIsOpenSpecSheet(true)}
          />
        </div>
      </div>

      {/* Main Action Bar - Strictly "CHỌN MẪU NÀY" (Conversion Channel SSOT) */}
      <div className="flex items-center justify-between w-full gap-2.5 mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentIndex === 0 || !!gesture.animatingDir}
          onClick={gesture.triggerPrev}
          className="flex-1 gap-1 text-caption h-11 rounded-2xl"
        >
          <ChevronLeft size={16} />
          <span>Trước</span>
        </Button>

        <Button
          type="button"
          variant={isSelected ? "secondary" : "primary"}
          size="sm"
          onClick={() => {
            triggerHaptic(25)
            onSelectProduct(currentProduct)
          }}
          className="flex-[2.2] gap-1.5 text-body-sm font-extrabold h-11 rounded-2xl shadow-lg bg-primary hover:bg-primary-dark text-white cursor-pointer"
        >
          <Check size={18} />
          <span>{isSelected ? "ĐÃ CHỌN MẪU NÀY" : "CHỌN MẪU NÀY"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentIndex === products.length - 1 || !!gesture.animatingDir}
          onClick={gesture.triggerNext}
          className="flex-1 gap-1 text-caption h-11 rounded-2xl"
        >
          <span>Sau</span>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Expandable Spec Bottom Sheet */}
      <EnterpriseSpecSheet
        product={currentProduct}
        isOpen={isOpenSpecSheet}
        onClose={() => setIsOpenSpecSheet(false)}
        onSelectProduct={onSelectProduct}
      />

      {/* Shortlist & Compare Dock */}
      <EnterpriseShortlistDock
        shortlistIds={shortlistIds}
        products={products}
        onToggleShortlist={toggleHeart}
        onJumpToProduct={(p) => {
          const idx = products.findIndex((x) => x.id === p.id)
          if (idx !== -1) setCurrentIndex(idx)
        }}
        onSelectProduct={onSelectProduct}
      />
    </div>
  )
}
