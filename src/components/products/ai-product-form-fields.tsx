"use client"

import React, { useRef } from "react"
import {
  Upload,
  Image as ImageIcon,
  Layers,
  X,
  Loader2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { DriveThumbImage } from "@/components/greeting-card/drive-thumb-image"
import {
  CATEGORIES,
  SHAPES,
  FACINGS,
  type ProductFormValues,
} from "./ai-product-helpers"
import { AiProductBomSection } from "./ai-product-bom-section"
import { AiProductMarketingSection } from "./ai-product-marketing-section"

interface AiProductFormFieldsProps {
  values: ProductFormValues
  onChange: <K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) => void
  onImageFileSelected: (file: File) => void
  onRemoveImage: () => void
  imagePreview: string | null
  uploadingImage: boolean
  onCallContentEngine: (style: "luxurious" | "sweet" | "creative" | "concise") => Promise<void>
  isGeneratingContent: boolean
  contentSuggestions: string[]
  onSelectSuggestion: (text: string) => void
}

export function AiProductFormFields({
  values,
  onChange,
  onImageFileSelected,
  onRemoveImage,
  imagePreview,
  uploadingImage,
  onCallContentEngine,
  isGeneratingContent,
  contentSuggestions,
  onSelectSuggestion,
}: AiProductFormFieldsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-6">
      {/* 1. Ảnh đại diện & thông tin chung */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-title-sm font-bold text-text">
          <ImageIcon size={18} className="text-primary" />
          <span>Ảnh đại diện và thông tin chung</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Box ảnh */}
          <div className="flex flex-col gap-2">
            <span className="text-caption font-semibold text-text">Ảnh mẫu hoa</span>
            {imagePreview ? (
              <div className="relative aspect-square w-full rounded-2xl border border-border bg-surface-alt overflow-hidden group">
                <img src={imagePreview} alt="Mẫu hoa" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={onRemoveImage}
                  aria-label="Xoá ảnh hiện tại"
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : values.driveLink ? (
              <div className="relative aspect-square w-full rounded-2xl border border-border bg-surface-alt overflow-hidden group">
                <DriveThumbImage
                  driveLink={values.driveLink}
                  alt={values.name || "Mẫu hoa"}
                  className="h-full w-full"
                  fallback="full"
                />
                <button
                  type="button"
                  onClick={onRemoveImage}
                  aria-label="Xoá ảnh hiện tại"
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-alt/50 p-4 text-center transition-colors hover:border-primary/50 hover:bg-surface-alt"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                </div>
                <div className="text-body-sm font-medium text-text">Chọn hoặc tải ảnh lên</div>
                <div className="text-caption text-text-muted">Hỗ trợ JPG, PNG, WebP</div>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImageFileSelected(f)
              }}
              className="hidden"
            />
          </div>

          {/* Form các trường chung */}
          <div className="md:col-span-2 space-y-3.5">
            <div>
              <label className="block text-caption font-semibold text-text mb-1">
                Tên mẫu hoa <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={values.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Ví dụ: Bó hoa Nắng Hạ Rạng Rỡ"
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-caption font-semibold text-text mb-1">
                  Mã mẫu hoa (SKU) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={values.code}
                  onChange={(e) => onChange("code", e.target.value)}
                  placeholder="FL-2133"
                  className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary uppercase"
                />
              </div>

              <div>
                <label className="block text-caption font-semibold text-text mb-1">Giá niêm yết (₫)</label>
                <input
                  type="text"
                  value={values.priceVnd}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "")
                    onChange("priceVnd", raw ? Number(raw).toLocaleString("vi-VN") : "")
                  }}
                  placeholder="Ví dụ: 650.000"
                  className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-caption font-semibold text-text mb-1">Danh mục</label>
                <select
                  value={values.category}
                  onChange={(e) => onChange("category", e.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-caption font-semibold text-text mb-1">Trạng thái bán</label>
                <select
                  value={values.status}
                  onChange={(e) => onChange("status", e.target.value as "ACTIVE" | "DRAFT")}
                  className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="ACTIVE">Đang bán</option>
                  <option value="DRAFT">Bản nháp</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Kiểu dáng và hướng nhìn */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-title-sm font-bold text-text">
          <Layers size={18} className="text-primary" />
          <span>Kiểu dáng và hướng nhìn</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-caption font-semibold text-text mb-1">Kiểu dáng cắm</label>
            <select
              value={values.shape}
              onChange={(e) => onChange("shape", e.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary"
            >
              {SHAPES.map((sh) => (
                <option key={sh} value={sh}>
                  {sh}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-caption font-semibold text-text mb-1">Mặt nhìn</label>
            <select
              value={values.facing}
              onChange={(e) => onChange("facing", e.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary"
            >
              {FACINGS.map((fc) => (
                <option key={fc} value={fc}>
                  {fc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-caption font-semibold text-text mb-1">Vật chứa / bao bì</label>
            <input
              type="text"
              value={values.container}
              onChange={(e) => onChange("container", e.target.value)}
              placeholder="Giấy gói Hàn Quốc, giỏ mây..."
              className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-text mb-1">Tông màu chủ đạo</label>
            <input
              type="text"
              value={values.primaryColor}
              onChange={(e) => onChange("primaryColor", e.target.value)}
              placeholder="Đỏ, Pastel, Trắng kem..."
              className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </Card>

      {/* 3. Thành phần hoa (BOM) */}
      <AiProductBomSection
        flowers={values.flowers}
        onChange={(fl) => onChange("flowers", fl)}
      />

      {/* 4. Câu chuyện và thông điệp mẫu hoa (Content Engine) */}
      <AiProductMarketingSection
        description={values.description}
        onChange={(val) => onChange("description", val)}
        onCallContentEngine={onCallContentEngine}
        isGeneratingContent={isGeneratingContent}
        contentSuggestions={contentSuggestions}
        onSelectSuggestion={onSelectSuggestion}
      />
    </div>
  )
}
