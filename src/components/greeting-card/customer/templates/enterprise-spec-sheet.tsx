"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { formatVnd } from "./product-info/product-display"
import { ProductImage } from "./aux/aux-kit"
import { ProductInfo } from "./product-info/product-info"

interface EnterpriseSpecSheetProps {
  product: GreetingCatalogProduct
  isOpen: boolean
  onClose: () => void
  onSelectProduct: (product: GreetingCatalogProduct) => void
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
          <ProductImage product={product} />
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
          <ProductInfo
            product={product}
            level="full"
            size="lg"
            as="h2"
            id="spec-title"
            muted="var(--color-text-muted)"
            titleClassName="font-serif text-display font-medium tracking-tight"
          />
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
