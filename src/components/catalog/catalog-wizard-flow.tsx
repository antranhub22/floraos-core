"use client"

import React, { useState, useMemo } from "react"
import { BookOpen, ArrowLeft, ArrowRight, Check, Wand2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CatalogProduct } from "./catalog-management-tab"
import {
  CATALOG_STYLE_OPTIONS,
  type CatalogStyleVariant,
} from "@/modules/content-engine/domain/catalog-content-generator"
import { generateQRCodeDataUrl, triggerDownload } from "@/core/media/qr-engine"
import { useTenantProfile } from "@/lib/hooks/use-tenant-profile"
import { CatalogWizardStep1Products } from "./catalog-wizard-step1-products"
import { CatalogWizardStep4Success } from "./catalog-wizard-step4-success"

interface CatalogWizardFlowProps {
  products: CatalogProduct[]
  onCreated: () => void
  onCancelToManage: () => void
  onBackToModeSelection?: () => void
  initialSelectedIds?: string[] | undefined
  initialStyleVariant?: CatalogStyleVariant | undefined
  initialName?: string | undefined
  initialDesc?: string | undefined
  isAiPreFilled?: boolean | undefined
  /** Cho phép nhảy thẳng đến step chỉ định (dùng khi Autonomous AI đã điền sẵn) */
  initialStep?: number | undefined
}

export function CatalogWizardFlow({
  products,
  onCreated,
  onCancelToManage,
  onBackToModeSelection,
  initialSelectedIds,
  initialStyleVariant,
  initialName,
  initialDesc,
  isAiPreFilled = false,
  initialStep,
}: CatalogWizardFlowProps) {
  const { business } = useTenantProfile()
  const currentShopName = business?.display_name || "Tiệm hoa FloraOS"

  const [currentStep, setCurrentStep] = useState<number>(initialStep ?? 1)

  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds || [])
  const [styleVariant, setStyleVariant] = useState<CatalogStyleVariant>(initialStyleVariant || "MODERN_SHOWROOM")
  const [name, setName] = useState(initialName || "")
  const [desc, setDesc] = useState(initialDesc || "")

  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingQR, setDownloadingQR] = useState(false)

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "ACTIVE"),
    [products]
  )

  const availableOccasions = useMemo(() => {
    const set = new Set<string>()
    activeProducts.forEach((p) => { if (p.occasion_code) set.add(p.occasion_code) })
    return Array.from(set)
  }, [activeProducts])

  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  const handleQuickPreset = (type: "all" | "occasion" | "budget") => {
    if (type === "all") {
      setSelectedIds(activeProducts.map((p) => p.id))
      setName("Tất cả mẫu hoa đang bán")
      setStyleVariant("MODERN_SHOWROOM")
    } else if (type === "occasion") {
      const occ = availableOccasions[0] || "Sự kiện"
      const matched = activeProducts.filter((p) => p.occasion_code === occ)
      setSelectedIds(matched.length > 0 ? matched.map((p) => p.id) : activeProducts.slice(0, 6).map((p) => p.id))
      setName(`Bộ sưu tập Hoa ${occ}`)
      setStyleVariant("EDITORIAL_LOOKBOOK")
    } else if (type === "budget") {
      const budgetProds = activeProducts.filter((p) => p.price && p.price <= 800000)
      setSelectedIds(budgetProds.length > 0 ? budgetProds.map((p) => p.id) : activeProducts.slice(0, 5).map((p) => p.id))
      setName("Bộ sưu tập Hoa Tinh Tuyển Dưới 800K")
      setStyleVariant("COMPACT_LIST")
    }
    setCurrentStep(2)
  }

  const handleAiWriteIntro = async () => {
    if (!name.trim()) return
    setIsAiGenerating(true)
    try {
      const res = await fetch("/api/v1/content-engine/catalog-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionName: name.trim(),
          productCount: selectedIds.length,
          styleVariant,
        }),
      })
      if (!res.ok) throw new Error("Không thể sinh nội dung")
      const json = await res.json()
      if (json.data?.description) {
        setDesc(json.data.description)
      }
    } catch {
      setDesc(`Chào mừng quý khách đến với ${name}. Tuyển chọn những mẫu hoa tươi nghệ thuật được thiết kế tinh tế nhất từ ${currentShopName}.`)
    } finally {
      setIsAiGenerating(false)
    }
  }

  const handlePublishCatalog = async () => {
    if (!name.trim() || selectedIds.length === 0) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/catalog-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: desc.trim() || null,
          filters: { product_ids: selectedIds, style_variant: styleVariant },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Không thể tạo liên kết catalog.")
      }
      const json = await res.json()
      setPublishedSlug(json.data?.slug || "catalog")
      setCurrentStep(4)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const publishedUrl = publishedSlug ? `${window.location.origin}/c/${publishedSlug}` : ""

  const handleDownloadQR = async () => {
    if (!publishedUrl || !publishedSlug) return
    setDownloadingQR(true)
    try {
      const dataUrl = await generateQRCodeDataUrl(publishedUrl, { width: 500, margin: 3 })
      triggerDownload(dataUrl, `QR-Catalog-${publishedSlug}.png`)
    } finally {
      setDownloadingQR(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header Wizard & Progress */}
      <div className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-muted text-primary text-caption font-bold uppercase tracking-wider mb-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Hành trình Tạo Catalog Số Trực Tuyến</span>
          </div>
          <h2 className="text-title font-bold text-text">
            {currentStep === 1 && "Bước 1: Tuyển chọn sản phẩm hoa vào Catalog"}
            {currentStep === 2 && "Bước 2: Chọn phong cách hiển thị Catalog"}
            {currentStep === 3 && "Bước 3: Đặt tên, lời chào AI & Xem trước"}
            {currentStep === 4 && "Bước 4: Xuất bản thành công & Hành động tiếp theo"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onBackToModeSelection && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBackToModeSelection}
              className="text-caption text-text-muted hover:text-text hover:bg-surface-alt"
            >
              ← Đổi chế độ
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancelToManage}
            className="text-caption font-semibold border-border hover:bg-surface-alt"
          >
            Quản lý link đã tạo →
          </Button>
        </div>
      </div>

      {/* Thông báo AI pre-fill nếu có */}
      {isAiPreFilled && currentStep < 4 && (
        <div className="p-3.5 rounded-xl bg-primary-muted border border-primary-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-primary text-body-sm font-semibold">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>AI đã phân tích nguyên liệu và chuẩn bị sẵn các lựa chọn tối ưu cho Catalog. Bạn có thể kiểm tra từng bước!</span>
          </div>
          {onBackToModeSelection && (
            <button
              type="button"
              onClick={onBackToModeSelection}
              className="text-caption text-primary hover:underline font-bold shrink-0 cursor-pointer"
            >
              Chọn lại phương thức
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-destructive-bg text-destructive text-body-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Nội dung từng bước */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-5">
        {currentStep === 1 && (
          <CatalogWizardStep1Products
            products={products}
            selectedIds={selectedIds}
            onToggleProduct={toggleSelectProduct}
            onSelectAll={setSelectedIds}
            onClearSelection={() => setSelectedIds([])}
            onQuickPreset={handleQuickPreset}
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-title font-bold text-text">Chọn phong cách trình bày Catalog</h3>
              <p className="text-body-sm text-text-muted mt-0.5">
                Phong cách sẽ quyết định bố cục lướt xem của khách hàng trên điện thoại di động.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CATALOG_STYLE_OPTIONS.map((style) => {
                const isSelected = styleVariant === style.id
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setStyleVariant(style.id)}
                    className={`flex flex-col p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary-muted/20 ring-1 ring-primary shadow-xs"
                        : "border-border bg-surface hover:bg-surface-alt/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-body font-bold text-text">{style.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-caption text-text-muted flex-1">{style.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-title font-bold text-text">Thông tin hiển thị & Lời chào khách</h3>
              <p className="text-body-sm text-text-muted mt-0.5">
                Đặt tên bộ sưu tập và để AI tạo lời tự sự giới thiệu hoa chuyên nghiệp.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-caption font-bold text-text mb-1">
                  Tên Catalog / Bộ sưu tập <span className="text-destructive">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Bộ sưu tập Hoa Tươi Mới Về Hôm Nay..."
                  className="text-body-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-caption font-bold text-text">Lời chào & Mô tả Catalog</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!name.trim() || isAiGenerating}
                    onClick={handleAiWriteIntro}
                    className="text-caption text-primary hover:bg-primary-muted/20 h-7 gap-1"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    <span>{isAiGenerating ? "AI đang viết..." : "✨ AI Viết Lời Chào"}</span>
                  </Button>
                </div>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  placeholder="Nhập lời chào khách khi mở link catalog..."
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="p-4 rounded-xl bg-surface-alt/70 border border-border flex items-center justify-between">
                <div>
                  <div className="text-body-sm font-bold text-text">{name || "Chưa đặt tên Catalog"}</div>
                  <div className="text-caption text-text-muted mt-0.5">
                    Phong cách: <strong className="text-text">{styleVariant}</strong> • Gồm <strong className="text-primary">{selectedIds.length}</strong> mẫu hoa tuyển chọn
                  </div>
                </div>
                <div className="text-caption text-success font-semibold flex items-center gap-1">
                  <Check className="h-4 w-4" /> Đã sẵn sàng xuất bản
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && publishedUrl && publishedSlug && (
          <CatalogWizardStep4Success
            publishedUrl={publishedUrl}
            publishedSlug={publishedSlug}
            onDownloadQR={handleDownloadQR}
            downloadingQR={downloadingQR}
          />
        )}

        {/* Nút điều hướng tuần tự */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="flex items-center gap-1.5 text-body-sm font-semibold border-border hover:bg-surface-alt"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại</span>
            </Button>

            <div className="flex items-center gap-2">
              {currentStep < 3 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentStep === 1 && selectedIds.length === 0}
                  onClick={() => {
                    if (currentStep === 1 && !name) {
                      setName(`Bộ sưu tập ${selectedIds.length} Mẫu Hoa Tuyển Chọn`)
                    }
                    setCurrentStep((prev) => Math.min(3, prev + 1))
                  }}
                  className="border-primary text-primary hover:bg-primary-muted/20 flex items-center gap-1.5 text-body-sm font-semibold"
                >
                  <span>Tiếp tục ({selectedIds.length} hoa đã chọn)</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handlePublishCatalog}
                  disabled={isSubmitting || !name.trim()}
                  className="bg-primary text-surface hover:bg-primary-dark flex items-center gap-1.5 text-body-sm font-semibold px-6"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isSubmitting ? "Đang xuất bản..." : "Xuất bản Catalog ngay →"}</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
