"use client"

import React, { useState } from "react"
import { Eye, X, Check, Smartphone, Sparkles, ExternalLink } from "lucide-react"
import type { GreetingTemplateId } from "@/modules/greeting-card/domain/greeting-template-registry"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { getTemplateStyleConfig } from "./styles/template-style-configs"
import { SwipeCardItem } from "./swipe-card-item"

const SAMPLE_PREVIEW_PRODUCTS: GreetingCatalogProduct[] = [
  {
    id: "sample-1",
    name: "Bó Hoa Hồng Red Naomi Ecuador",
    code: "HH-01",
    price: 850000,
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    description: "Hoa hồng đỏ nhung Ecuador tuyển chọn, phối cành lá bạc bạch đàn và hoa nhí baby nhập khẩu.",
    flowersSummary: "12 cành hoa hồng Red Naomi Ecuador, lá bạc thơm, giấy gói lụa cao cấp",
    style: "Sang Trọng",
    meaning: "Tình yêu mãnh liệt, đam mê và sự gắn kết trường tồn",
    sortOrder: 1,
  },
  {
    id: "sample-2",
    name: "Giỏ Hoa Mẫu Đơn & Tulip Mùa Xuân",
    code: "GH-02",
    price: 1450000,
    imageUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80",
    description: "Mẫu đơn Sarah Bernhardt phối cùng tulip pastel Hà Lan trong giỏ mây tự nhiên.",
    flowersSummary: "5 bông mẫu đơn hồng, 10 cành tulip, hoa thanh liễu",
    style: "Thơ Mộng",
    meaning: "Sự thịnh vượng, thanh nhã và niềm vui trọn vẹn",
    sortOrder: 2,
  },
]

interface TemplatePreviewModalProps {
  templateId: GreetingTemplateId | null
  styleNumber?: string | undefined
  templateName: string
  templateSubtitle?: string | undefined
  catalogId?: string | undefined
  previewProducts?: GreetingCatalogProduct[] | undefined
  onClose: () => void
  onSelect: (id: GreetingTemplateId) => void
  isSelected: boolean
}

export function TemplatePreviewModal({
  templateId,
  styleNumber,
  templateName,
  templateSubtitle,
  catalogId,
  previewProducts,
  onClose,
  onSelect,
  isSelected,
}: TemplatePreviewModalProps) {
  const [productIndex, setProductIndex] = useState(0)
  const [isFav, setIsFav] = useState(false)
  const [loadedProducts, setLoadedProducts] = useState<GreetingCatalogProduct[]>([])

  // Fetch real products from catalogId if provided and no previewProducts passed
  const hasPreview = Boolean(previewProducts && previewProducts.length > 0)
  React.useEffect(() => {
    if (hasPreview || !catalogId) return

    let cancelled = false
    fetch(`/api/v1/greeting-card/catalogs/${catalogId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.data?.items) return
        type RawItem = {
          product: {
            id: string
            name: string
            code?: string
            masterImageUrl?: string
            price_vnd?: number | null
            description?: string | null
            flowers_summary?: string | null
            style?: string | null
            meaning?: string | null
            variants?: Array<{ price_vnd?: number | null }>
          }
          sort_order: number
        }
        const mapped: GreetingCatalogProduct[] = (json.data.items as RawItem[]).map((item, idx) => {
          const p = item.product
          const price = p.price_vnd ?? p.variants?.[0]?.price_vnd ?? 0
          return {
            id: p.id,
            name: p.name,
            code: p.code || `SP-${idx + 1}`,
            price: Number(price) || 0,
            imageUrl: p.masterImageUrl || "",
            description: p.description || "",
            flowersSummary: p.flowers_summary || "",
            style: p.style || "Thiết Kế",
            meaning: p.meaning || "",
            sortOrder: item.sort_order ?? idx + 1,
          }
        })
        if (mapped.length > 0) {
          setLoadedProducts(mapped)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [catalogId, hasPreview])

  if (!templateId) return null

  const styleKey = styleNumber || templateId
  const styleConfig = getTemplateStyleConfig(styleKey)
  const activeProductList =
    hasPreview && previewProducts
      ? previewProducts
      : loadedProducts.length > 0
        ? loadedProducts
        : SAMPLE_PREVIEW_PRODUCTS
  const safeIndex = productIndex < activeProductList.length ? productIndex : 0
  const activeProduct = activeProductList[safeIndex] || SAMPLE_PREVIEW_PRODUCTS[0]!

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Xem thử mẫu ${templateName}`}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Backdrop clickable layer with accessible button */}
      <button
        type="button"
        aria-label="Đóng xem trước"
        className="fixed inset-0 w-full h-full cursor-default bg-transparent -z-10"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[440px] max-h-[92vh] flex flex-col rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {styleNumber && (
              <span className="text-caption font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">
                #{styleNumber}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-body font-bold text-foreground truncate">{templateName}</h3>
              {templateSubtitle && (
                <p className="text-caption text-text-muted truncate">{templateSubtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng xem trước"
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-foreground hover:bg-surface-muted transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Canvas Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex items-center justify-center bg-surface-muted/60">
          <div className="w-full max-w-[380px]">
            <SwipeCardItem
              product={activeProduct}
              styleConfig={styleConfig}
              isActive={true}
              isFavorite={isFav}
              currentIndex={productIndex}
              totalCount={activeProductList.length}
              onToggleFavorite={() => setIsFav((prev) => !prev)}
            />
          </div>
        </div>

        {/* Switch product mini controls */}
        <div className="px-4 py-2 bg-surface border-t border-border flex items-center justify-between text-caption text-text-muted shrink-0">
          <div className="flex items-center gap-1.5">
            <Smartphone size={13} className="text-primary" />
            <span>
              Mẫu {safeIndex + 1}/{activeProductList.length}
              {loadedProducts.length > 0 && (
                <span className="ml-1 text-primary font-bold">(Sản phẩm thật)</span>
              )}
            </span>
          </div>
          {activeProductList.length > 1 && (
            <button
              type="button"
              onClick={() => setProductIndex((prev) => (prev + 1) % activeProductList.length)}
              className="text-primary font-medium hover:underline cursor-pointer"
            >
              Mẫu tiếp theo →
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-surface border-t border-border flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl border border-border bg-surface text-body-sm font-semibold text-text hover:bg-surface-muted transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect(templateId)
              onClose()
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-body-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${
              isSelected
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-primary text-white hover:bg-primary-hover shadow-sm"
            }`}
          >
            {isSelected ? (
              <>
                <Check size={16} />
                <span>Đang áp dụng</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Chọn mẫu này</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
