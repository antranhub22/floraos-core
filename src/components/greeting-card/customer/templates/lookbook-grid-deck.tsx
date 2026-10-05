"use client"

import React, { useState, useMemo } from "react"
import { Check, Sparkles, Heart, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { EnterpriseSpecSheet } from "./enterprise-spec-sheet"

interface LookbookGridDeckProps {
  products: GreetingCatalogProduct[]
  catalogName: string
  selectedProductId: string | null
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

type PriceFilter = "all" | "under_500" | "500_1000" | "above_1000"

export function LookbookGridDeck({
  products,
  catalogName,
  selectedProductId,
  onSelectProduct,
}: LookbookGridDeckProps) {
  const [filter, setFilter] = useState<PriceFilter>("all")
  const [previewProduct, setPreviewProduct] = useState<GreetingCatalogProduct | null>(null)
  const [specProduct, setSpecProduct] = useState<GreetingCatalogProduct | null>(null)
  const [shortlistIds, setShortlistIds] = useState<string[]>([])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filter === "under_500") return p.price < 500000
      if (filter === "500_1000") return p.price >= 500000 && p.price <= 1000000
      if (filter === "above_1000") return p.price > 1000000
      return true
    })
  }, [products, filter])

  function toggleHeart(id: string) {
    setShortlistIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
        <Sparkles size={40} className="text-primary mb-3" />
        <p className="text-body font-medium">Hiện chưa có mẫu hoa nào trong bộ sưu tập này.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-3 py-1 pb-20 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="font-serif text-title sm:text-display font-medium text-foreground truncate">{catalogName}</h2>
          <p className="text-caption text-text-muted">
            Bộ sưu tập {filteredProducts.length} / {products.length} tác phẩm
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-caption font-bold border border-primary/20">
          Lookbook Grid
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-none">
        {[
          { id: "all", label: "Tất cả mẫu" },
          { id: "under_500", label: "Dưới 500k" },
          { id: "500_1000", label: "500k – 1 triệu" },
          { id: "above_1000", label: "Trên 1 triệu" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as PriceFilter)}
            className={`px-3 py-1.5 rounded-full text-caption font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filter === tab.id
                ? "bg-primary text-white shadow-xs"
                : "bg-surface border border-border text-text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2-Column Product Grid with 3:4 Editorial Portrait Proportions */}
      <div className="grid grid-cols-2 gap-3.5">
        {filteredProducts.map((p) => {
          const isSelected = selectedProductId === p.id
          const isHearted = shortlistIds.includes(p.id)

          return (
            <div
              key={p.id}
              className={`group bg-surface rounded-[24px] border overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-lg ${
                isSelected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border shadow-xs"
              }`}
            >
              {/* Product 3:4 Lookbook Image Frame */}
              <div className="relative aspect-[3/4] w-full bg-surface-muted overflow-hidden">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-caption text-text-muted">
                    Hoa tươi
                  </div>
                )}

                {/* Subtle Bottom Ambient Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                {/* Heart Button */}
                <button
                  type="button"
                  onClick={() => toggleHeart(p.id)}
                  aria-label="Thả tim yêu thích"
                  className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-sm ${
                    isHearted
                      ? "bg-danger text-white shadow-danger/30"
                      : "bg-black/40 text-white hover:bg-black/60 border border-white/20"
                  }`}
                >
                  <Heart size={14} className={isHearted ? "fill-current" : ""} />
                </button>

                {/* Quick inspect button */}
                <button
                  type="button"
                  onClick={() => setPreviewProduct(p)}
                  aria-label="Xem chi tiết"
                  className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-caption font-semibold flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity border border-white/20 shadow-xs cursor-pointer"
                >
                  <Eye size={12} />
                  <span>Chi tiết</span>
                </button>
              </div>

              {/* Info & Action */}
              <div className="p-3 flex flex-col flex-1 justify-between gap-2.5 bg-surface">
                <div>
                  <h3 className="font-serif text-body font-medium text-foreground line-clamp-1 leading-snug">
                    {p.name}
                  </h3>
                  <p className="font-serif text-title-sm font-semibold text-primary mt-1">
                    {p.price > 0 ? `${p.price.toLocaleString("vi-VN")} đ` : "Liên hệ"}
                  </p>
                  <span className="text-caption text-text-muted">Mã: {p.code}</span>
                </div>

                <Button
                  type="button"
                  variant={isSelected ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => onSelectProduct(p)}
                  className="w-full h-8.5 text-caption font-bold rounded-xl shadow-xs bg-primary hover:bg-primary-dark text-white cursor-pointer active:scale-98 transition-transform"
                >
                  <Check size={14} />
                  <span>{isSelected ? "ĐÃ CHỌN" : "CHỌN MẪU"}</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick View Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-surface rounded-[32px] border border-border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Image */}
            <div className="relative aspect-[4/3] w-full bg-surface-muted overflow-hidden">
              {previewProduct.imageUrl ? (
                <img
                  src={previewProduct.imageUrl}
                  alt={previewProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  Hoa tươi
                </div>
              )}
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                aria-label="Đóng"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer border border-white/20"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 flex flex-col gap-3.5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif text-title sm:text-display font-medium text-foreground">{previewProduct.name}</h3>
                  <span className="font-serif text-title sm:text-display font-semibold text-primary whitespace-nowrap">
                    {previewProduct.price.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                {previewProduct.description && (
                  <p className="text-caption text-text-muted mt-1 leading-relaxed">{previewProduct.description}</p>
                )}
                <span className="text-caption text-text-muted mt-0.5 inline-block">
                  Mã tác phẩm: {previewProduct.code}
                </span>
              </div>

              {/* View spec sheet link */}
              <button
                type="button"
                onClick={() => {
                  setSpecProduct(previewProduct)
                  setPreviewProduct(null)
                }}
                className="text-caption font-bold text-primary hover:underline text-left cursor-pointer"
              >
                + Xem chi tiết thành phần hoa & cam kết chất lượng
              </button>

              {/* Strictly "CHỌN MẪU NÀY" */}
              <Button
                type="button"
                variant="primary"
                size="default"
                onClick={() => {
                  const target = previewProduct
                  setPreviewProduct(null)
                  onSelectProduct(target)
                }}
                className="w-full h-11 text-body-sm font-bold rounded-2xl bg-primary hover:bg-primary-dark text-white cursor-pointer active:scale-98 transition-transform"
              >
                <Check size={16} />
                <span>CHỌN MẪU NÀY · {previewProduct.price.toLocaleString("vi-VN")} đ</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Spec Sheet if opened */}
      {specProduct && (
        <EnterpriseSpecSheet
          product={specProduct}
          isOpen={true}
          onClose={() => setSpecProduct(null)}
          onSelectProduct={(p) => {
            setSpecProduct(null)
            onSelectProduct(p)
          }}
        />
      )}
    </div>
  )
}
