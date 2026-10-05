"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react"

/** URL ký sẵn có đuôi tệp trong đường dẫn; video nhận theo đuôi. */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)
}

/**
 * Lưới ảnh/video thu nhỏ; bấm vào ô nào thì phóng to xem (vuốt/bấm qua lại, Esc để đóng).
 * Dùng cho ảnh thành phẩm và ảnh người nhận — trang khách lẫn trang điều phối.
 */
export function MediaGallery({ urls, label }: { urls: readonly string[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null)
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % urls.length))
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + urls.length) % urls.length))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, urls.length])

  if (urls.length === 0) return null
  const current = open === null ? null : urls[open]

  return (
    <>
      <ul className="grid grid-cols-3 gap-2" aria-label={label}>
        {urls.map((url, i) => (
          <li key={url}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`${label} — xem ${isVideoUrl(url) ? "video" : "ảnh"} ${i + 1}/${urls.length}`}
              className="relative block aspect-square w-full overflow-hidden rounded-lg border border-border bg-surface-muted"
            >
              {isVideoUrl(url) ? (
                <>
                  <video src={url} muted preload="metadata" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-text/30 text-surface">
                    <Play size={22} aria-hidden="true" />
                  </span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
            </button>
          </li>
        ))}
      </ul>

      {current && open !== null && (
        <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 flex items-center justify-center bg-text/90 p-4">
          <button type="button" aria-label="Đóng" onClick={() => setOpen(null)} className="absolute right-3 top-3 rounded-full bg-surface/20 p-2 text-surface">
            <X size={22} aria-hidden="true" />
          </button>
          {urls.length > 1 && (
            <>
              <button type="button" aria-label="Ảnh trước" onClick={() => setOpen((open - 1 + urls.length) % urls.length)} className="absolute left-2 rounded-full bg-surface/20 p-2 text-surface">
                <ChevronLeft size={24} aria-hidden="true" />
              </button>
              <button type="button" aria-label="Ảnh sau" onClick={() => setOpen((open + 1) % urls.length)} className="absolute right-2 rounded-full bg-surface/20 p-2 text-surface">
                <ChevronRight size={24} aria-hidden="true" />
              </button>
            </>
          )}
          {isVideoUrl(current) ? (
            <video src={current} controls autoPlay playsInline className="max-h-[85dvh] max-w-full rounded-lg" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current} alt={`${label} ${open + 1}`} className="max-h-[85dvh] max-w-full rounded-lg object-contain" />
          )}
          <p className="absolute bottom-4 text-body-sm text-surface">{open + 1}/{urls.length}</p>
        </div>
      )}
    </>
  )
}
