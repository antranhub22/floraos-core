"use client"

import React, { useState, useMemo } from "react"
import { Check, Sparkles, Heart, Filter, Eye, X, ArrowRight } from "lucide-react"
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
    <div className="w-full max-w-md mx-auto px-3 py-1 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-body font-extrabold text-foreground truncate">{catalogName}</h2>
          <p className="text-caption text-text-muted">
            Hiển thị {filteredProducts.length} / {products.length} mẫu hoa
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-caption font-bold">
          Lookbook Grid
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-xl text-caption font-bold whitespace-nowrap transition-colors ${
            filter === "all"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface border border-border text-text-muted hover:text-foreground"
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setFilter("under_500")}
          className={`px-3 py-1 rounded-xl text-caption font-bold whitespace-nowrap transition-colors ${
            filter === "under_500"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface border border-border text-text-muted hover:text-foreground"
          }`}
        >
          Dưới 500k
        </button>
        <button
          type="button"
          onClick={() => setFilter("500_1000")}
          className={`px-3 py-1 rounded-xl text-caption font-bold whitespace-nowrap transition-colors ${
            filter === "500_1000"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface border border-border text-text-muted hover:text-foreground"
          }`}
        >
          500k – 1 triệu
        </button>
        <button
          type="button"
          onClick={() => setFilter("above_1000")}
          className={`px-3 py-1 rounded-xl text-caption font-bold whitespace-nowrap transition-colors ${
            filter === "above_1000"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface border border-border text-text-muted hover:text-foreground"
          }`}
        >
          Trên 1 triệu
        </button>
      </div>

      {/* 2-Column Product Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredProducts.map((p) => {
          const isSelected = selectedProductId === p.id
          const isHearted = shortlistIds.includes(p.id)

          return (
            <div
              key={p.id}
              className={`group bg-surface rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              {/* Product Image Box */}
              <div className="relative aspect-square w-full bg-surface-muted overflow-hidden">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-caption text-text-muted">
                    Hoa tươi
                  </div>
                )}

                {/* Heart Button */}
                <button
                  type="button"
                  onClick={() => toggleHeart(p.id)}
                  aria-label="Thả tim"
                  className={`absolute top-2 right-2 w-7 h-7 rounded-full backdrop-blur-xs flex items-center justify-center transition-transform active:scale-90 ${
                    isHearted
                      ? "bg-danger text-white shadow-sm"
                      : "bg-black/40 text-white hover:bg-black/60"
                  }`}
                >
                  <Heart size={13} className={isHearted ? "fill-current" : ""} />
                </button>

                {/* Quick inspect button */}
                <button
                  type="button"
                  onClick={() => setPreviewProduct(p)}
                  aria-label="Xem chi tiết"
                  className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-xs text-white text-caption font-bold flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity"
                >
                  <Eye size={11} />
                  <span>Chi tiết</span>
                </button>
              </div>

              {/* Info & Action */}
              <div className="p-2.5 flex flex-col flex-1 justify-between gap-2">
                <div>
                  <h3 className="text-caption font-bold text-foreground line-clamp-1">{p.name}</h3>
                  <p className="text-body-sm font-extrabold text-primary mt-0.5">
                    {p.price.toLocaleString("vi-VN")} đ
                  </p>
                  <span className="text-caption text-text-muted">Mã: {p.code}</span>
                </div>

                <Button
                  type="button"
                  variant={isSelected ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => onSelectProduct(p)}
                  className="w-full h-8 text-caption font-extrabold rounded-xl shadow-xs bg-primary hover:bg-primary-dark text-white cursor-pointer"
                >
                  <Check size={13} />
                  <span>{isSelected ? "ĐÃ CHỌN" : "CHỌN MẪU"}</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick View Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-surface rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Image */}
            <div className="relative aspect-square w-full bg-surface-muted">
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
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-body font-extrabold text-foreground">{previewProduct.name}</h3>
                  <span className="text-body font-extrabold text-primary whitespace-nowrap">
                    {previewProduct.price.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                {previewProduct.description && (
                  <p className="text-caption text-text-muted mt-1">{previewProduct.description}</p>
                )}
                <span className="text-caption text-text-muted mt-0.5 inline-block">
                  Mã sản phẩm: {previewProduct.code}
                </span>
              </div>

              {/* View spec sheet link */}
              <button
                type="button"
                onClick={() => {
                  setSpecProduct(previewProduct)
                  setPreviewProduct(null)
                }}
                className="text-caption font-bold text-primary hover:underline text-left"
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
                className="w-full h-11 text-body-sm font-extrabold rounded-2xl bg-primary hover:bg-primary-dark text-white cursor-pointer"
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
