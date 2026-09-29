"use client"

import React, { useState, useMemo } from "react"
import {
  Phone,
  MessageCircle,
  Share2,
  Search,
  MapPin,
  Layers,
  Sparkles,
  Check,
  Flower2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react"
import type { PublicCatalogResult, PublicCatalogProduct } from "@/modules/catalog-links/use-cases/get-public-catalog"
import { ProductDetailModal, formatVnd, getZaloUrl } from "./product-detail-modal"
import { ShareCatalogModal } from "./share-catalog-modal"
import { LandingTemplateHero, LandingTemplateLead } from "./landing-templates"

const EMPTY_PRODUCTS: PublicCatalogProduct[] = []

export interface CatalogStorefrontProps {
  initialData: PublicCatalogResult
}

export function CatalogStorefront({ initialData }: CatalogStorefrontProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOccasion, setSelectedOccasion] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<PublicCatalogProduct | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)

  // ── Computed ────────────────────────────────────────────────────────
  // Hook phải gọi TRƯỚC mọi `return` sớm (rules-of-hooks) — trạng thái
  // REVOKED/NOT_FOUND không có `products`, nên dùng mảng rỗng.
  const products = initialData.status === "ACTIVE" ? initialData.products : EMPTY_PRODUCTS
  const allOccasions = useMemo(() => {
    const occs = new Set<string>()
    for (const p of products) for (const occ of p.occasions) if (occ) occs.add(occ)
    return Array.from(occs)
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = searchQuery.trim() === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchOccasion = selectedOccasion === "all" || p.occasions.includes(selectedOccasion)
      return matchSearch && matchOccasion
    })
  }, [products, searchQuery, selectedOccasion])

  // ── REVOKED / NOT_FOUND states ──────────────────────────────────────
  if (initialData.status === "REVOKED") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-border shadow-xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-warning-bg text-warning flex items-center justify-center mb-4"><AlertCircle size={32} /></div>
          <h1 className="text-xl font-black text-text mb-2">Bộ sưu tập đã đóng</h1>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Bộ sưu tập <span className="font-semibold text-text">&quot;{initialData.catalogName}&quot;</span> đã tạm ngừng chia sẻ.
          </p>
          <div className="p-4 rounded-2xl bg-surface-alt border border-border text-xs text-text-muted w-full">
            Vui lòng liên hệ trực tiếp với cửa hàng để được tư vấn mẫu hoa tươi mới nhất.
          </div>
        </div>
      </div>
    )
  }
  if (initialData.status === "NOT_FOUND") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-border shadow-xl text-center">
          <h1 className="text-xl font-black text-text mb-2">Không tìm thấy danh mục</h1>
          <p className="text-sm text-text-muted">Đường dẫn catalog này không tồn tại hoặc đã bị gỡ bỏ.</p>
        </div>
      </div>
    )
  }

  const { catalog, shop } = initialData

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-text antialiased font-sans pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {shop.logoUrl ? <img src={shop.logoUrl} alt={shop.name} className="w-10 h-10 rounded-full object-cover border border-border" /> : <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold"><Flower2 size={20} /></div>}
            <div>
              <div className="text-sm font-extrabold text-text leading-tight">{shop.name}</div>
              {shop.address && <div className="text-caption text-text-muted flex items-center gap-1 mt-0.5 line-clamp-1"><MapPin size={11} className="shrink-0 text-primary" />{shop.address}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowShareModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/15 transition-colors">
              <Share2 size={14} />
              <span>Chia sẻ</span>
            </button>
            {shop.phone && <a href={`tel:${shop.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-dark shadow-sm transition-colors"><Phone size={13} />{shop.phone}</a>}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
        {initialData.campaignConfig ? (
          <LandingTemplateHero
            headline={catalog.name}
            occasionId={initialData.campaignConfig.occasion || "20-10"}
            archetypeId={initialData.campaignConfig.archetype || "minimal-luxury"}
          />
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-primary-dark text-white p-6 sm:p-8 shadow-lg">
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-bold tracking-wide uppercase mb-3"><Sparkles size={13} />Catalog Mẫu Hoa Trực Tuyến</div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">{catalog.name}</h1>
              {catalog.description && <p className="mt-2 text-white/80 text-sm leading-relaxed">{catalog.description}</p>}
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none"><Flower2 size={240} /></div>
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="max-w-4xl mx-auto px-4 py-3 sticky top-[57px] z-30 bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" placeholder="Tìm theo tên, mã sản phẩm…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface border border-border text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs" />
          </div>
          {allOccasions.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button onClick={() => setSelectedOccasion("all")} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${selectedOccasion === "all" ? "bg-primary text-white shadow-xs" : "bg-surface text-text-muted border border-border hover:bg-surface-alt"}`}>Tất cả ({products.length})</button>
              {allOccasions.map((occ) => <button key={occ} onClick={() => setSelectedOccasion(occ)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${selectedOccasion === occ ? "bg-primary text-white shadow-xs" : "bg-surface text-text-muted border border-border hover:bg-surface-alt"}`}>{occ}</button>)}
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-4xl mx-auto px-4 pt-2">
        <div className="flex items-center justify-between text-xs text-text-muted mb-3 px-1">
          <span>Hiển thị <strong>{filteredProducts.length}</strong> mẫu hoa</span>
          <span className="flex items-center gap-1 text-success font-medium"><Check size={13} />Hoa tươi 100% tuyển chọn mỗi ngày</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-surface rounded-3xl p-12 text-center border border-border shadow-xs my-6">
            <ShoppingBag size={40} className="mx-auto text-text-muted mb-3" />
            <h3 className="text-base font-bold text-text">Không tìm thấy mẫu hoa phù hợp</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">Hãy thử từ khóa khác hoặc bấm nút bên dưới để xem lại toàn bộ.</p>
            <button onClick={() => { setSearchQuery(""); setSelectedOccasion("all") }} className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors">Xem lại tất cả</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <div key={p.id} className="group bg-surface rounded-2xl overflow-hidden border border-border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(p)}
                  className="w-full text-left flex flex-col flex-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-t-2xl"
                >
                  <div className="relative aspect-square w-full bg-surface-alt overflow-hidden">
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : <div className="w-full h-full flex flex-col items-center justify-center text-text-muted bg-surface-alt"><Flower2 size={48} strokeWidth={1.5} /><span className="text-caption font-medium mt-1">Ảnh đang cập nhật</span></div>}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-caption font-bold tracking-wide">{p.code}</div>
                    {p.occasions.length > 0 && <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-primary text-white text-caption font-bold shadow-xs">{p.occasions[0]}</div>}
                  </div>
                  <div className="p-4 pb-0 flex-1 flex flex-col">
                    <div className="text-title-sm font-extrabold text-text line-clamp-1 group-hover:text-primary transition-colors">{p.name}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-text-muted">
                      {p.category && <span className="font-medium text-text">{p.category}</span>}
                      {p.stemCount && <span className="flex items-center gap-1"><Layers size={11} className="text-text-muted" />{p.stemCount} cành</span>}
                    </div>
                  </div>
                </button>
                <div className="p-4 pt-3 mt-auto border-t border-border flex items-center justify-between">
                  <div><div className="text-caption text-text-muted">Giá niêm yết</div><div className="text-title-sm font-black text-primary">{formatVnd(p.price)}</div></div>
                  <a href={getZaloUrl(p, shop)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><MessageCircle size={14} />Đặt Zalo</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lead Capture Voucher Section for Campaigns */}
      {initialData.campaignConfig && (
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <LandingTemplateLead
            archetypeId={initialData.campaignConfig.archetype || "minimal-luxury"}
            occasionTitle={catalog.name}
          />
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && <ProductDetailModal product={selectedProduct} shop={shop} onClose={() => setSelectedProduct(null)} />}

      {/* Share Modal */}
      {showShareModal && (
        <ShareCatalogModal
          slug={catalog.slug}
          name={catalog.name}
          description={catalog.description}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-text-muted max-w-4xl mx-auto px-4">
        <div className="border-t border-border pt-6">
          <p className="font-medium text-text-muted">{shop.name} — Nền tảng Hoa tươi Thông minh FloraOS</p>
          <p className="mt-1 text-caption">Hệ thống E-Catalog tự động đồng bộ theo thời gian thực.</p>
        </div>
      </footer>
    </div>
  )
}
