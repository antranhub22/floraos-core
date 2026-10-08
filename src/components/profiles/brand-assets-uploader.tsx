"use client"

import React, { useState, useRef } from "react"
import {
  Upload,
  Image as ImageIcon,
  Video,
  QrCode,
  Trash2,
  CheckCircle2,
  Loader2,
  Plus,
} from "lucide-react"
import {
  PhotoUploadGuidance,
  LOGO_GUIDANCE,
  STOREFRONT_GUIDANCE,
  VIDEO_GUIDANCE,
  QR_GUIDANCE,
} from "./photo-upload-guidance"

export interface BrandAssetsData {
  storefront_photos?: string[]
  intro_video?: string
  zalo_qr?: string // chỉ mã QR Zalo; `qr_code` cũ (từng nhận mã ngân hàng) không còn dùng
}

export interface BrandAssetsUploaderProps {
  logoAssetId: string
  onLogoChange: (newLogo: string) => void
  brandAssets?: BrandAssetsData | null
  onBrandAssetsChange: (assets: BrandAssetsData) => void
  disabled?: boolean
}

async function uploadFileToAssets(file: File): Promise<{ assetId: string; viewUrl: string }> {
  const urlRes = await fetch("/api/v1/assets/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: null, mime_type: file.type || "image/png" }),
  })

  if (!urlRes.ok) {
    throw new Error(`Không lấy được liên kết tải lên: ${urlRes.statusText}`)
  }

  const { asset_id, storage_key, upload_url } = (await urlRes.json()) as {
    asset_id: string
    storage_key: string
    upload_url: string
  }

  const putRes = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/png" },
    body: file,
  })

  if (!putRes.ok) {
    throw new Error("Lỗi lưu trữ tệp tin lên hệ thống")
  }

  const registerRes = await fetch("/api/v1/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      asset_id,
      product_id: null,
      kind: "ORIGINAL",
      storage_key,
      mime_type: file.type || "image/png",
      file_size: file.size,
    }),
  })

  if (!registerRes.ok) {
    throw new Error("Không thể đăng ký tài nguyên vào kho")
  }

  let viewUrl = ""
  try {
    const viewRes = await fetch(`/api/v1/assets/${encodeURIComponent(asset_id)}/view-url`)
    if (viewRes.ok) {
      const v = await viewRes.json()
      viewUrl = v.url || ""
    }
  } catch {
    // fallback
  }

  return { assetId: asset_id, viewUrl: viewUrl || URL.createObjectURL(file) }
}

export function BrandAssetsUploader({
  logoAssetId,
  onLogoChange,
  brandAssets,
  onBrandAssetsChange,
  disabled = false,
}: BrandAssetsUploaderProps) {
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>(logoAssetId || "")
  const [videoUploading, setVideoUploading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [qrUploading, setQrUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const storefrontInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)

  const storefrontPhotos = brandAssets?.storefront_photos || []
  const introVideo = brandAssets?.intro_video || ""
  const qrCode = brandAssets?.zalo_qr || ""

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    setErrorMessage(null)
    try {
      const { assetId, viewUrl } = await uploadFileToAssets(file)
      setLogoPreview(viewUrl)
      onLogoChange(assetId)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Tải logo thất bại")
    } finally {
      setLogoUploading(false)
    }
  }

  const handleStorefrontFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setPhotoUploading(true)
    setErrorMessage(null)
    try {
      const newUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        if (storefrontPhotos.length + newUrls.length >= 8) break
        const f = files[i]
        if (!f) continue
        const { viewUrl } = await uploadFileToAssets(f)
        newUrls.push(viewUrl)
      }
      onBrandAssetsChange({
        ...brandAssets,
        storefront_photos: [...storefrontPhotos, ...newUrls],
      })
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Tải ảnh không gian thất bại")
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleRemoveStorefrontPhoto = (index: number) => {
    const updated = storefrontPhotos.filter((_, idx) => idx !== index)
    onBrandAssetsChange({ ...brandAssets, storefront_photos: updated })
  }

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoUploading(true)
    setErrorMessage(null)
    try {
      const { viewUrl } = await uploadFileToAssets(file)
      onBrandAssetsChange({ ...brandAssets, intro_video: viewUrl })
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Tải video thất bại")
    } finally {
      setVideoUploading(false)
    }
  }

  const handleQrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrUploading(true)
    setErrorMessage(null)
    try {
      const { viewUrl } = await uploadFileToAssets(file)
      onBrandAssetsChange({ ...brandAssets, zalo_qr: viewUrl })
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Tải mã QR thất bại")
    } finally {
      setQrUploading(false)
    }
  }

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
              {logoPreview || logoAssetId ? (
                <img
                  src={logoPreview || logoAssetId}
                  alt="Logo thương hiệu"
                  className="h-full w-full object-contain p-1.5"
                />
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
                {(logoPreview || logoAssetId) && (
                  <CheckCircle2 size={16} className="text-success" />
                )}
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
              <span>{logoPreview || logoAssetId ? "Thay logo khác" : "Tải ảnh logo lên"}</span>
            </button>

            {(logoPreview || logoAssetId) && (
              <button
                type="button"
                disabled={disabled || logoUploading}
                onClick={() => {
                  setLogoPreview("")
                  onLogoChange("")
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
        currentCount={logoPreview || logoAssetId ? 1 : 0}
        tier={LOGO_GUIDANCE.tier}
        categoryLabel={LOGO_GUIDANCE.categoryLabel}
        benefits={LOGO_GUIDANCE.benefits}
        tips={LOGO_GUIDANCE.tips}
      />

      {/* 2. BỘ ẢNH KHÔNG GIAN CỬA HÀNG & NGHỆ NHÂN */}
      <div className="rounded-xl border border-border bg-surface-alt p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-body font-bold text-text flex items-center gap-2">
              <span>Ảnh Không gian tiệm & Nghệ nhân</span>
              <span className="text-caption px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted">
                {storefrontPhotos.length}/8 ảnh
              </span>
            </h4>
            <p className="text-caption text-text-muted mt-0.5">
              Dùng làm banner trang giới thiệu, album Showroom và tăng uy tín thương hiệu
            </p>
          </div>

          {storefrontPhotos.length < 8 && (
            <div>
              <input
                ref={storefrontInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handleStorefrontFiles}
                className="hidden"
                disabled={disabled || photoUploading}
              />
              <button
                type="button"
                disabled={disabled || photoUploading}
                onClick={() => storefrontInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-body-sm font-semibold text-text hover:border-primary transition-colors disabled:opacity-50"
              >
                {photoUploading ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                <span>Thêm ảnh</span>
              </button>
            </div>
          )}
        </div>

        {/* Khuyến cáo upload ảnh không gian */}
        <PhotoUploadGuidance
          currentCount={storefrontPhotos.length}
          tier={STOREFRONT_GUIDANCE.tier}
          categoryLabel={STOREFRONT_GUIDANCE.categoryLabel}
          benefits={STOREFRONT_GUIDANCE.benefits}
          tips={STOREFRONT_GUIDANCE.tips}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {storefrontPhotos.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-4/3 rounded-xl border border-border overflow-hidden bg-surface"
            >
              <img src={url} alt={`Không gian ${idx + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveStorefrontPhoto(idx)}
                className="absolute top-1.5 right-1.5 rounded-lg bg-surface/80 p-1 text-text-muted hover:text-danger hover:bg-surface transition-colors"
                title="Xóa ảnh"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {storefrontPhotos.length === 0 && (
            <div className="col-span-2 sm:col-span-4 py-6 border border-dashed border-border rounded-xl text-center">
              <p className="text-caption text-text-muted">Chưa có ảnh không gian nào — Bấm "Thêm ảnh" để tải lên 2-4 ảnh</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. VIDEO INTRO / OUTRO & MÃ QR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Video Intro / Outro */}
        <div className="rounded-xl border border-border bg-surface-alt p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-body font-bold text-text flex items-center gap-2">
              <Video size={16} className="text-primary" />
              <span>Video Intro/Outro (3-5s)</span>
            </h4>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm"
              onChange={handleVideoFile}
              className="hidden"
              disabled={disabled || videoUploading}
            />
            <button
              type="button"
              disabled={disabled || videoUploading}
              onClick={() => videoInputRef.current?.click()}
              className="text-caption font-bold text-primary hover:underline disabled:opacity-50"
            >
              {videoUploading ? "Đang tải..." : introVideo ? "Thay đổi" : "Tải lên"}
            </button>
          </div>
          <p className="text-caption text-text-muted mb-3">
            Tự động ghép vào đầu hoặc cuối các video quay sản phẩm hoa trên TikTok/Reels.
          </p>
          {/* Khuyến cáo upload video */}
          <PhotoUploadGuidance
            currentCount={introVideo ? 1 : 0}
            tier={VIDEO_GUIDANCE.tier}
            categoryLabel={VIDEO_GUIDANCE.categoryLabel}
            benefits={VIDEO_GUIDANCE.benefits}
            tips={VIDEO_GUIDANCE.tips}
          />
          {introVideo ? (
            <div className="relative rounded-xl overflow-hidden border border-border bg-black aspect-16/9">
              <video src={introVideo} controls className="h-full w-full object-contain" />
              <button
                type="button"
                aria-label="Xóa video nhận diện"
                title="Xóa video nhận diện"
                onClick={() => onBrandAssetsChange({ ...brandAssets, intro_video: "" })}
                className="absolute top-2 right-2 rounded-lg bg-surface/80 p-1 text-danger hover:bg-surface transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <div className="aspect-16/9 rounded-xl border border-dashed border-border flex items-center justify-center text-caption text-text-muted">
              Chưa có video nhận diện
            </div>
          )}
        </div>

        {/* Mã QR Zalo — thanh toán dùng VietQR tự tạo theo đơn từ tài khoản nhận tiền (tab Doanh nghiệp) */}
        <div className="rounded-xl border border-border bg-surface-alt p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-body font-bold text-text flex items-center gap-2">
              <QrCode size={16} className="text-primary" />
              <span>Mã QR Zalo của tiệm</span>
            </h4>
            <input
              ref={qrInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleQrFile}
              className="hidden"
              disabled={disabled || qrUploading}
            />
            <button
              type="button"
              disabled={disabled || qrUploading}
              onClick={() => qrInputRef.current?.click()}
              className="text-caption font-bold text-primary hover:underline disabled:opacity-50"
            >
              {qrUploading ? "Đang tải..." : qrCode ? "Thay đổi" : "Tải lên"}
            </button>
          </div>
          <p className="text-caption text-text-muted mb-3">
            Khách bấm "Mã QR" trên trang đặt hoa sẽ thấy mã này để kết nối Zalo với tiệm. Không tải mã QR ngân hàng vào đây — mã thanh toán được tạo tự động theo từng đơn từ tài khoản nhận tiền ở tab Doanh nghiệp.
          </p>
          {/* Khuyến cáo upload mã QR */}
          <PhotoUploadGuidance
            currentCount={qrCode ? 1 : 0}
            tier={QR_GUIDANCE.tier}
            categoryLabel={QR_GUIDANCE.categoryLabel}
            benefits={QR_GUIDANCE.benefits}
            tips={QR_GUIDANCE.tips}
          />
          {qrCode ? (
            <div className="relative rounded-xl overflow-hidden border border-border bg-surface aspect-16/9 flex items-center justify-center p-2">
              <img src={qrCode} alt="Mã QR Zalo" className="max-h-full max-w-full object-contain" />
              <button
                type="button"
                aria-label="Xóa mã QR"
                title="Xóa mã QR"
                onClick={() => onBrandAssetsChange({ ...brandAssets, zalo_qr: "" })}
                className="absolute top-2 right-2 rounded-lg bg-surface/80 p-1 text-danger hover:bg-surface transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <div className="aspect-16/9 rounded-xl border border-dashed border-border flex items-center justify-center text-caption text-text-muted">
              Chưa có mã QR
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
