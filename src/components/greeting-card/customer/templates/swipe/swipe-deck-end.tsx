"use client"

import { Heart, RefreshCw, RotateCcw } from "lucide-react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { photoBackdrop } from "./swipe-card"
import { ProductInfo } from "../product-info/product-info"
import { ProductImage } from "../aux/aux-kit"
import { SWIPE_SIGNAL, isLightTheme, type SwipeTheme } from "./swipe-themes"

interface SwipeDeckEndProps {
  theme: SwipeTheme
  liked: GreetingCatalogProduct[]
  total: number
  onOrder: (product: GreetingCatalogProduct) => void
  onRestart: () => void
  onRewind: () => void
}

/** Màn hình khi đã lướt hết: danh sách mẫu đã thích để đặt ngay. */
export function SwipeDeckEnd({ theme, liked, total, onOrder, onRestart, onRewind }: SwipeDeckEndProps) {
  const light = isLightTheme(theme)
  const panel = light ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.06)"
  const line = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)"

  return (
    <section aria-labelledby="deck-end-title" className="flex flex-1 flex-col gap-4 py-2">
      <div className="text-center">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: panel, color: SWIPE_SIGNAL.like }}
        >
          <Heart size={26} fill="currentColor" aria-hidden="true" />
        </span>
        <h2 id="deck-end-title" className="mt-3 text-title font-semibold" style={{ fontFamily: theme.font }}>
          {liked.length > 0 ? `Bạn đã thích ${liked.length} mẫu` : "Bạn đã xem hết bộ sưu tập"}
        </h2>
        <p className="mt-1 text-body-sm" style={{ color: theme.stageMuted }}>
          {liked.length > 0
            ? "Chọn một mẫu để đặt hoa, hoặc xem lại từ đầu."
            : `Chưa có mẫu nào trong ${total} mẫu khiến bạn ưng. Xem lại từ đầu nhé?`}
        </p>
      </div>

      {liked.length > 0 && (
        <ul className="flex flex-col gap-2.5 overflow-y-auto">
          {liked.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl border p-2.5" style={{ background: panel, borderColor: line }}>
              <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <ProductImage product={p} backdrop={photoBackdrop(theme)} />
              </span>
              <ProductInfo product={p} level="compact" size="sm" accent={light ? theme.ctaBg : theme.accent} titleClassName="font-semibold" className="flex-1" />
              <button
                type="button"
                onClick={() => onOrder(p)}
                className="h-11 shrink-0 rounded-xl px-4 text-body-sm font-bold"
                style={{ background: theme.ctaBg, color: theme.ctaText }}
              >
                Đặt mẫu
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRewind}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border text-body-sm font-semibold"
          style={{ borderColor: line }}
        >
          <RotateCcw size={16} aria-hidden="true" />
          Xem lại mẫu cuối
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border text-body-sm font-semibold"
          style={{ borderColor: line }}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Xem lại từ đầu
        </button>
      </div>
    </section>
  )
}
