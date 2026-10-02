"use client"

import React from "react"
import { Check, ShoppingBag, MessageCircle } from "lucide-react"
import type { PublicCatalogProduct, PublicCatalogShop } from "@/modules/catalog-links/use-cases/get-public-catalog"
import { formatVnd, getZaloUrl } from "./product-detail-modal"
import { SmartFlowerImage } from "./smart-flower-image"

interface CatalogProductListViewProps {
  products: PublicCatalogProduct[]
  catalogStyle: "grid" | "lookbook" | "compact"
  shop: PublicCatalogShop
  onSelectProduct: (product: PublicCatalogProduct) => void
  onResetFilter: () => void
}

export function CatalogProductListView({
  products,
  catalogStyle,
  shop,
  onSelectProduct,
  onResetFilter,
}: CatalogProductListViewProps) {
  return (
    <main>
      <div className="flex items-center justify-between text-xs text-text-muted mb-3 px-1">
        <span>Hiển thị <strong>{products.length}</strong> mẫu hoa</span>
        <span className="flex items-center gap-1 text-success font-medium"><Check size={13} />Hoa tươi 100% tuyển chọn mỗi ngày</span>
      </div>

      {products.length === 0 ? (
        <div className="bg-surface rounded-3xl p-12 text-center border border-border shadow-xs my-6">
          <ShoppingBag size={40} className="mx-auto text-text-muted mb-3" />
          <h3 className="text-base font-bold text-text">Không tìm thấy mẫu hoa phù hợp</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">Hãy thử từ khóa khác hoặc bấm nút bên dưới để xem lại toàn bộ.</p>
          <button onClick={onResetFilter} className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors">Xem lại tất cả</button>
        </div>
      ) : catalogStyle === "lookbook" ? (
        /* Editorial Lookbook Style */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {products.map((p, idx) => (
            <div key={p.id} className="group bg-surface rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <button type="button" onClick={() => onSelectProduct(p)} className="w-full text-left">
                <div className="relative aspect-4/5 w-full bg-surface-alt overflow-hidden">
                  <SmartFlowerImage
                    src={p.imageUrl}
                    alt={p.name}
                    aspectRatio="4/5"
                    fallbackIndex={idx}
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-sm text-white text-caption font-bold z-20">{p.code}</div>
                </div>
                <div className="p-5 pb-2">
                  <h4 className="text-title-sm font-black text-text group-hover:text-primary transition-colors">{p.name}</h4>
                  <p className="text-caption text-text-muted mt-1 line-clamp-2">{p.description || "Tác phẩm hoa tươi thủ công tinh tế."}</p>
                </div>
              </button>
              <div className="p-5 pt-3 border-t border-border flex items-center justify-between">
                <div className="text-title-sm font-black text-primary">{formatVnd(p.price)}</div>
                <a href={getZaloUrl(p, shop)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors flex items-center gap-1.5"><MessageCircle size={14} />Đặt tác phẩm</a>
              </div>
            </div>
          ))}
        </div>
      ) : catalogStyle === "compact" ? (
        /* Compact List Style */
        <div className="space-y-2.5">
          {products.map((p, idx) => (
            <div key={p.id} className="p-3.5 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-between gap-3 hover:border-primary transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-surface-alt overflow-hidden shrink-0 border">
                  <SmartFlowerImage
                    src={p.imageUrl}
                    alt={p.name}
                    aspectRatio="square"
                    fallbackIndex={idx}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><span className="text-caption font-mono font-bold text-text-muted">{p.code}</span><h4 className="text-xs font-bold text-text truncate">{p.name}</h4></div>
                  <div className="text-caption text-text-muted mt-0.5">{p.category} {p.stemCount ? `· ${p.stemCount} cành` : ""}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right"><div className="text-caption text-text-muted">Giá</div><div className="text-xs font-black text-primary">{formatVnd(p.price)}</div></div>
                <a href={getZaloUrl(p, shop)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" title="Đặt Zalo"><MessageCircle size={16} /></a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Standard Grid Style */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p, idx) => (
            <div key={p.id} className="group bg-surface rounded-2xl overflow-hidden border border-border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col">
              <button type="button" onClick={() => onSelectProduct(p)} className="w-full text-left flex flex-col flex-1">
                <div className="relative aspect-square w-full bg-surface-alt overflow-hidden">
                  <SmartFlowerImage
                    src={p.imageUrl}
                    alt={p.name}
                    aspectRatio="square"
                    fallbackIndex={idx}
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 text-white text-caption font-bold z-20">{p.code}</div>
                </div>
                <div className="p-4 pb-0 flex-1 flex flex-col">
                  <div className="text-title-sm font-extrabold text-text line-clamp-1 group-hover:text-primary transition-colors">{p.name}</div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-text-muted">{p.category && <span>{p.category}</span>}{p.stemCount && <span>· {p.stemCount} cành</span>}</div>
                </div>
              </button>
              <div className="p-4 pt-3 mt-auto border-t border-border flex items-center justify-between">
                <div><div className="text-caption text-text-muted">Giá niêm yết</div><div className="text-title-sm font-black text-primary">{formatVnd(p.price)}</div></div>
                <a href={getZaloUrl(p, shop)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-bold transition-colors"><MessageCircle size={14} />Đặt Zalo</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
