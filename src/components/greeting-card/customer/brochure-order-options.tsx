"use client"

import React, { useState } from "react"
import { Minus, Plus, Ticket } from "lucide-react"
import type { ShippingConfig, BrochureQuote } from "@/modules/greeting-card/domain/brochure-pricing"
import { MAX_ORDER_QUANTITY } from "@/modules/greeting-card/domain/brochure-pricing"
import type { QuoteSelection } from "./use-brochure-quote"

interface Props {
  variants: Array<{ id: string; name: string; priceVnd: number }>
  basePrice: number
  shipping: ShippingConfig
  selection: QuoteSelection
  onChange: (patch: Partial<QuoteSelection>) => void
  quote: BrochureQuote | null
  errors: Record<string, string>
  loading: boolean
}

const FIELD = "w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`

/** Size, số lượng, khu vực giao, mã giảm giá + bảng tổng tiền do server tính. */
export function BrochureOrderOptions({ variants, basePrice, shipping, selection, onChange, quote, errors, loading }: Props) {
  const [voucherInput, setVoucherInput] = useState(selection.voucherCode)

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl border border-border bg-surface-muted/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {variants.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-caption font-bold text-foreground">Kích thước / Phiên bản</span>
            <select value={selection.variantId} onChange={(e) => onChange({ variantId: e.target.value })} className={FIELD}>
              <option value="">Bản tiêu chuẩn — {basePrice > 0 ? vnd(basePrice) : "Liên hệ"}</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>{v.name} — {vnd(v.priceVnd)}</option>
              ))}
            </select>
            {errors.variantId && <span className="text-caption text-danger">{errors.variantId}</span>}
          </label>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-caption font-bold text-foreground" id="qty-label">Số lượng</span>
          <div className="flex items-center gap-2" role="group" aria-labelledby="qty-label">
            <button
              type="button"
              aria-label="Giảm số lượng"
              disabled={selection.quantity <= 1}
              onClick={() => onChange({ quantity: selection.quantity - 1 })}
              className="h-10 w-10 rounded-lg border border-border flex items-center justify-center disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <span className="w-10 text-center font-extrabold text-body" aria-live="polite">{selection.quantity}</span>
            <button
              type="button"
              aria-label="Tăng số lượng"
              disabled={selection.quantity >= MAX_ORDER_QUANTITY}
              onClick={() => onChange({ quantity: selection.quantity + 1 })}
              className="h-10 w-10 rounded-lg border border-border flex items-center justify-center disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {shipping.zones.length > 0 && (
        <label className="flex flex-col gap-1">
          <span className="text-caption font-bold text-foreground">Khu vực giao hoa <span className="text-danger">*</span></span>
          <select value={selection.shippingZoneId} onChange={(e) => onChange({ shippingZoneId: e.target.value })} className={FIELD}>
            <option value="">— Chọn khu vực —</option>
            {shipping.zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name} — {z.feeVnd > 0 ? vnd(z.feeVnd) : "Miễn phí"}</option>
            ))}
          </select>
          {shipping.freeShippingOverVnd !== null && (
            <span className="text-caption text-text-muted">Miễn phí giao cho đơn từ {vnd(shipping.freeShippingOverVnd)}</span>
          )}
        </label>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-caption font-bold text-foreground">Mã giảm giá</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={voucherInput}
            maxLength={40}
            placeholder="VD: FLORA10"
            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
            className={FIELD}
          />
          <button
            type="button"
            onClick={() => onChange({ voucherCode: voucherInput.trim() })}
            className="h-10 px-3 rounded-lg border border-primary text-primary font-bold text-body-sm whitespace-nowrap flex items-center gap-1.5"
          >
            <Ticket size={14} /> Áp dụng
          </button>
        </div>
        {errors.voucherCode && <span className="text-caption text-danger">{errors.voucherCode}</span>}
      </div>

      {quote?.awaitingQuote ? (
        <p role="status" className="text-body-sm text-text-muted border-t border-border pt-2">
          Mẫu này chưa niêm yết giá. Cửa hàng sẽ báo giá trọn gói (gồm phí giao) sau khi nhận đơn — bạn chưa cần thanh toán lúc này.
        </p>
      ) : (
        <dl className="flex flex-col gap-1 text-body-sm border-t border-border pt-2" aria-busy={loading}>
          <div className="flex justify-between"><dt className="text-text-muted">Tạm tính</dt><dd>{quote ? vnd(quote.subtotalVnd) : "—"}</dd></div>
          {quote && quote.discountVnd > 0 && (
            <div className="flex justify-between text-success"><dt>Giảm giá ({quote.voucherCode})</dt><dd>−{vnd(quote.discountVnd)}</dd></div>
          )}
          <div className="flex justify-between">
            <dt className="text-text-muted">Phí giao hoa</dt>
            <dd>{shipping.zones.length === 0 ? "Cửa hàng báo sau" : quote?.shippingZone ? (quote.shippingFeeVnd > 0 ? vnd(quote.shippingFeeVnd) : "Miễn phí") : "—"}</dd>
          </div>
          {quote?.holidaySurchargeVnd ? (
            <div className="flex justify-between"><dt className="text-text-muted">Phụ phí ngày lễ ({quote.holidayName})</dt><dd>+{vnd(quote.holidaySurchargeVnd)}</dd></div>
          ) : null}
          <div className="flex justify-between font-extrabold text-body">
            <dt>Tổng thanh toán</dt>
            <dd className="text-primary">{quote ? vnd(quote.totalVnd) : "—"}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
