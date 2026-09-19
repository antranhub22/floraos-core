"use client"

import React from "react"
import { Share2, Tag, Layers } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface ProductDetailCardProps {
  code: string
  name: string
  imageUrl: string
  category: string
  price: string
  originalPrice?: string
  stemCount?: number
  occasions?: string[]
  onShareLink?: () => void
  onOrderNow?: () => void
}

/**
 * ProductDetailCard (Thẻ chi tiết sản phẩm catalog M03)
 */
export function ProductDetailCard({
  code,
  name,
  imageUrl,
  category,
  price,
  originalPrice,
  stemCount,
  occasions = [],
  onShareLink,
  onOrderNow,
}: ProductDetailCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{code}</Badge>
          <span className="text-xs font-semibold text-text-muted">{category}</span>
        </div>
        {occasions.length > 0 && (
          <Badge tone="success">{occasions[0]}</Badge>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative aspect-square w-36 h-36 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-alt">
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="text-[17px] font-extrabold text-text">{name}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-primary">{price}</span>
            {originalPrice && (
              <span className="text-xs text-text-muted line-through">{originalPrice}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-text-muted mt-1">
            {stemCount && (
              <span className="flex items-center gap-1 rounded bg-surface-alt px-2 py-0.5 font-medium">
                <Layers size={12} />
                {stemCount} cành hoa
              </span>
            )}
            <span className="flex items-center gap-1 rounded bg-surface-alt px-2 py-0.5 font-medium">
              <Tag size={12} />
              Bao gồm thiệp + banner
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        {onShareLink && (
          <Button variant="secondary" size="sm" onClick={onShareLink} className="gap-1.5">
            <Share2 size={14} />
            Chia sẻ mẫu
          </Button>
        )}
        {onOrderNow && (
          <Button size="sm" onClick={onOrderNow}>
            Tạo đơn ngay
          </Button>
        )}
      </div>
    </Card>
  )
}
