"use client"

import React from "react"
import { Info } from "lucide-react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"

interface EnterpriseFrostedCardProps {
  product: GreetingCatalogProduct
  onOpenSpecSheet: () => void
}

export function EnterpriseFrostedCard({
  product,
  onOpenSpecSheet,
}: EnterpriseFrostedCardProps) {
  return (
    <div className="relative z-10 m-3 p-4 rounded-2xl bg-black/55 backdrop-blur-md border border-white/20 text-white shadow-2xl flex flex-col gap-2 pointer-events-none">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-body font-extrabold text-white line-clamp-1">{product.name}</h2>
          <div className="flex items-center gap-2 mt-0.5 text-caption text-white/80">
            <span>Mã: {product.code}</span>
            <span>·</span>
            <span className="text-accent font-semibold">Tươi mới trong ngày</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-title font-extrabold text-warning whitespace-nowrap">
            {product.price.toLocaleString("vi-VN")} đ
          </span>
        </div>
      </div>

      {/* Spec Sheet trigger button */}
      <div className="pt-2 border-t border-white/15 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenSpecSheet()
          }}
          className="inline-flex items-center gap-1 text-caption font-bold text-white hover:text-warning transition-colors pointer-events-auto cursor-pointer"
        >
          <Info size={13} />
          <span>Xem chi tiết hoa & cam kết</span>
        </button>
        <span className="text-caption text-white/60">Chạm đúp để thả tim ❤️</span>
      </div>
    </div>
  )
}
