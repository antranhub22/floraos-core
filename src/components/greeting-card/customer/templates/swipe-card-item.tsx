"use client"

import React from "react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import type { TemplateStyleConfig } from "./styles/template-style-configs"
import { SwipeCard } from "./swipe/swipe-card"
import { getSwipeTheme } from "./swipe/swipe-themes"

interface SwipeCardItemProps {
  product: GreetingCatalogProduct
  styleConfig: TemplateStyleConfig
  isActive: boolean
  isFavorite: boolean
  currentIndex: number
  totalCount: number
  /** Tên hiển thị góc trên thẻ (mặc định: tên kiểu) */
  brand?: string | undefined
  onTapDetail?: (() => void) | undefined
  onToggleFavorite?: (() => void) | undefined
}

/** Một thẻ tĩnh dùng cho ô xem trước mẫu (trình chọn template, modal xem trước). */
export function SwipeCardItem({ product, styleConfig, currentIndex, totalCount, brand, onTapDetail }: SwipeCardItemProps) {
  return (
    <div className="relative w-full select-none" style={{ height: 560 }}>
      <SwipeCard
        product={product}
        theme={getSwipeTheme(styleConfig.styleNumber)}
        brand={brand ?? "Bộ sưu tập của tiệm"}
        index={currentIndex}
        total={totalCount}
        onInfo={onTapDetail}
      />
    </div>
  )
}
