"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { PhotoUploadGuidance, LOGO_GUIDANCE } from "./photo-upload-guidance"
import { uploadBrandAsset, resolveAssetViewUrl } from "./upload-brand-asset"
import { BrandStorefrontSection } from "./brand-storefront-section"
import { BrandVideoQrSection } from "./brand-video-qr-section"

export interface BrandAssetsData {
  storefront_photos?: string[]
  intro_video?: string
  zalo_qr?: string
  qr_code?: string
}

export interface BrandAssetsUploaderProps {
  logoAssetId: string
  initialLogoUrl?: string
  onLogoChange: (newLogo: string, previewUrl?: string) => void
  brandAssets?: BrandAssetsData | null
  onBrandAssetsChange: (assets: BrandAssetsData) => void
  disabled?: boolean
}

export function BrandAssetsUploader({
  logoAssetId,
  initialLogoUrl,
  onLogoChange,
  brandAssets,
  onBrandAssetsChange,
  disabled = false,
}: BrandAssetsUploaderProps) {
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>(initialLogoUrl || "")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)

  // Đồng bộ và giải mã URL ảnh logo khi logoAssetId hoặc initialLogoUrl thay đổi
  useEffect(() => {
    if (initialLogoUrl) {
      setLogoPreview(initialLogoUrl)
    } else if (logoAssetId) {
      let active = true
      resolveAssetViewUrl(logoAssetId).then((url) => {
        if (active && url) {
          setLogoPreview(url)
        }
      })
      return () => {
        active = false
      }
    } else {
      setLogoPreview("")
    }
  }, [logoAssetId, initialLogoUrl])

  const storefrontPhotos = brandAssets?.storefront_photos || []
  const introVideo = brandAssets?.intro_video || ""
  const qrCode = brandAssets?.zalo_qr || (brandAssets as Record<string, unknown>)?.qr_code as string || ""

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    setErrorMessage(null)
    try {
      const { assetId, viewUrl } = await uploadBrandAsset(file)
      setLogoPreview(viewUrl)
      onLogoChange(assetId, viewUrl)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Tải logo thất bại")
    } finally {
      setLogoUploading(false)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  const handleStorefrontPhotosChange = (updated: string[]) => {
    onBrandAssetsChange({
      ...brandAssets,
      storefront_photos: updated,
    })
  }

  const handleVideoChange = (url: string) => {
    onBrandAssetsChange({
      ...brandAssets,
      intro_video: url,
    })
  }

  const handleQrChange = (url: string) => {
    onBrandAssetsChange({
      ...brandAssets,
      zalo_qr: url,
    })
  }

  const hasLogo = Boolean(logoPreview || logoAssetId)

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-body-sm text-danger flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-meta font-bold underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 1. LOGO THƯƠNG HIỆU */}
      <div className="rounded-xl border border-border bg-surface-alt p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo thương hiệu"
                  className="h-full w-full object-contain p-1.5"
                />
              ) : logoAssetId ? (
                <Loader2 className="animate-spin text-primary" size={24} />
              ) : (
                <ImageIcon className="text-text-muted opacity-40" size={32} />
              )}
              {logoUploading && (
                <div className="absolute inset-0 bg-surface/80 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              )}
            </div>

            <div>
              <h4 className="text-body font-bold text-text flex items-center gap-2">
                <span>Logo chính thức của tiệm</span>
                {hasLogo && <CheckCircle2 size={16} className="text-success" />}
              </h4>
              <p className="text-caption text-text-muted mt-0.5">
                PNG trong suốt, SVG hoặc JPG (tối thiểu 512x512px).
              </p>
              <p className="text-caption text-primary font-medium mt-0.5">
                ✦ Tự động đóng Watermark lên video/ảnh và làm nhận diện trang Catalog
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleLogoFile}
              className="hidden"
              disabled={disabled || logoUploading}
            />
            <button
              type="button"
              disabled={disabled || logoUploading}
              onClick={() => logoInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-body-sm font-bold text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {logoUploading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Upload size={16} />
              )}
              <span>{hasLogo ? "Thay logo khác" : "Tải ảnh logo lên"}</span>
            </button>

            {hasLogo && (
              <button
                type="button"
                disabled={disabled || logoUploading}
                onClick={() => {
                  setLogoPreview("")
                  onLogoChange("", "")
                }}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-surface p-2.5 text-text-muted hover:text-danger hover:border-danger transition-colors disabled:opacity-50"
                title="Xóa logo"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Khuyến cáo upload logo */}
      <PhotoUploadGuidance
        currentCount={hasLogo ? 1 : 0}
        tier={LOGO_GUIDANCE.tier}
        categoryLabel={LOGO_GUIDANCE.categoryLabel}
        benefits={LOGO_GUIDANCE.benefits}
        tips={LOGO_GUIDANCE.tips}
      />

      {/* 2. BỘ ẢNH KHÔNG GIAN CỬA HÀNG & NGHỆ NHÂN */}
      <BrandStorefrontSection
        photos={storefrontPhotos}
        onPhotosChange={handleStorefrontPhotosChange}
        disabled={disabled}
        onError={setErrorMessage}
      />

      {/* 3. VIDEO INTRO / OUTRO & MÃ QR */}
      <BrandVideoQrSection
        introVideo={introVideo}
        qrCode={qrCode}
        onVideoChange={handleVideoChange}
        onQrChange={handleQrChange}
        disabled={disabled}
        onError={setErrorMessage}
      />
    </div>
  )
}
