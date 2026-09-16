"use client"

import React from "react"
import { MessageCircle, Flower2, Sparkles } from "lucide-react"
import type { CatalogProduct } from "../catalog-management-tab"

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
    ? "border-amber-900/30 hover:border-amber-600 bg-white"
    : isRomantic
    ? "border-rose-200 hover:border-rose-400 bg-white"
    : isFestive
    ? "border-red-200 hover:border-red-500 bg-white"
    : "border-slate-200 hover:border-slate-400 bg-white"

  const priceColor = isLuxury
    ? "text-amber-700"
    : isRomantic
    ? "text-rose-600"
    : isFestive
    ? "text-red-600"
    : "text-slate-900"

  const ctaBtnStyle = isLuxury
    ? "bg-slate-900 text-amber-300 hover:bg-black"
    : isRomantic
    ? "bg-rose-600 text-white hover:bg-rose-700"
    : isFestive
    ? "bg-red-600 text-white hover:bg-red-700"
    : "bg-slate-800 text-white hover:bg-slate-900"

  if (products.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
        Chưa có sản phẩm nào được chọn cho chiến dịch này.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Sparkles size={14} className={isRomantic ? "text-rose-500" : "text-amber-500"} />
          <span>Danh Sách Thiết Kế Tuyển Chọn ({products.length})</span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Bảo đảm hoa tươi giống mẫu 95%+</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {products.map((p, idx) => (
          <div
            key={p.id}
            className={`group rounded-2xl overflow-hidden border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${cardBorder}`}
          >
            {/* Image Box */}
            <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                  <Flower2 size={40} strokeWidth={1.5} />
                  <span className="text-[11px] font-medium mt-1">Ảnh thực tế</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono font-bold tracking-wide">
                {p.code}
              </div>

              {idx === 0 && (
                <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10.5px] font-black uppercase tracking-wider shadow-xs animate-pulse">
                  Bán chạy #1
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
                  {p.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  {p.category && <span className="font-medium">{p.category}</span>}
                  {p.occasion_code && <span>· Dịp: {p.occasion_code}</span>}
                </div>
              </div>

              {/* Price & CTA Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Giá ưu đãi</div>
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
