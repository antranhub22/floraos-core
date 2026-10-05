"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, Check, Sparkles, Heart, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPriceVnd } from "@/components/greeting-card/api-error"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"

interface BrochureSwipeDeckProps {
  products: GreetingCatalogProduct[]
  catalogName: string
  selectedProductId: string | null
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

const SWIPE_THRESHOLD = 70

export function BrochureSwipeDeck({
  products,
  catalogName,
  selectedProductId,
  onSelectProduct,
}: BrochureSwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [animatingDir, setAnimatingDir] = useState<"next" | "prev" | null>(null)

  const startXRef = useRef<number | null>(null)
  const currentProduct = products[currentIndex]
  const nextProduct = products[currentIndex + 1]
  const prevProduct = products[currentIndex - 1]

  useEffect(() => {
    if (nextProduct?.imageUrl) {
      const img = new Image()
      img.src = nextProduct.imageUrl
    }
    if (prevProduct?.imageUrl) {
      const img = new Image()
      img.src = prevProduct.imageUrl
    }
  }, [nextProduct, prevProduct])

  const triggerNext = useCallback(() => {
    if (currentIndex < products.length - 1) {
      setAnimatingDir("next")
      setTimeout(() => {
        setCurrentIndex((i) => i + 1)
        setDragX(0)
        setAnimatingDir(null)
      }, 260)
    } else {
      setDragX(0)
    }
  }, [currentIndex, products.length])

  const triggerPrev = useCallback(() => {
    if (currentIndex > 0) {
      setAnimatingDir("prev")
      setTimeout(() => {
        setCurrentIndex((i) => i - 1)
        setDragX(0)
        setAnimatingDir(null)
      }, 260)
    } else {
      setDragX(0)
    }
  }, [currentIndex])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") triggerNext()
      if (e.key === "ArrowLeft") triggerPrev()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [triggerNext, triggerPrev])

  function handleTouchStart(e: React.TouchEvent) {
    if (animatingDir) return
    startXRef.current = e.targetTouches[0]?.clientX ?? null
    setIsDragging(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging || startXRef.current === null || animatingDir) return
    const currentX = e.targetTouches[0]?.clientX ?? startXRef.current
    setDragX(currentX - startXRef.current)
  }

  function handleDragEnd() {
    if (!isDragging || animatingDir) return
    setIsDragging(false)
    startXRef.current = null
    if (dragX < -SWIPE_THRESHOLD) triggerNext()
    else if (dragX > SWIPE_THRESHOLD) triggerPrev()
    else setDragX(0)
  }

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

  let transformStyle = "translate3d(0, 0, 0) rotate(0deg)"
  let transitionStyle = "transform 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.15), opacity 0.25s ease"

  if (animatingDir === "next") {
    transformStyle = "translate3d(-130%, 20px, 0) rotate(-18deg)"
  } else if (animatingDir === "prev") {
    transformStyle = "translate3d(130%, 20px, 0) rotate(18deg)"
  } else if (isDragging) {
    transformStyle = `translate3d(${dragX}px, ${Math.abs(dragX) * 0.08}px, 0) rotate(${dragX * 0.06}deg)`
    transitionStyle = "none"
  }

  const dragProgress = Math.min(1, Math.abs(dragX) / 160)
  const stackedScale = 0.94 + dragProgress * 0.06
  const stackedOpacity = 0.5 + dragProgress * 0.4
  const stackedTranslateY = 12 - dragProgress * 12

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto select-none px-4 py-2">
      {/* Story Bar */}
      <div className="w-full flex items-center gap-1.5 mb-2.5">
        {products.map((p, idx) => (
          <div
            key={p.id}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "bg-primary" : idx < currentIndex ? "bg-primary/40" : "bg-surface-muted"
            }`}
          />
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between w-full px-1 mb-3">
        <span className="text-caption font-semibold text-text-muted truncate max-w-[200px]">
          {catalogName}
        </span>
        <span className="text-caption font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full shrink-0">
          Mẫu {currentIndex + 1} / {products.length}
        </span>
      </div>

      {/* Card Stack Deck */}
      <div className="relative w-full aspect-[3/4] max-w-sm">
        {nextProduct && (
          <div
            style={{
              transform: `scale(${stackedScale}) translateY(${stackedTranslateY}px)`,
              opacity: stackedOpacity,
              transition: isDragging ? "none" : "all 0.3s ease",
            }}
            className="absolute inset-0 rounded-3xl overflow-hidden border border-border bg-surface shadow-md pointer-events-none"
          >
            {nextProduct.imageUrl ? (
              <img
                src={nextProduct.imageUrl}
                alt={nextProduct.name}
                onError={(e) => { e.currentTarget.style.display = "none" }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-muted flex items-center justify-center">
                <Heart size={40} className="text-text-muted" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}

        {/* Top Active Card */}
        <div
          style={{ transform: transformStyle, transition: transitionStyle }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={(e) => { if (!animatingDir) { startXRef.current = e.clientX; setIsDragging(true) } }}
          onMouseMove={(e) => { if (isDragging && startXRef.current !== null && !animatingDir) setDragX(e.clientX - startXRef.current) }}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          className={`absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-border bg-surface flex flex-col justify-end ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {currentProduct.imageUrl ? (
            <img
              src={currentProduct.imageUrl}
              alt={currentProduct.name}
              draggable={false}
              onError={(e) => { e.currentTarget.style.display = "none" }}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-surface-muted flex flex-col items-center justify-center text-text-muted">
              <Heart size={48} className="text-primary/40 mb-2" />
              <span className="text-caption">Hình ảnh đang cập nhật</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

          {isDragging && dragX < -25 && (
            <div
              style={{ opacity: Math.min(1, Math.abs(dragX) / 80) }}
              className="absolute top-5 right-5 z-20 px-3 py-1.5 rounded-full bg-primary text-white text-caption font-extrabold flex items-center gap-1 shadow-lg pointer-events-none"
            >
              <span>MẪU TIẾP THEO</span>
              <ArrowRight size={14} />
            </div>
          )}

          {isDragging && dragX > 25 && (
            <div
              style={{ opacity: Math.min(1, Math.abs(dragX) / 80) }}
              className="absolute top-5 left-5 z-20 px-3 py-1.5 rounded-full bg-surface/90 text-foreground text-caption font-extrabold flex items-center gap-1 shadow-lg pointer-events-none"
            >
              <ArrowLeft size={14} />
              <span>MẪU TRƯỚC</span>
            </div>
          )}

          {isSelected && (
            <div className="absolute top-4 right-4 z-10 bg-success text-white text-caption font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
              <Check size={14} />
              <span>Bạn đã chọn mẫu này</span>
            </div>
          )}

          <div className="relative z-10 p-5 text-white flex flex-col gap-1.5 pointer-events-none">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-title font-extrabold line-clamp-1">{currentProduct.name}</h2>
              <span className="text-title font-extrabold text-warning whitespace-nowrap">
                {formatPriceVnd(currentProduct.price)}
              </span>
            </div>
            {currentProduct.description && (
              <p className="text-body-sm text-white/90 line-clamp-2">{currentProduct.description}</p>
            )}
            <div className="text-caption text-white/70 mt-1 flex items-center gap-2">
              <span>Mã: {currentProduct.code}</span>
              <span>·</span>
              <span>Vuốt màn hình để đổi mẫu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between w-full gap-3 mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentIndex === 0 || !!animatingDir}
          onClick={triggerPrev}
          className="flex-1 gap-1 text-caption h-11"
        >
          <ChevronLeft size={16} />
          <span>Mẫu trước</span>
        </Button>

        <Button
          type="button"
          variant={isSelected ? "secondary" : "primary"}
          size="sm"
          disabled={currentProduct.price === null}
          title={currentProduct.price === null ? "Mẫu này chưa có giá bán online — vui lòng liên hệ cửa hàng" : undefined}
          onClick={() => onSelectProduct(currentProduct)}
          className="flex-[2] gap-1.5 text-body-sm font-extrabold h-11 shadow-md bg-primary hover:bg-primary-dark text-white"
        >
          <Check size={18} />
          <span>
            {currentProduct.price === null ? "LIÊN HỆ BÁO GIÁ" : isSelected ? "ĐÃ CHỌN MẪU NÀY" : "CHỌN MẪU NÀY"}
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentIndex === products.length - 1 || !!animatingDir}
          onClick={triggerNext}
          className="flex-1 gap-1 text-caption h-11"
        >
          <span>Mẫu sau</span>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
