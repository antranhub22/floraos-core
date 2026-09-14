"use client"

import React, { forwardRef } from "react"
import {
  Sparkles,
  Tag,
  Gift,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SalesPitchData } from "@/modules/products/domain/sales-pitch-template"
import { formatCurrencyVnd } from "@/core/templates/domain/variable-catalog"

export interface SalesPitchCardA6Props {
  activePitch: SalesPitchData
  status?: "DRAFT" | "FINALIZED"
  className?: string
}

/**
 * Template Thẻ Chào Khách A6 Trực Quan (Chức năng Phân tích ảnh sản phẩm & Bán hàng)
 * Tỷ lệ chuẩn A6 105x148mm, hỗ trợ chụp canvas xuất ảnh Retina 2x & PDF in ấn.
 */
export const SalesPitchCardA6 = forwardRef<HTMLDivElement, SalesPitchCardA6Props>(
  function SalesPitchCardA6({ activePitch, status = "DRAFT", className }, ref) {
    return (
      <Card
        ref={ref}
        className={`overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-lg transition-all duration-300 hover:shadow-xl ${className ?? ""}`}
      >
        {/* Card Image Cover with Badges */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-alt">
          {activePitch.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activePitch.imageUrl}
              alt={activePitch.productName}
              className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-text-muted gap-2">
              <Sparkles size={32} className="opacity-40" />
              <span className="text-xs">Ảnh sản phẩm chất lượng cao</span>
            </div>
          )}

          {/* Floating Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Badge className="bg-black/65 text-white backdrop-blur-md font-semibold text-[11px] border-none shadow-sm">
              {activePitch.style}
            </Badge>
            {activePitch.sku && (
              <Badge className="bg-white/85 text-black backdrop-blur-md font-bold text-[10px] border-none font-mono">
                {activePitch.sku}
              </Badge>
            )}
          </div>

          {/* Status Ribbon */}
          {status === "FINALIZED" && (
            <div className="absolute right-3 top-3">
              <Badge className="bg-emerald-600 text-white font-bold text-[11px] gap-1 shadow-md border-none">
                <CheckCircle2 size={12} strokeWidth={2.5} />
                FINAL
              </Badge>
            </div>
          )}

          {/* Price Banner overlay at bottom of image */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white flex items-end justify-between">
            <div>
              <div className="text-[11px] text-white/80 font-medium uppercase tracking-wider">Mức giá chào ưu đãi</div>
              <div className="text-2xl font-black tracking-tight text-white flex items-baseline gap-2">
                {formatCurrencyVnd(activePitch.priceVnd)}
                {activePitch.originalPriceVnd && activePitch.priceVnd && activePitch.originalPriceVnd > activePitch.priceVnd && (
                  <span className="text-xs text-white/60 line-through font-normal">
                    {formatCurrencyVnd(activePitch.originalPriceVnd)}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-white/70 font-mono">Kích thước chuẩn</div>
              <div className="text-xs font-bold text-white/95">
                ~{activePitch.dimensions.heightCm} × {activePitch.dimensions.widthCm} cm
              </div>
            </div>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Title & Occasions */}
          <div>
            <h3 className="text-lg font-extrabold text-text tracking-tight leading-snug">
              {activePitch.productName}
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {activePitch.occasions.map((occ, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
                >
                  <Tag size={10} />
                  {occ}
                </span>
              ))}
            </div>
          </div>

          {/* Emotional Description */}
          <p className="text-[12.5px] text-text-muted italic border-l-2 border-primary/40 pl-3 leading-relaxed">
            &ldquo;{activePitch.description}&rdquo;
          </p>

          {/* Composition / BOM Table */}
          <div className="rounded-xl bg-surface-alt p-3.5 border border-border/60">
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Cấu phần hoa & vật liệu</span>
              <span className="text-[10px] font-normal text-text-muted">{activePitch.container}</span>
            </div>

            <div className="flex flex-col gap-1.5 divide-y divide-border/40 text-[12.5px]">
              {activePitch.mainFlowers.map((flower, idx) => (
                <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                  <span className="font-semibold text-text flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {flower.name}
                    {flower.color && (
                      <span className="text-[11px] font-normal text-text-muted">({flower.color})</span>
                    )}
                  </span>
                  <span className="font-bold text-text font-mono">
                    {flower.quantity ? `${flower.quantity} ${flower.unit}` : "Theo thiết kế"}
                  </span>
                </div>
              ))}

              {activePitch.foliageItems.length > 0 && (
                <div className="pt-1.5 flex items-center justify-between text-[11.5px] text-text-muted">
                  <span>Lá đệm phụ:</span>
                  <span className="font-medium text-text">
                    {activePitch.foliageItems.map((f) => f.name).join(", ")}
                  </span>
                </div>
              )}

              <div className="pt-1.5 flex items-center justify-between text-[11.5px] text-text-muted">
                <span>Quy cách gói:</span>
                <span className="font-medium text-text truncate max-w-[200px]">{activePitch.wrapping}</span>
              </div>
            </div>
          </div>

          {/* Gifts & Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl bg-primary/[0.04] p-2.5 border border-primary/15">
              <div className="font-bold text-primary flex items-center gap-1 mb-1">
                <Gift size={12} /> Quà tặng đính kèm
              </div>
              <ul className="space-y-0.5 text-text-muted">
                {activePitch.freeGifts.map((g, i) => (
                  <li key={i} className="truncate">• {g}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-emerald-500/[0.04] p-2.5 border border-emerald-500/15">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1">
                <ShieldCheck size={12} /> Cam kết chất lượng
              </div>
              <ul className="space-y-0.5 text-text-muted">
                {activePitch.guarantees.slice(0, 2).map((g, i) => (
                  <li key={i} className="truncate">• {g}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Custom note if present */}
          {activePitch.customNote && (
            <div className="text-[11.5px] rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-amber-900 dark:text-amber-200">
              <strong>Ưu đãi riêng:</strong> {activePitch.customNote}
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
            <span>{activePitch.shopName}</span>
            <span>Hotline: {activePitch.shopHotline}</span>
          </div>
        </div>
      </Card>
    )
  }
)
