"use client"

import React, { useState } from "react"
import { CheckCircle2, Wallet } from "lucide-react"
import type { BrochureQuote } from "@/modules/greeting-card/domain/brochure-pricing"

const FIELD = "w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`

/**
 * Ô nhập mã thanh toán (đặt cọc). Khách chỉ nhập MÃ do tiệm cấp — không tự chọn phần trăm.
 * Máy chủ kiểm mã; ô này chỉ hiện kết quả báo giá trả về. Mã thanh toán không giảm giá.
 */
export function PaymentCodeField({
  value,
  onApply,
  quote,
  error,
}: {
  value: string
  onApply: (code: string) => void
  quote: BrochureQuote | null
  error: string | undefined
}) {
  const [input, setInput] = useState(value)
  const plan = quote?.paymentPlan
  const applied = !error && plan?.source === "PAYMENT_CODE" && plan.paymentCode ? plan : null

  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption font-bold text-foreground">Mã thanh toán (đặt cọc)</span>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          maxLength={40}
          placeholder="Nhập mã cửa hàng gửi bạn"
          aria-label="Mã thanh toán"
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          className={FIELD}
        />
        <button
          type="button"
          onClick={() => onApply(input.trim())}
          className="h-10 px-3 rounded-lg border border-primary text-primary font-bold text-body-sm whitespace-nowrap flex items-center gap-1.5"
        >
          <Wallet size={14} /> Áp dụng
        </button>
      </div>
      {error && <span className="text-caption text-danger">{error}</span>}
      {applied && (
        <div role="status" className="rounded-lg bg-success-bg p-2.5 text-caption text-success flex gap-2">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              {applied.depositPercent > 0 ? `Đã áp dụng mã đặt cọc ${applied.depositPercent}%` : "Đã áp dụng mã thanh toán"}
            </p>
            {applied.depositPercent > 0 && applied.dueLaterVnd > 0 && (
              <p className="text-foreground">
                Bạn thanh toán {applied.depositPercent}% hôm nay. {100 - applied.depositPercent}% còn lại sẽ được thanh toán sau khi
                sản phẩm hoàn thành và cửa hàng gửi ảnh xác nhận. Tổng đơn hàng không thay đổi.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Dòng "Thanh toán hôm nay" hoặc "Đặt cọc hôm nay / Thanh toán sau" dưới tổng đơn. */
export function PaymentDueRows({ quote }: { quote: BrochureQuote | null }) {
  const plan = quote?.paymentPlan
  if (!quote || quote.awaitingQuote || !plan) return null
  if (plan.dueLaterVnd <= 0) {
    return (
      <div className="flex justify-between font-bold">
        <dt>Thanh toán hôm nay</dt>
        <dd>{vnd(quote.totalVnd)}</dd>
      </div>
    )
  }
  return (
    <>
      <div className="flex justify-between font-bold">
        <dt>Đặt cọc hôm nay ({plan.depositPercent}%)</dt>
        <dd className="text-primary">{vnd(plan.dueNowVnd)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-text-muted">Thanh toán sau khi hoa hoàn thành</dt>
        <dd>{vnd(plan.dueLaterVnd)}</dd>
      </div>
    </>
  )
}
