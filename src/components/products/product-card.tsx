"use client"

import React from "react"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { ProductThumb } from "@/components/products/product-thumb"

export type ProductItem = {
  id: string
  name: string
  code: string
  category: string | null
  shape: string | null
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  masterImageUrl?: string | undefined
  driveLink?: string | undefined
  price_vnd: number | null
  attributes?: Record<string, unknown> | null | undefined
}

export function StatusBadge({ status }: { status: ProductItem["status"] }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-caption font-bold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
        Đang bán
      </span>
    )
  }
  if (status === "ARCHIVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-caption font-bold text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
        Lưu trữ
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2 py-0.5 text-caption font-bold text-text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-text-muted" aria-hidden="true" />
      Nháp
    </span>
  )
}

export function PriceLabel({ price }: { price: number | null }) {
  if (price === null) {
    return <span className="text-caption text-text-muted italic">Liên hệ báo giá</span>
  }
  return (
    <span className="text-caption font-semibold text-primary">
      {price.toLocaleString("vi-VN")}đ
    </span>
  )
}

export interface ProductCardProps {
  product: ProductItem
  isExecutive?: boolean
  onTrash?: (product: ProductItem) => void
}

export function ProductCard({ product, isExecutive, onTrash }: ProductCardProps) {
  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-surface overflow-hidden transition-all hover:border-primary/40 hover:shadow-md relative">
      <Link
        href={`/san-pham/${product.id}` as never}
        className="flex flex-col flex-1 focus-visible:outline-2 focus-visible:outline-primary"
      >
        {/* Ảnh sản phẩm */}
        <div className="relative aspect-square w-full bg-surface-alt overflow-hidden">
          <ProductThumb
            name={product.name}
            masterImageUrl={product.masterImageUrl}
            driveLink={product.driveLink}
            size="card"
          />
          <div className="absolute top-2 left-2">
            <StatusBadge status={product.status} />
          </div>
        </div>

        {/* Thông tin */}
        <div className="flex flex-col gap-1 p-3">
          <div className="truncate text-body-sm font-bold text-text">{product.name}</div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-caption text-text-muted">
              {product.category ?? "Chưa phân loại"}
            </span>
            <PriceLabel price={product.price_vnd} />
          </div>
          <div className="mt-1 text-caption text-text-muted font-mono">#{product.code}</div>
        </div>
      </Link>

      {/* Nút xóa – chỉ Điều hành */}
      {isExecutive && onTrash && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onTrash(product)
          }}
          aria-label={`Chuyển "${product.name}" vào thùng rác`}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 text-white hover:bg-danger hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-danger"
          title="Xóa sản phẩm (Chỉ Điều hành)"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}
