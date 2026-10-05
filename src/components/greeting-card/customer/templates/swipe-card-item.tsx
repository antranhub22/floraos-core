"use client"

import React from "react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import type { TemplateStyleConfig } from "./styles/template-style-configs"
import { StyleLayoutDispatcher } from "./styles/style-layout-dispatcher"

interface SwipeCardItemProps {
  product: GreetingCatalogProduct
  styleConfig: TemplateStyleConfig
  isActive: boolean
  isFavorite: boolean
  currentIndex: number
  totalCount: number
  onTapDetail?: (() => void) | undefined
  onToggleFavorite?: (() => void) | undefined
}

/**
 * SwipeCardItem — outer shell providing the card stack geometry.
 * Visual content is fully delegated to StyleLayoutDispatcher,
 * which picks the correct per-style layout component.
 *
 * Card dimensions: 360–430px width, full-height mobile editorial.
 * Shadow: 0 20px 60px rgba(0,0,0,0.16) per spec.
 */
export function SwipeCardItem({
  product,
  styleConfig,
  isActive,
  isFavorite,
  currentIndex,
  totalCount,
  onTapDetail,
  onToggleFavorite,
}: SwipeCardItemProps) {
  return (
    <div
      className="relative w-full select-none overflow-hidden"
      style={{
        height: "clamp(560px, 82vh, 700px)",
        borderRadius: 32,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)",
        touchAction: "pan-y",
      }}
    >
      <StyleLayoutDispatcher
        product={product}
        styleConfig={styleConfig}
        isActive={isActive}
        isFavorite={isFavorite}
        currentIndex={currentIndex}
        totalCount={totalCount}
        onTapDetail={onTapDetail}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  )
}
