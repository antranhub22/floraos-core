"use client"

import React, { useState, useMemo } from "react"
import {
  Phone,
  Share2,
  Search,
  MapPin,
  Sparkles,
  Flower2,
  AlertCircle,
  LayoutGrid,
  BookOpen,
  List,
} from "lucide-react"
import type { PublicCatalogResult, PublicCatalogProduct } from "@/modules/catalog-links/use-cases/get-public-catalog"
import type { GeneratedLandingPackage } from "@/modules/content-engine/domain/landing-content-generator"
import { ProductDetailModal } from "./product-detail-modal"
import { ShareCatalogModal } from "./share-catalog-modal"
import {
  LandingTemplateHero,
  LandingTemplateStory,
  LandingTemplatePerks,
  LandingTemplateProcess,
  LandingTemplateReviews,
  LandingTemplateFaq,
  LandingTemplateLead,
  LandingTemplateVideo,
  LandingTemplateGallery,
} from "./landing-templates"
import { resolveFlowerImage } from "./flower-image-fallback"
import type { GalleryPhotoItem } from "./landing-templates/landing-template-gallery"
import { CatalogProductListView } from "./catalog-product-list-view"

const EMPTY_PRODUCTS: PublicCatalogProduct[] = []

export interface CatalogStorefrontProps {
  initialData: PublicCatalogResult
}

export function CatalogStorefront({ initialData }: CatalogStorefrontProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOccasion, setSelectedOccasion] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<PublicCatalogProduct | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [catalogStyle, setCatalogStyle] = useState<"grid" | "lookbook" | "compact">("grid")

  const products = initialData.status === "ACTIVE" ? initialData.products : EMPTY_PRODUCTS
  const allOccasions = useMemo(() => {
    const occs = new Set<string>()
    for (const p of products) for (const occ of p.occasions) if (occ) occs.add(occ)
    return Array.from(occs)
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchOccasion = selectedOccasion === "all" || p.occasions.includes(selectedOccasion)
      return matchSearch && matchOccasion
    })
  }, [products, searchQuery, selectedOccasion])

  if (initialData.status === "REVOKED") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-border shadow-xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-warning-bg text-warning flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>
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
  const campaign = initialData.campaignConfig
  const customHeroImageUrl = campaign?.customHeroImageUrl as string | undefined
  const videoUrl = campaign?.videoUrl as string | undefined
  const generatedPackage = campaign?.generatedPackage as GeneratedLandingPackage | undefined
  const enabledSections = campaign?.enabledSections as Record<string, boolean> | undefined

  // Thu thập ảnh sản phẩm thật (loại bỏ blob: và ảnh không tồn tại)
  const realProductImageUrls = products
    .map((p) => p.imageUrl)
    .filter((url): url is string =>
      typeof url === "string" &&
      url.trim().length > 0 &&
      !url.startsWith("blob:") &&
      !url.startsWith("data:")
    )

  // Gallery: chuyển sang GalleryPhotoItem dùng tên sản phẩm làm caption
  const galleryPhotos: GalleryPhotoItem[] = products
    .filter((p): p is typeof p & { imageUrl: string } =>
      typeof p.imageUrl === "string" &&
      p.imageUrl.trim().length > 0 &&
      !p.imageUrl.startsWith("blob:") &&
      !p.imageUrl.startsWith("data:")
    )
    .map((p) => ({
      src: p.imageUrl,
      title: p.name,
      caption: p.category ?? "Sản phẩm hóa tươi",
    }))

  // Ảnh đầu tiên dùng cho Story section
  const storyImageUrl = realProductImageUrls[0] ?? null

  return (
    <div className="min-h-screen bg-background text-text antialiased font-sans pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.name} className="w-10 h-10 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                <Flower2 size={20} />
              </div>
            )}
            <div>
              <div className="text-sm font-extrabold text-text leading-tight">{shop.name}</div>
              {shop.address && (
                <div className="text-caption text-text-muted flex items-center gap-1 mt-0.5 line-clamp-1">
                  <MapPin size={11} className="shrink-0 text-primary" />
                  {shop.address}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
            >
              <Share2 size={14} />
              <span>Chia sẻ</span>
            </button>
            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-dark shadow-sm transition-colors"
              >
                <Phone size={13} />
                {shop.phone}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Section 1: Hero Banner */}
        {campaign ? (
          <LandingTemplateHero
            headline={catalog.name}
            occasionId={campaign.occasion || "20-10"}
            archetypeId={campaign.archetype || "minimal-luxury"}
            heroImageUrl={customHeroImageUrl || resolveFlowerImage(products.find((p) => p.imageUrl)?.imageUrl, 0)}
          />
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-primary-dark text-white p-6 sm:p-8 shadow-lg">
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-bold tracking-wide uppercase mb-3">
                <Sparkles size={13} />
                <span>Catalog Mẫu Hoa Trực Tuyến</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">{catalog.name}</h1>
              {catalog.description && <p className="mt-2 text-white/80 text-sm leading-relaxed">{catalog.description}</p>}
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
              <Flower2 size={240} />
            </div>
          </div>
        )}

        {/* Section Video Chiến Dịch (nếu có) */}
        {campaign && videoUrl && (
          <LandingTemplateVideo
            videoUrl={videoUrl}
            archetypeId={campaign.archetype}
            title="Video Cận Cảnh Mẫu Hoa Thực Tế"
          />
        )}

        {/* Section 2: Story Section (Campaign) — chỉ hiện nếu có ảnh thật từ shop */}
        {campaign && enabledSections?.story !== false && generatedPackage?.story && storyImageUrl && (
          <LandingTemplateStory
            story={generatedPackage.story}
            archetypeId={campaign.archetype}
            storyImageUrl={storyImageUrl}
          />
        )}

        {/* Section 3: Filter & Style Toolbar */}
        <div className="sticky top-[57px] z-30 bg-background/95 backdrop-blur-sm py-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Tìm theo tên, mã sản phẩm…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface border border-border text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
              />
            </div>

            {/* Catalog Style Switcher (for non-campaign or flexible view) */}
            {!campaign && (
              <div className="flex items-center bg-surface p-1 rounded-2xl border border-border shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCatalogStyle("grid")}
                  title="Lưới tiêu chuẩn"
                  className={`p-1.5 rounded-xl transition-colors ${catalogStyle === "grid" ? "bg-primary text-white shadow-xs" : "text-text-muted hover:text-text"}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogStyle("lookbook")}
                  title="Tạp chí Lookbook"
                  className={`p-1.5 rounded-xl transition-colors ${catalogStyle === "lookbook" ? "bg-primary text-white shadow-xs" : "text-text-muted hover:text-text"}`}
                >
                  <BookOpen size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogStyle("compact")}
                  title="Đặt nhanh B2B"
                  className={`p-1.5 rounded-xl transition-colors ${catalogStyle === "compact" ? "bg-primary text-white shadow-xs" : "text-text-muted hover:text-text"}`}
                >
                  <List size={16} />
                </button>
              </div>
            )}

            {allOccasions.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedOccasion("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${selectedOccasion === "all" ? "bg-primary text-white shadow-xs" : "bg-surface text-text-muted border border-border hover:bg-surface-alt"}`}
                >
                  Tất cả ({products.length})
                </button>
                {allOccasions.map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setSelectedOccasion(occ)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${selectedOccasion === occ ? "bg-primary text-white shadow-xs" : "bg-surface text-text-muted border border-border hover:bg-surface-alt"}`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Products Showcase */}
        <CatalogProductListView
          products={filteredProducts}
          catalogStyle={catalogStyle}
          shop={shop}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onResetFilter={() => {
            setSearchQuery("")
            setSelectedOccasion("all")
          }}
        />

        {/* Section 5: Perks (Campaign) */}
        {campaign && enabledSections?.perks !== false && generatedPackage?.perks && (
          <LandingTemplatePerks perks={generatedPackage.perks} archetypeId={campaign.archetype} />
        )}

        {/* Section 6: Process (Campaign) */}
        {campaign && enabledSections?.process !== false && generatedPackage?.steps && (
          <LandingTemplateProcess steps={generatedPackage.steps} archetypeId={campaign.archetype} />
        )}

        {/* Section: Gallery — chỉ hiện nếu shop có ảnh sản phẩm thật */}
        {campaign && enabledSections?.gallery !== false && galleryPhotos.length > 0 && (
          <LandingTemplateGallery archetypeId={campaign.archetype} photos={galleryPhotos} />
        )}

        {/* Section 7: Reviews (Campaign) */}
        {campaign && enabledSections?.reviews !== false && (
          <LandingTemplateReviews archetypeId={campaign.archetype} />
        )}

        {/* Section 8: FAQ (Campaign) */}
        {campaign && enabledSections?.faq !== false && generatedPackage?.faq && (
          <LandingTemplateFaq faq={generatedPackage.faq} archetypeId={campaign.archetype} />
        )}

        {/* Section 9: Lead Capture Voucher (Campaign) */}
        {campaign && enabledSections?.lead !== false && (
          <LandingTemplateLead
            archetypeId={campaign.archetype || "minimal-luxury"}
            occasionTitle={catalog.name}
            catalogSlug={catalog.slug}
          />
        )}
      </div>

      {/* Modals & Footer */}
      {selectedProduct && <ProductDetailModal product={selectedProduct} shop={shop} onClose={() => setSelectedProduct(null)} />}
      {showShareModal && <ShareCatalogModal slug={catalog.slug} name={catalog.name} description={catalog.description} onClose={() => setShowShareModal(false)} />}
      <footer className="mt-12 text-center text-xs text-text-muted max-w-4xl mx-auto px-4">
        <div className="border-t border-border pt-6">
          <p className="font-medium text-text-muted">{shop.name} — Nền tảng Hoa tươi Thông minh FloraOS</p>
        </div>
      </footer>
    </div>
  )
}
