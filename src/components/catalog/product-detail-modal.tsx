"use client"

import React from "react"
import {
  Phone,
  MessageCircle,
  Tag,
  Layers,
  Check,
  Flower2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { PublicCatalogProduct, PublicCatalogShop } from "@/modules/catalog-links/use-cases/get-public-catalog"

interface ProductDetailModalProps {
  product: PublicCatalogProduct
  shop: PublicCatalogShop
  onClose: () => void
}

function formatVnd(amount: number | null) {
  if (!amount) return "Liên hệ báo giá"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
}

function getZaloUrl(product: PublicCatalogProduct, shop: PublicCatalogShop) {
  const phone = shop.phone ? shop.phone.replace(/[^0-9]/g, "") : ""
  const priceText = product.price ? formatVnd(product.price) : "chưa có giá"
  const text = encodeURIComponent(
    `Chào ${shop.name}, tôi muốn tư vấn & đặt mẫu hoa: ${product.name} (Mã: ${product.code}, Giá: ${priceText}).`
  )
  return phone ? `https://zalo.me/${phone}?text=${text}` : `https://zalo.me/?text=${text}`
}

export { formatVnd, getZaloUrl }

export function ProductDetailModal({ product, shop, onClose }: ProductDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Image */}
        <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden shrink-0">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300"><Flower2 size={64} /></div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">✕</button>
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-bold">Mã: {product.code}</div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <h3 className="text-xl font-black text-slate-900">{product.name}</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-rose-600">{formatVnd(product.price)}</span>
            <span className="text-xs text-slate-400">Đã bao gồm thuế & thiệp chúc mừng</span>
          </div>

          {product.description && (
            <p className="mt-4 text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">{product.description}</p>
          )}

          <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs">
            {product.category && (
              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center gap-2">
                <Tag size={15} className="text-rose-600" />
                <div><div className="text-[10px] text-slate-400">Danh mục</div><div className="font-bold text-slate-800">{product.category}</div></div>
              </div>
            )}
            {product.stemCount && (
              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center gap-2">
                <Layers size={15} className="text-rose-600" />
                <div><div className="text-[10px] text-slate-400">Định lượng</div><div className="font-bold text-slate-800">{product.stemCount} cành</div></div>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2"><Check size={14} className="text-emerald-600 shrink-0" />Cam kết hoa tươi từ 3 – 5 ngày khi cắm xốp chuyên dụng</div>
            <div className="flex items-center gap-2"><Check size={14} className="text-emerald-600 shrink-0" />Tặng kèm thiệp thiết kế & banner in màu cao cấp</div>
            <div className="flex items-center gap-2"><Check size={14} className="text-emerald-600 shrink-0" />Chụp ảnh thành phẩm gửi khách duyệt trước khi giao</div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5">
          {shop.phone && (
            <a href={`tel:${shop.phone}`} className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-1.5 transition-colors">
              <Phone size={15} /> Gọi Hotline
            </a>
          )}
          <a href={getZaloUrl(product, shop)} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors text-center">
            <MessageCircle size={18} /> Nhắn tin Zalo đặt mẫu này
          </a>
        </div>
      </div>
    </div>
  )
}
