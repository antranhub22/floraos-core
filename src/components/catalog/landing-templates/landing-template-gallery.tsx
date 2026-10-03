"use client"

import React, { useState } from "react"
import { Camera, Sparkles, Image as ImageIcon, ZoomIn, X } from "lucide-react"
import { SmartFlowerImage } from "../smart-flower-image"

const GALLERY_SLOT_COUNT = 6

export interface GalleryPhotoItem {
  src: string
  title: string
  caption: string
}

interface LandingTemplateGalleryProps {
  archetypeId?: string | undefined
  photos?: GalleryPhotoItem[] | undefined
}



export function LandingTemplateGallery({
  archetypeId = "minimal-luxury",
  photos,
}: LandingTemplateGalleryProps) {
  const [activePhoto, setActivePhoto] = useState<{ src: string; title: string; caption: string } | null>(null)
  const isLuxury = archetypeId === "minimal-luxury"
  const isRomantic = archetypeId === "pastel-romantic"
  const isFestive = archetypeId === "festive-sale"

  // Không có ảnh thật → ẩn section hoàn toàn
  if (!photos || photos.length === 0) return null

  // Lặp vòng ảnh thật để fill đủ số slot (nếu shop có ít ảnh hơn)
  const displayPhotos: GalleryPhotoItem[] = Array.from(
    { length: Math.min(GALLERY_SLOT_COUNT, Math.max(photos.length, 1)) },
    (_, idx) => photos[idx % photos.length]!
  )

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider">
          <Camera size={14} className={isLuxury || isRomantic ? "text-primary" : isFestive ? "text-danger" : "text-warning"} />
          <span className={isLuxury ? "font-serif" : ""}>
            {isLuxury ? "Triển Lãm Ảnh Tác Phẩm Thực Tế" : "Khoảnh Khắc Hoa Tươi Tại Xưởng"}
          </span>
        </div>
        <span className={`text-caption font-medium ${isLuxury ? "font-serif text-primary" : "text-text-muted"}`}>
          100% Ảnh chụp thực tế
        </span>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {displayPhotos.map((photo, idx) => (
          <button
            type="button"
            key={photo.src}
            onClick={() => setActivePhoto(photo)}
            className={`group relative rounded-2xl overflow-hidden border shadow-xs transition-all text-left block w-full focus:outline-hidden focus:ring-2 focus:ring-primary/40 ${
              isLuxury
                ? "border-primary/20 bg-surface-alt/40 hover:border-primary/60"
                : isFestive
                ? "border-danger/20 bg-surface hover:border-danger"
                : "border-border bg-surface hover:border-primary/60"
            }`}
          >
            <div className="relative aspect-4/3 overflow-hidden bg-surface-alt">
              <SmartFlowerImage
                src={photo.src}
                alt={photo.title}
                aspectRatio="4/3"
                fallbackIndex={idx}
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <ZoomIn size={20} className="drop-shadow-md" />
              </div>
            </div>

            <div className="p-2.5 bg-surface">
              <h5 className={`text-caption font-bold text-text line-clamp-1 group-hover:text-primary transition-colors ${
                isLuxury ? "font-serif" : ""
              }`}>
                {photo.title}
              </h5>
              <p className={`text-caption line-clamp-1 mt-0.5 ${isLuxury ? "font-serif text-text/75 italic" : "text-text-muted"}`}>
                {photo.caption}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop Button */}
          <button
            type="button"
            aria-label="Đóng ảnh xem chi tiết"
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs w-full h-full cursor-default"
          />

          <div className="relative z-10 max-w-lg w-full bg-surface rounded-3xl overflow-hidden shadow-2xl border border-border pointer-events-auto">
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>

            <div className="aspect-4/3 w-full bg-black">
              <SmartFlowerImage
                src={activePhoto.src}
                alt={activePhoto.title}
                aspectRatio="4/3"
              />
            </div>

            <div className="p-4 bg-surface space-y-1">
              <h4 className="text-sm font-bold text-text">{activePhoto.title}</h4>
              <p className="text-xs text-text-muted">{activePhoto.caption}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
