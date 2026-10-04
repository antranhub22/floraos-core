"use client"

import React, { useState } from "react"
import { Check, Sparkles, Play, Volume2, ChevronUp, ChevronDown, Heart, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"

interface VideoReelsDeckProps {
  products: GreetingCatalogProduct[]
  catalogName: string
  selectedProductId: string | null
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

export function VideoReelsDeck({
  products,
  catalogName,
  selectedProductId,
  onSelectProduct,
}: VideoReelsDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isHearted, setIsHearted] = useState<string[]>([])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
        <Sparkles size={40} className="text-primary mb-3" />
        <p className="text-body font-medium">Chưa có video hoặc mẫu hoa nào.</p>
      </div>
    )
  }

  const currentProduct = products[currentIndex]
  if (!currentProduct) return null

  const isSelected = selectedProductId === currentProduct.id
  const hearted = isHearted.includes(currentProduct.id)

  return (
    <div className="w-full max-w-sm mx-auto px-2 py-1 select-none flex flex-col items-center">
      {/* Top Reel Counter */}
      <div className="w-full flex items-center justify-between px-2 mb-2">
        <span className="text-caption font-bold text-foreground truncate max-w-[200px]">{catalogName}</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-caption font-extrabold">
          <Play size={10} className="fill-current" />
          <span>Reels {currentIndex + 1} / {products.length}</span>
        </div>
      </div>

      {/* 9:16 Vertical Video / 360 Screen Frame */}
      <div className="relative w-full aspect-[9/16] rounded-[32px] overflow-hidden shadow-2xl border border-white/20 bg-black flex flex-col justify-between">
        {/* Media (Image or Video) */}
        {currentProduct.imageUrl ? (
          <img
            src={currentProduct.imageUrl}
            alt={currentProduct.name}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ${
              isPlaying ? "scale-105" : "scale-100"
            }`}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-surface-muted flex flex-col items-center justify-center text-text-muted">
            <Play size={44} className="text-primary/40 mb-2" />
            <span className="text-caption">Đang chuẩn bị góc quay 360°</span>
          </div>
        )}

        {/* Ambient Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

        {/* Top Floating Glass Badges */}
        <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-caption font-bold">
            <ShieldCheck size={13} className="text-success" />
            <span>Góc quay 360° thực tế</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label="Tạm dừng hoặc tiếp tục"
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center pointer-events-auto hover:bg-black/70"
          >
            {isPlaying ? <Volume2 size={14} /> : <Play size={14} />}
          </button>
        </div>

        {/* Right Action Rail (Vertical TikTok/Reels Style) */}
        <div className="absolute right-3.5 bottom-32 z-20 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setIsHearted((prev) =>
                prev.includes(currentProduct.id)
                  ? prev.filter((id) => id !== currentProduct.id)
                  : [...prev, currentProduct.id]
              )
            }
            aria-label="Thả tim"
            className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
              hearted
                ? "bg-danger text-white border-danger"
                : "bg-black/50 text-white border-white/25 hover:bg-black/70"
            }`}
          >
            <Heart size={20} className={hearted ? "fill-current text-white" : ""} />
          </button>

          {/* Up arrow for prev reel */}
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
            aria-label="Video trước"
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/70"
          >
            <ChevronUp size={20} />
          </button>

          {/* Down arrow for next reel */}
          <button
            type="button"
            disabled={currentIndex === products.length - 1}
            onClick={() => setCurrentIndex((i) => i + 1)}
            aria-label="Video tiếp theo"
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/70"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Bottom Glass Card & Strictly Preserved "CHỌN MẪU NÀY" CTA */}
        <div className="relative z-10 m-3.5 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white flex flex-col gap-3 shadow-2xl">
          <div className="pr-12">
            <h2 className="text-body font-extrabold text-white line-clamp-1">{currentProduct.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-title font-extrabold text-warning">
                {currentProduct.price.toLocaleString("vi-VN")} đ
              </span>
              <span className="text-caption text-white/70">· Mã: {currentProduct.code}</span>
            </div>
            {currentProduct.description && (
              <p className="text-caption text-white/80 line-clamp-2 mt-1 leading-snug">
                {currentProduct.description}
              </p>
            )}
          </div>

          <Button
            type="button"
            variant={isSelected ? "secondary" : "primary"}
            size="default"
            onClick={() => onSelectProduct(currentProduct)}
            className="w-full h-11 rounded-xl shadow-lg font-extrabold text-body-sm bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check size={18} />
            <span>{isSelected ? "ĐÃ CHỌN MẪU NÀY" : `CHỌN MẪU NÀY · ${currentProduct.price.toLocaleString("vi-VN")} đ`}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
