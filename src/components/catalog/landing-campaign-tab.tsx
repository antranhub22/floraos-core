"use client"

import React, { useState } from "react"
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Palette,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CatalogProduct } from "./catalog-management-tab"
import { generateQRCodeDataUrl, triggerDownload } from "@/core/media/qr-engine"
import { CAMPAIGN_OCCASIONS, CAMPAIGN_ARCHETYPES } from "./landing-campaign-constants"
import { LandingCampaignPreview } from "./landing-campaign-preview"

interface LandingCampaignTabProps {
  products: CatalogProduct[]
  onRefresh?: () => void
}

export function LandingCampaignTab({ products, onRefresh }: LandingCampaignTabProps) {
  const [selectedOccasion, setSelectedOccasion] = useState(CAMPAIGN_OCCASIONS[0]?.id || "20-10")
  const [selectedArchetype, setSelectedArchetype] = useState(CAMPAIGN_ARCHETYPES[0]?.id || "minimal-luxury")
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [headline, setHeadline] = useState(CAMPAIGN_OCCASIONS[0]?.defaultHeadline || "")
  const [campaignSlug, setCampaignSlug] = useState("")

  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [downloadingQR, setDownloadingQR] = useState(false)

  const activeProducts = products.filter((p) => p.status === "ACTIVE")

  const handleOccasionChange = (occId: string) => {
    setSelectedOccasion(occId)
    const occ = CAMPAIGN_OCCASIONS.find((o) => o.id === occId)
    if (occ) setHeadline(occ.defaultHeadline)
  }

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleGeneratePage = () => {
    setIsGenerating(true)
    setPublishError(null)
    setTimeout(() => {
      setIsGenerating(false)
      const slug = `campaign-${selectedOccasion}-${Math.random().toString(36).substring(2, 6)}`
      setCampaignSlug(slug)
    }, 400)
  }

  const handlePublish = async () => {
    if (!campaignSlug) return
    setIsPublishing(true)
    setPublishError(null)
    try {
      const res = await fetch("/api/v1/catalog-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: campaignSlug,
          name: headline || `Chiến dịch ${selectedOccasion}`,
          description: `Landing page chiến dịch ${selectedOccasion} — Phong cách ${selectedArchetype}`,
          filters: {
            product_ids: selectedProductIds,
            occasion: selectedOccasion,
            archetype: selectedArchetype,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Không thể xuất bản chiến dịch.")
      }

      const url = `${window.location.origin}/c/${campaignSlug}`
      setPublishedUrl(url)
      setIsPublished(true)
      onRefresh?.()
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Lỗi khi xuất bản")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDownloadCampaignQR = async () => {
    if (!publishedUrl) return
    setDownloadingQR(true)
    try {
      const dataUrl = await generateQRCodeDataUrl(publishedUrl, { width: 500, margin: 3 })
      triggerDownload(dataUrl, `QR-Landing-${selectedOccasion}.png`)
    } catch (err) {
      console.error(err)
      alert("Không thể sinh mã QR lúc này.")
    } finally {
      setDownloadingQR(false)
    }
  }

  const selectedProducts = activeProducts.filter((p) => selectedProductIds.includes(p.id))

  return (
    <div className="space-y-6">
      {/* Campaign Configuration Card */}
      <div className="p-5 rounded-2xl bg-white border border-border shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-text">Thiết lập Chiến dịch Landing Page</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Xây dựng trang bán hàng theo sự kiện, tích hợp thông điệp thương hiệu và mã QR tiếp thị riêng.
          </p>
        </div>

        {publishError && (
          <div className="p-3 rounded-xl bg-destructive-bg text-destructive text-xs">
            ⚠️ {publishError}
          </div>
        )}

        {/* 1. Chọn dịp */}
        <div>
          <label className="block text-xs font-bold text-text mb-2 flex items-center gap-1.5">
            <Calendar size={14} className="text-primary" />
            <span>1. Chọn dịp sự kiện</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CAMPAIGN_OCCASIONS.map((occ) => (
              <button
                key={occ.id}
                type="button"
                onClick={() => handleOccasionChange(occ.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedOccasion === occ.id
                    ? "border-primary bg-primary-bg/30 text-primary font-bold shadow-xs"
                    : "border-border bg-surface text-text hover:border-border-hover text-xs font-medium"
                }`}
              >
                <div className="text-xs">{occ.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Chọn phong cách bố cục */}
        <div>
          <label className="block text-xs font-bold text-text mb-2 flex items-center gap-1.5">
            <Palette size={14} className="text-primary" />
            <span>2. Phong cách thiết kế trang</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CAMPAIGN_ARCHETYPES.map((arch) => (
              <button
                key={arch.id}
                type="button"
                onClick={() => setSelectedArchetype(arch.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedArchetype === arch.id
                    ? "border-primary bg-primary-bg/30 shadow-xs"
                    : "border-border bg-surface hover:border-border-hover"
                }`}
              >
                <div className="text-xs font-bold text-text">{arch.name}</div>
                <div className="text-[11px] text-text-muted mt-0.5">{arch.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Tiêu đề chiến dịch */}
        <div>
          <label className="block text-xs font-bold text-text mb-1.5">3. Thông điệp tiêu đề (Headline)</label>
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="h-9 text-xs"
            placeholder="Nhập tiêu đề trang chiến dịch..."
          />
        </div>

        {/* 4. Chọn sản phẩm tâm điểm */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-text flex items-center gap-1.5">
              <Layers size={14} className="text-primary" />
              <span>4. Chọn sản phẩm hoa tâm điểm ({selectedProductIds.length}/{activeProducts.length})</span>
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedProductIds.length === activeProducts.length) {
                  setSelectedProductIds([])
                } else {
                  setSelectedProductIds(activeProducts.map((p) => p.id))
                }
              }}
              className="text-[11px] h-7"
            >
              {selectedProductIds.length === activeProducts.length ? "Bỏ chọn" : "Chọn tất cả"}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-surface border">
            {activeProducts.map((p) => {
              const isSelected = selectedProductIds.includes(p.id)
              return (
                <div
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2 transition-colors ${
                    isSelected ? "border-primary bg-white font-bold" : "border-border bg-white/70"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleProduct(p.id)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  <span className="truncate">{p.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between border-t border-border">
          <div className="text-xs text-text-muted flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Tự động tối ưu giao diện điện thoại & bảo đảm nhận diện thương hiệu</span>
          </div>
          <Button
            onClick={handleGeneratePage}
            disabled={isGenerating || selectedProductIds.length === 0}
            className="bg-primary text-white flex items-center gap-2"
          >
            <Sparkles size={15} />
            <span>{isGenerating ? "Đang dựng trang..." : "Dựng trang Landing Page"}</span>
          </Button>
        </div>
      </div>

      {/* Visual Live Preview Section */}
      {(campaignSlug || isPublished) && (
        <LandingCampaignPreview
          headline={headline}
          selectedProducts={selectedProducts}
          archetypeId={selectedArchetype}
          occasionId={selectedOccasion}
          isPublished={isPublished}
          isPublishing={isPublishing}
          publishedUrl={publishedUrl}
          downloadingQR={downloadingQR}
          onPublish={handlePublish}
          onDownloadQR={handleDownloadCampaignQR}
        />
      )}
    </div>
  )
}
