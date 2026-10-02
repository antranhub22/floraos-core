"use client"

import React from "react"
import { MessageCircle, Flower2, Sparkles } from "lucide-react"
import type { CatalogProduct } from "../catalog-management-tab"
import { resolveFlowerImage } from "../flower-image-fallback"
import { SmartFlowerImage } from "../smart-flower-image"

interface LandingTemplateProductsProps {
  products: CatalogProduct[]
  archetypeId: string
}

function formatVnd(amount: number | null | undefined): string {
  if (amount == null) return "Liên hệ báo giá"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
}

export function LandingTemplateProducts({
  products,
  archetypeId,
}: LandingTemplateProductsProps) {
  const isLuxury = archetypeId === "minimal-luxury"
  const isRomantic = archetypeId === "pastel-romantic"
  const isFestive = archetypeId === "festive-sale"

  // Card theme styling
  const cardBorder = isLuxury
    ? "border-primary/30 hover:border-primary bg-surface"
    : isRomantic
    ? "border-primary/20 hover:border-primary bg-surface"
    : isFestive
    ? "border-danger/30 hover:border-danger bg-surface"
    : "border-border hover:border-primary bg-surface"

  const priceColor = isLuxury
    ? "text-primary"
    : isRomantic
    ? "text-primary"
    : isFestive
    ? "text-danger"
    : "text-text"

  const ctaBtnStyle = isLuxury
    ? "bg-text text-accent hover:bg-black"
    : isRomantic
    ? "bg-primary text-white hover:bg-primary-dark"
    : isFestive
    ? "bg-danger text-white hover:bg-danger-dark"
    : "bg-primary text-white hover:bg-primary-dark"

  if (products.length === 0) {
    return (
      <div className="p-8 text-center bg-surface rounded-2xl border border-border text-xs text-text-muted">
        Chưa có sản phẩm nào được chọn cho chiến dịch này.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider">
          <Sparkles size={14} className={isRomantic ? "text-primary" : "text-warning"} />
          <span>Danh Sách Thiết Kế Tuyển Chọn ({products.length})</span>
        </div>
        <span className="text-caption text-text-muted font-medium">Bảo đảm hoa tươi giống mẫu 95%+</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {products.map((p, idx) => (
          <div
            key={p.id}
            className={`group rounded-2xl overflow-hidden border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${cardBorder}`}
          >
            {/* Image Box — Căn giữa dáng hoa toàn diện */}
            <div className="relative w-full overflow-hidden">
              <SmartFlowerImage
                src={p.imageUrl}
                alt={p.name}
                aspectRatio="4/3"
                fallbackIndex={idx}
              />

              {/* Badges */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-caption font-mono font-bold tracking-wide">
                {p.code}
              </div>

              {idx === 0 && (
                <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-primary text-white text-caption font-black uppercase tracking-wider shadow-xs animate-pulse">
                  Bán chạy #1
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-sm font-extrabold text-text line-clamp-1 group-hover:text-primary transition-colors">
                  {p.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-caption text-text-muted">
                  {p.category && <span className="font-medium">{p.category}</span>}
                  {p.occasion_code && <span>· Dịp: {p.occasion_code}</span>}
                </div>
              </div>

              {/* Price & CTA Action */}
              <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                <div>
                  <div className="text-caption uppercase font-bold text-text-muted">Giá ưu đãi</div>
                  <div className={`text-sm font-black ${priceColor}`}>
                    {formatVnd(p.price)}
                  </div>
                </div>

                <a
                  href={`https://zalo.me?text=${encodeURIComponent(`Xin chào, tôi muốn đặt mẫu hoa ${p.name} (${p.code}) trong chiến dịch!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${ctaBtnStyle}`}
                >
                  <MessageCircle size={13} />
                  <span>Đặt Zalo</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
