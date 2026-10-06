"use client"

import React, { useEffect, useRef } from "react"
import { X } from "lucide-react"

interface SheetProps {
  title: React.ReactNode
  labelId: string
  onClose: () => void
  /** Nút bên trái tiêu đề (vd. "Quay lại"). */
  leading?: React.ReactNode
  /** Vùng cố định dưới cùng (vd. ô soạn tin). */
  footer?: React.ReactNode
  children: React.ReactNode
}

/**
 * Bảng trượt mobile-first: toàn màn hình trên điện thoại, bảng bên phải trên màn rộng.
 * Đóng bằng Esc / nút X / chạm nền; khoá cuộn trang; trả focus về nút đã mở khi đóng.
 */
export function Sheet({ title, labelId, onClose, leading, footer, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-60 flex justify-end" role="dialog" aria-modal="true" aria-labelledby={labelId}>
      <button type="button" aria-label="Đóng" tabIndex={-1} onClick={onClose} className="absolute inset-0 hidden bg-black/40 md:block" />
      <div ref={panelRef} className="relative flex h-dvh w-full flex-col bg-bg shadow-2xl md:max-w-md md:border-l md:border-border">
        <header className="flex min-h-14 items-center gap-1 border-b border-border bg-surface px-2 pt-[env(safe-area-inset-top)]">
          {leading}
          <h2 id={labelId} className="min-w-0 flex-1 truncate px-2 text-title-sm font-extrabold text-foreground">{title}</h2>
          <button type="button" data-autofocus onClick={onClose} aria-label="Đóng"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">{footer}</div>}
      </div>
    </div>
  )
}
