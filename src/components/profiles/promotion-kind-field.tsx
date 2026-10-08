"use client"

import React from "react"
import { PROMOTION_KINDS, PROMOTION_KIND_LABEL, promotionPricingOf, type PromotionKind } from "@/modules/greeting-card/domain/promotion-pricing"
import type { PromotionItem } from "@/modules/greeting-card/domain/store-policy"

/**
 * Loại tính tiền của một ưu đãi: "Giảm %" trừ thật trên tổng đơn, "Miễn phí giao" đưa phí giao về 0,
 * "Tặng kèm" không đổi tiền (xưởng làm theo ghi chú). Máy chủ tự tính, khách không sửa được.
 */
export function PromotionKindField({ item, onChange }: { item: PromotionItem; onChange: (patch: Partial<PromotionItem>) => void }) {
  const pricing = promotionPricingOf(item)
  const setKind = (kind: PromotionKind) =>
    onChange(kind === "PERCENT_OFF" ? { kind, config: { ...item.config, percent: pricing.percent ?? 10 } } : { kind })
  return (
    <div className="flex flex-wrap items-center gap-2 text-caption">
      <select
        aria-label="Loại ưu đãi"
        value={pricing.kind}
        onChange={(e) => setKind(e.target.value as PromotionKind)}
        className="h-8 rounded-lg border border-border bg-background px-2 text-caption text-foreground"
      >
        {PROMOTION_KINDS.map((k) => (
          <option key={k} value={k}>{PROMOTION_KIND_LABEL[k]}</option>
        ))}
      </select>
      {pricing.kind === "PERCENT_OFF" && (
        <label className="flex items-center gap-1 text-text-muted">
          <input
            inputMode="numeric"
            aria-label="Phần trăm giảm"
            value={String(pricing.percent ?? "")}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, ""))
              onChange({ config: { ...item.config, percent: Math.min(100, Math.max(1, n || 1)) } })
            }}
            className="h-8 w-14 rounded-lg border border-border bg-background px-2 text-caption text-foreground"
          />
          <span>% trên tổng đơn</span>
        </label>
      )}
    </div>
  )
}
