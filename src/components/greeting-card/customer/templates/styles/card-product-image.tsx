"use client"

import React from "react"

interface CardProductImageProps {
  imageUrl?: string | null
  productName: string
  isActive: boolean
  /** Tailwind class controlling the max-height, e.g. "max-h-[520px]" */
  maxHeightClass?: string
  /** Additional wrapper className */
  wrapperClass?: string
  /** Drop-shadow CSS value */
  dropShadow?: string
  onTapDetail?: (() => void) | undefined
}

/**
 * Shared product image atom for swipe card layouts.
 * Always uses object-contain to preserve product proportions.
 */
export function CardProductImage({
  imageUrl,
  productName,
  isActive,
  maxHeightClass = "max-h-[500px]",
  wrapperClass = "",
  dropShadow = "0 24px 48px rgba(0,0,0,0.55)",
  onTapDetail,
}: CardProductImageProps) {
  if (!imageUrl) {
    return (
      <div className="w-48 h-48 rounded-2xl bg-surface-muted border border-dashed border-border flex items-center justify-center text-caption opacity-50">
        Hình ảnh sản phẩm
      </div>
    )
  }

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${maxHeightClass} ${wrapperClass}`}
      onClick={onTapDetail}
      role={onTapDetail ? "button" : undefined}
      tabIndex={onTapDetail ? 0 : undefined}
      aria-label={onTapDetail ? `Xem chi tiết sản phẩm ${productName}` : undefined}
      onKeyDown={
        onTapDetail
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onTapDetail()
              }
            }
          : undefined
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={productName}
        className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.03] cursor-pointer"
        style={{ filter: `drop-shadow(${dropShadow})` }}
        loading={isActive ? "eager" : "lazy"}
        draggable={false}
      />
    </div>
  )
}
