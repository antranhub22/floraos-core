"use client"

import { useState } from "react"
import { Flower2 } from "lucide-react"

interface DriveThumbImageProps {
  driveLink: string
  alt: string
  className?: string
  /** `full` = biểu tượng + chữ (ô lớn); `icon` = chỉ biểu tượng (ô nhỏ). */
  fallback?: "full" | "icon"
}

/**
 * Hiển thị thumbnail của thư mục Google Drive qua proxy nội bộ
 * `/api/v1/public/drive-thumb-proxy?folder_id=...`.
 *
 * Server tự fetch lh3.googleusercontent.com nên browser không cần auth Google.
 * Không cần state async — URL proxy được tính toán đồng bộ từ driveLink.
 */
function getFolderIdFromLink(driveLink: string): string | null {
  const m = driveLink.match(/folders\/([a-zA-Z0-9_-]{20,})/)
  return m?.[1] ?? null
}

/** URL proxy thumbnail cho link folder Drive; không phải link folder → null. */
export function driveThumbProxySrc(driveLink: string | null | undefined): string | null {
  const folderId = driveLink ? getFolderIdFromLink(driveLink) : null
  return folderId ? `/api/v1/public/drive-thumb-proxy?folder_id=${folderId}` : null
}

export function DriveThumbImage({
  driveLink,
  alt,
  className = "",
  fallback = "icon",
}: DriveThumbImageProps) {
  const [broken, setBroken] = useState(false)

  const folderId = getFolderIdFromLink(driveLink)

  if (!folderId || broken) {
    return (
      <span className={`relative block overflow-hidden ${className}`}>
        <span
          role="img"
          aria-label={`${alt} — chưa có ảnh`}
          className="absolute inset-0 flex flex-col items-center justify-center bg-surface-muted text-text-muted"
        >
          <Flower2 size={fallback === "full" ? 40 : 18} className="text-primary/40" />
          {fallback === "full" && (
            <span className="text-caption mt-1.5">Hình ảnh đang cập nhật</span>
          )}
        </span>
      </span>
    )
  }

  const proxySrc = driveThumbProxySrc(driveLink)!

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={proxySrc}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </span>
  )
}
