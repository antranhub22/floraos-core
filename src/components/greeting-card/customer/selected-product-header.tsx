import React from "react"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import type { ProductSnapshot } from "@/modules/greeting-card/domain/greeting-card-types"

/** Thẻ "Mẫu đã chọn" đầu form đặt hoa. */
export function SelectedProductHeader({ product }: { product: ProductSnapshot }) {
  return (
    <div className="flex items-center gap-3.5 p-3 rounded-xl bg-surface-muted border border-border mb-5">
      <FlowerImage src={product.imageUrl} driveLink={product.driveLink} alt={product.name} sizes="64px" fallback="icon" className="w-16 h-16 rounded-lg shrink-0 border border-border" />
      <div className="flex-1 min-w-0">
        <div className="text-caption text-text-muted">Mẫu đã chọn:</div>
        <div className="text-body font-extrabold text-foreground truncate">{product.name}</div>
        <div className="text-body-sm font-extrabold text-primary">
          {product.price > 0 ? `${product.price.toLocaleString("vi-VN")} đ` : "Liên hệ"}
        </div>
      </div>
    </div>
  )
}
