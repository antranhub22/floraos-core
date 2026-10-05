"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { formatVnd } from "./swipe/swipe-card"

interface EnterpriseSpecSheetProps {
  product: GreetingCatalogProduct
  isOpen: boolean
  onClose: () => void
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-4 border-b border-border py-3 last:border-0">
      <dt className="w-24 shrink-0 text-body-sm text-text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-body-sm text-text">{value}</dd>
    </div>
  )
}

/**
 * Bảng chi tiết mẫu hoa (trượt từ dưới lên). Chỉ hiển thị dữ liệu có thật
 * của sản phẩm — không tự thêm kích thước, thành phần hay cam kết.
 */
export function EnterpriseSpecSheet({ product, isOpen, onClose, onSelectProduct }: EnterpriseSpecSheetProps) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="spec-title">
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-200" />
      <div className="relative flex max-h-[92dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] bg-surface text-text shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="relative aspect-[4/3] w-full shrink-0 bg-surface-alt">
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          )}
          <span aria-hidden="true" className="absolute left-1/2 top-2.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/80" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
          <h2 id="spec-title" className="font-serif text-display font-medium leading-tight tracking-tight">
            {product.name}
          </h2>
          <p className="mt-1.5 text-title-sm font-bold text-primary">{formatVnd(product.price)}</p>
          {product.description && <p className="mt-3 text-body leading-relaxed text-text">{product.description}</p>}
          {product.meaning && (
            <blockquote className="mt-4 border-l-2 border-primary pl-3 font-serif text-body italic text-text-muted">
              {product.meaning}
            </blockquote>
          )}
          <dl className="mt-4">
            <Row label="Thành phần" value={product.flowersSummary} />
            <Row label="Dịp tặng" value={product.occasion} />
            <Row label="Phong cách" value={product.style} />
            <Row label="Mã mẫu" value={product.code} />
          </dl>
        </div>

        <div className="shrink-0 border-t border-border px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
          <button
            type="button"
            onClick={() => onSelectProduct(product)}
            className="flex h-12 w-full items-center justify-between rounded-2xl bg-primary px-5 text-body font-bold text-white shadow-md active:scale-[0.99]"
          >
            <span>Đặt mẫu này</span>
            <span className="tabular-nums">{formatVnd(product.price)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
