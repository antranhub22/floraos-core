"use client"

import React, { useState } from "react"
import { Flower2 } from "lucide-react"
import { resolveFlowerImage } from "./flower-image-fallback"

interface SmartFlowerImageProps {
  src: string | null | undefined
  alt: string
  aspectRatio?: "square" | "4/3" | "16/9" | "4/5" | "16/10"
  fallbackIndex?: number
  className?: string
  priority?: boolean
}

export function SmartFlowerImage({
  src,
  alt,
  aspectRatio = "4/3",
  fallbackIndex = 0,
  className = "",
}: SmartFlowerImageProps) {
  const initialSrc = resolveFlowerImage(src, fallbackIndex)
  const [currentSrc, setCurrentSrc] = useState(initialSrc)
  const [hasError, setHasError] = useState(false)

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "16/9"
      ? "aspect-16/9"
      : aspectRatio === "4/5"
      ? "aspect-4/5"
      : aspectRatio === "16/10"
      ? "aspect-16/10"
      : "aspect-4/3"

  const handleImgError = () => {
    if (!hasError) {
      setHasError(true)
      const fallback = resolveFlowerImage(null, fallbackIndex)
      setCurrentSrc(fallback)
    }
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-surface-alt/80 flex items-center justify-center ${aspectClass} ${className}`}
    >
      {/* Background ambient blur — lấy màu hoa tạo nền dịu mắt chống trống khung */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30 scale-125 pointer-events-none transition-opacity duration-700"
        style={{ backgroundImage: `url(${currentSrc})` }}
      />

      {/* Main Flower Image — Luôn căn giữa hoàn hảo, hiển thị trọn vẹn đỉnh và gốc hoa */}
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onError={handleImgError}
        className="relative z-10 max-h-full max-w-full object-contain p-2.5 transition-transform duration-500 group-hover:scale-105 drop-shadow-sm select-none"
      />
    </div>
  )
}
