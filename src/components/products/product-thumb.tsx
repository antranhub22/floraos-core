"use client"

import { ImageOff } from "lucide-react"
import { DriveThumbImage } from "@/components/greeting-card/drive-thumb-image"

type Props = {
  name: string
  masterImageUrl?: string | undefined
  driveLink?: string | undefined
  size: "card" | "row"
}

/** Ảnh sản phẩm: ảnh lưu trữ → thumbnail Google Drive → ô "Chưa có ảnh". */
export function ProductThumb({ name, masterImageUrl, driveLink, size }: Props) {
  const imgClass = size === "card"
    ? "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    : "h-full w-full object-cover"
  if (masterImageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={masterImageUrl} alt={name} className={imgClass} loading="lazy" />
  }
  if (driveLink) return <DriveThumbImage driveLink={driveLink} alt={name} className="h-full w-full" fallback={size === "card" ? "full" : "icon"} />
  return size === "card" ? (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-text-muted">
      <ImageOff size={28} strokeWidth={1.5} />
      <span className="text-caption">Chưa có ảnh</span>
    </div>
  ) : (
    <div className="flex h-full w-full items-center justify-center text-text-muted">
      <ImageOff size={16} strokeWidth={1.5} />
    </div>
  )
}
