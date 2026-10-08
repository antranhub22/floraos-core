"use client"

import React from "react"
import type { PublicAppliedPolicies } from "@/modules/greeting-card/domain/store-policy"
import { customerChoosesPromotion } from "@/modules/greeting-card/domain/order-policies"

/**
 * Khách nhận ĐÚNG 01 ưu đãi (Spec #2): nút radio nên không chọn được hai, không chọn sẵn — khách tự chọn
 * (PO 08/10/2026). Tiệm không cho khách chọn → chỉ hiện ưu đãi đầu tiên (máy chủ cũng ép như vậy).
 */
export function PromotionPicker({
  policies,
  value,
  onChange,
}: {
  policies: PublicAppliedPolicies
  value: string
  onChange: (id: string) => void
}) {
  const promos = policies.promotions
  if (promos.length === 0) return null
  const canChoose = customerChoosesPromotion(policies)
  const shown = canChoose ? promos : promos.slice(0, 1)

  return (
    <fieldset className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex flex-col gap-2">
      <legend className="sr-only">Ưu đãi</legend>
      <div className="text-body-sm font-extrabold text-foreground flex items-center justify-between">
        <span>{canChoose ? `Chọn 01 ưu đãi (${promos.length} lựa chọn)` : "Ưu đãi áp dụng"}</span>
        <span className="text-caption font-normal text-primary">{canChoose && !value ? "Bắt buộc chọn" : "Mỗi đơn 01 ưu đãi"}</span>
      </div>
      {shown.map((p) => (
        <label
          key={p.id}
          className="flex items-start gap-2.5 text-body-sm text-foreground bg-background p-2.5 rounded-lg border border-border cursor-pointer has-[:checked]:border-primary"
        >
          {canChoose && (
            <input
              type="radio"
              name="promotion"
              value={p.id}
              checked={value === p.id}
              onChange={() => onChange(p.id)}
              className="mt-0.5 accent-primary"
            />
          )}
          <span>
            <span className="font-bold text-primary">{p.title}: </span>
            <span>{p.customerText}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
