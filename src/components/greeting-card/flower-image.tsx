"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Flower2 } from "lucide-react"

interface FlowerImageProps {
  src: string | null | undefined
  alt: string
  /** Lớp cho khung bọc (kích thước, bo góc, viền) — ảnh luôn phủ kín khung. */
  className?: string | undefined
  /** Gợi ý độ rộng hiển thị cho trình duyệt chọn tải (vd. "(max-width: 640px) 100vw, 400px"). */
  sizes?: string | undefined
  /** Ảnh nằm ngay màn đầu (thẻ đang xem) — tải sớm, không lazy. */
  priority?: boolean | undefined
  fit?: "cover" | "contain" | undefined
  /** `full` = biểu tượng + chữ (thẻ lớn); `icon` = chỉ biểu tượng (ô nhỏ). */
  fallback?: "full" | "icon" | undefined
  draggable?: boolean | undefined
  /** `absolute` khi ảnh phủ nền một khung đã định vị (thẻ lướt). */
  position?: "relative" | "absolute" | undefined
}

/**
 * Ảnh mẫu hoa dùng chung: `next/image` (lazy-load, `sizes`) + ô thay thế khi
 * chưa có ảnh hoặc ảnh lỗi. `unoptimized` vì ảnh là URL lưu trữ đã ký có hạn
 * (đổi theo phiên) — tối ưu lại qua `/_next/image` vừa phí vừa hết hạn theo.
 */
export function FlowerImage({
  src,
  alt,
  className = "",
  sizes = "100vw",
  priority = false,
  fit = "cover",
  fallback = "full",
  draggable,
  position = "relative",
}: FlowerImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const broken = !src || failedSrc === src

  return (
    <span className={`${position} block overflow-hidden ${className}`}>
      {broken ? (
        <span
          role="img"
          aria-label={`${alt} — chưa có ảnh`}
          className="absolute inset-0 flex flex-col items-center justify-center bg-surface-muted text-text-muted"
        >
          <Flower2 size={fallback === "full" ? 40 : 18} className="text-primary/40" />
          {fallback === "full" && <span className="text-caption mt-1.5">Hình ảnh đang cập nhật</span>}
        </span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized
          draggable={draggable}
          onError={() => setFailedSrc(src)}
          className={fit === "cover" ? "object-cover" : "object-contain"}
        />
      )}
    </span>
  )
}
