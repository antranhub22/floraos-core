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
/**
 * URL proxy thumbnail cho link Drive — thư mục (`/folders/<id>`, lấy ảnh đầu tiên) hoặc
 * tệp (`/file/d/<id>`, `open?id=`, `uc?id=`). Link khác (trang web bán hàng…) → null.
 */
export function driveThumbProxySrc(driveLink: string | null | undefined): string | null {
  if (!driveLink) return null
  const folderId = driveLink.match(/\/folders\/([a-zA-Z0-9_-]{20,})/)?.[1]
  if (folderId) return `/api/v1/public/drive-thumb-proxy?folder_id=${folderId}`
  if (!driveLink.includes("drive.google.com")) return null
  const fileId = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/)?.[1] ?? driveLink.match(/[?&]id=([a-zA-Z0-9_-]{20,})/)?.[1]
  return fileId ? `/api/v1/public/drive-thumb-proxy?file_id=${fileId}` : null
}

export function DriveThumbImage({
  driveLink,
  alt,
  className = "",
  fallback = "icon",
}: DriveThumbImageProps) {
  const [broken, setBroken] = useState(false)

  const proxySrc = driveThumbProxySrc(driveLink)

  if (!proxySrc || broken) {
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
