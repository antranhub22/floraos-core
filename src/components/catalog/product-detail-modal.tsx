"use client"

import React from "react"
import {
  Phone,
  MessageCircle,
  Tag,
  Layers,
  Check,
  Flower2,
} from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import type { PublicCatalogProduct, PublicCatalogShop } from "@/modules/catalog-links/use-cases/get-public-catalog"
import { SmartFlowerImage } from "./smart-flower-image"

interface ProductDetailModalProps {
  product: PublicCatalogProduct
  shop: PublicCatalogShop
  onClose: () => void
}

function formatVnd(amount: number | null) {
  if (!amount) return "Liên hệ báo giá"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
}

function getZaloUrl(product: PublicCatalogProduct, shop: PublicCatalogShop) {
  const phone = shop.phone ? shop.phone.replace(/[^0-9]/g, "") : ""
  const priceText = product.price ? formatVnd(product.price) : "chưa có giá"
  const text = encodeURIComponent(
    `Chào ${shop.name}, tôi muốn tư vấn & đặt mẫu hoa: ${product.name} (Mã: ${product.code}, Giá: ${priceText}).`
  )
  return phone ? `https://zalo.me/${phone}?text=${text}` : `https://zalo.me/?text=${text}`
}

export { formatVnd, getZaloUrl }

export function ProductDetailModal({ product, shop, onClose }: ProductDetailModalProps) {
  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={product.name}
      description={`Mã sản phẩm: ${product.code}`}
      size="md"
      footer={
        <div className="flex w-full items-center gap-2.5">
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-text hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Phone size={15} /> Gọi Hotline
            </a>
          )}
          <a
            href={getZaloUrl(product, shop)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-xs hover:bg-primary-dark transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          >
            <MessageCircle size={18} /> Nhắn tin Zalo đặt mẫu này
          </a>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Product Image */}
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-surface-alt shrink-0">
          <SmartFlowerImage
            src={product.imageUrl}
            alt={product.name}
            aspectRatio="4/3"
            className="rounded-xl"
          />
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-primary">{formatVnd(product.price)}</span>
          <span className="text-xs text-text-muted">Đã bao gồm thuế & thiệp chúc mừng</span>
        </div>

        {product.description && (
          <p className="rounded-xl border border-border bg-surface-alt p-3.5 text-sm text-text-muted leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Attributes */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {product.category && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <Tag size={15} className="text-primary" />
              <div>
                <div className="text-caption text-text-muted">Danh mục</div>
                <div className="font-bold text-text">{product.category}</div>
              </div>
            </div>
          )}
          {product.stemCount && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <Layers size={15} className="text-primary" />
              <div>
                <div className="text-caption text-text-muted">Định lượng</div>
                <div className="font-bold text-text">{product.stemCount} cành</div>
              </div>
            </div>
          )}
        </div>

        {/* Guarantees */}
        <div className="space-y-2 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-success shrink-0" />
            Cam kết hoa tươi từ 3 – 5 ngày khi cắm xốp chuyên dụng
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-success shrink-0" />
            Tặng kèm thiệp thiết kế & banner in màu cao cấp
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-success shrink-0" />
            Chụp ảnh thành phẩm gửi khách duyệt trước khi giao
          </div>
        </div>
      </div>
    </Dialog>
  )
}
