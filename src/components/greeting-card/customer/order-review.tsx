"use client"

import { ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BrochureQuote } from "@/modules/greeting-card/domain/brochure-pricing"
import type { CustomerOrderSubmitInput, ProductSnapshot } from "@/modules/greeting-card/domain/greeting-card-types"
import { PrivacyNotice } from "./privacy-notice"

const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-body-sm text-text-muted">{label}</dt>
      <dd className={`text-right text-body-sm ${strong ? "font-extrabold text-primary" : "font-semibold text-foreground"}`}>{value}</dd>
    </div>
  )
}

/** "dd/mm/yyyy" từ "yyyy-mm-dd" (ngày giao khách đã chọn). */
function viDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  return y && m && d ? `${d}/${m}/${y}` : iso
}

/**
 * Bước "Xem lại đơn" trước khi gửi: khách kiểm mẫu, số tiền, người nhận, ngày giờ giao
 * rồi mới xác nhận — tránh đặt nhầm và đúng chuẩn giao kết hợp đồng trực tuyến.
 */
export function OrderReview(props: {
  product: ProductSnapshot
  variantName: string | null
  input: CustomerOrderSubmitInput
  quote: BrochureQuote | null
  submitting: boolean
  error: string | null
  onEdit: () => void
  onConfirm: () => void
}) {
  const { product, input, quote } = props
  const awaitingQuote = quote?.awaitingQuote || (quote?.totalVnd ?? product.price) <= 0

  return (
    <section aria-labelledby="order-review-title" className="flex flex-col gap-4">
      <h2 id="order-review-title" className="text-title font-extrabold text-foreground">
        Xem lại đơn trước khi đặt
      </h2>

      <dl className="rounded-xl border border-border bg-surface-muted px-4 py-2 divide-y divide-border">
        <Row label="Mẫu hoa" value={props.variantName ? `${product.name} · ${props.variantName}` : product.name} />
        {quote && quote.quantity > 1 && <Row label="Số lượng" value={String(quote.quantity)} />}
        {quote && !awaitingQuote && <Row label="Tạm tính" value={vnd(quote.subtotalVnd)} />}
        {quote && quote.discountVnd > 0 && <Row label={`Giảm giá${quote.voucherCode ? ` (${quote.voucherCode})` : ""}`} value={`− ${vnd(quote.discountVnd)}`} />}
        {quote?.shippingZone && (
          <Row label={`Phí giao (${quote.shippingZone.name})`} value={quote.shippingFeeVnd > 0 ? vnd(quote.shippingFeeVnd) : "Miễn phí"} />
        )}
        <Row label="Tổng thanh toán" value={awaitingQuote ? "Cửa hàng báo giá sau" : vnd(quote?.totalVnd ?? product.price)} strong />
      </dl>

      <dl className="rounded-xl border border-border px-4 py-2 divide-y divide-border">
        <Row label="Người đặt" value={`${input.customerName} · ${input.customerPhone}`} />
        <Row label="Người nhận" value={`${input.recipientName} · ${input.recipientPhone}`} />
        <Row label="Giao lúc" value={`${viDate(input.deliveryDate)} · ${input.deliveryTimeSlot ?? ""}`} />
        <Row label="Địa chỉ" value={input.deliveryAddress} />
        {input.cardMessage?.trim() && <Row label="Lời nhắn thiệp" value={`“${input.cardMessage.trim()}”`} />}
      </dl>

      {props.error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger-bg p-3 text-body-sm text-danger">
          {props.error}
        </p>
      )}

      <Button type="button" onClick={props.onConfirm} disabled={props.submitting} className="h-12 w-full gap-2 rounded-xl text-body font-extrabold">
        <Check size={18} aria-hidden="true" />
        {props.submitting ? "Đang gửi đơn hàng..." : awaitingQuote ? "Xác nhận gửi đơn" : "Xác nhận đặt hoa & thanh toán"}
      </Button>
      <PrivacyNotice />
      <Button type="button" variant="ghost" onClick={props.onEdit} disabled={props.submitting} className="gap-1.5 text-text-muted">
        <ArrowLeft size={16} aria-hidden="true" />
        Sửa thông tin
      </Button>
    </section>
  )
}
