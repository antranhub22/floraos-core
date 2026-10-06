"use client"

import { useState } from "react"
import { MessageCircle, Sparkles } from "lucide-react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { similarProducts } from "@/modules/greeting-card/domain/collection-browse"
import { formatVnd } from "./swipe-card"
import type { SwipeTheme } from "./swipe-themes"

interface UnavailablePanelProps {
  theme: SwipeTheme
  product: GreetingCatalogProduct
  products: GreetingCatalogProduct[]
  onJump: (productId: string) => void
  onContact?: (() => void) | undefined
}

/** Mẫu đang xem tạm hết hàng: không cho đặt, gợi ý mẫu tương tự hoặc hỏi tiệm. */
export function UnavailablePanel({ theme, product, products, onJump, onContact }: UnavailablePanelProps) {
  const [open, setOpen] = useState(false)
  const similar = similarProducts(product, products)
  return (
    <div className="flex w-full flex-col gap-2" role="status">
      <p className="text-center text-body-sm font-semibold" style={{ color: theme.stageMuted }}>
        Mẫu này đang tạm hết hàng
      </p>
      <div className="grid grid-cols-2 gap-2">
        {similar.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl text-body-sm font-bold"
            style={{ background: theme.ctaBg, color: theme.ctaText }}
          >
            <Sparkles size={16} aria-hidden="true" />
            Xem mẫu tương tự
          </button>
        )}
        {onContact && (
          <button
            type="button"
            onClick={onContact}
            className={`flex h-12 items-center justify-center gap-2 rounded-2xl border text-body-sm font-semibold ${similar.length === 0 ? "col-span-2" : ""}`}
            style={{ borderColor: theme.controlBorder, background: theme.controlBg }}
          >
            <MessageCircle size={16} aria-hidden="true" />
            Liên hệ shop
          </button>
        )}
      </div>
      {open && (
        <ul className="flex flex-col gap-1.5">
          {similar.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onJump(p.id)}
                className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border px-3 text-body-sm"
                style={{ borderColor: theme.controlBorder, background: theme.controlBg }}
              >
                <span className="truncate font-semibold">{p.name}</span>
                <span className="shrink-0 tabular-nums">{formatVnd(p.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
