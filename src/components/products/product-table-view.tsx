"use client"

import React from "react"
import Link from "next/link"
import { Eye, Sparkles, Trash2 } from "lucide-react"
import { ProductThumb } from "@/components/products/product-thumb"
import { PriceLabel, type ProductItem, StatusBadge } from "@/components/products/product-card"

export interface ProductTableViewProps {
  products: ProductItem[]
  isExecutive?: boolean
  onTrash?: (product: ProductItem) => void
}

export function ProductTableView({ products, isExecutive, onTrash }: ProductTableViewProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-body-sm">
        <thead className="border-b border-border bg-surface-alt text-caption font-bold uppercase tracking-wider text-text-muted">
          <tr>
            <th scope="col" className="px-4 py-3">Sản phẩm</th>
            <th scope="col" className="px-4 py-3">Danh mục</th>
            <th scope="col" className="px-4 py-3">Giá</th>
            <th scope="col" className="px-4 py-3">Trạng thái</th>
            <th scope="col" className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-surface-alt/50">
              <td className="px-4 py-3 font-semibold text-text">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-surface-alt border border-border">
                    <ProductThumb
                      name={p.name}
                      masterImageUrl={p.masterImageUrl}
                      driveLink={p.driveLink}
                      size="row"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-text">{p.name}</div>
                    <div className="text-caption text-text-muted font-mono">#{p.code}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-caption text-text">{p.category ?? "—"}</td>
              <td className="px-4 py-3">
                <PriceLabel price={p.price_vnd} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/san-pham/${p.id}` as never}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-caption font-semibold text-text-muted hover:bg-surface-alt hover:text-text transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                    title="Xem chi tiết"
                  >
                    <Eye size={13} />
                    <span>Chi tiết</span>
                  </Link>
                  <Link
                    href={`/san-pham/${p.id}/tinh-nang` as never}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-caption font-semibold text-text hover:border-primary/40 hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                    title="Mở Studio Tính Năng"
                  >
                    <Sparkles size={13} />
                    <span>Studio</span>
                  </Link>
                  {isExecutive && onTrash && (
                    <button
                      type="button"
                      onClick={() => onTrash(p)}
                      aria-label={`Xóa ${p.name}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-caption font-semibold text-text-muted hover:bg-danger-bg hover:text-danger transition-colors focus-visible:outline-2 focus-visible:outline-danger"
                      title="Chuyển vào thùng rác (Chỉ Điều hành)"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
