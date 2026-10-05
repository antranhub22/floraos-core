"use client"

import { useState } from "react"
import useSWR from "swr"
import { readApiError } from "@/components/greeting-card/api-error"
import type { BrochureQuote } from "@/modules/greeting-card/domain/brochure-pricing"

export interface QuoteSelection {
  variantId: string
  quantity: number
  shippingZoneId: string
  voucherCode: string
}

interface QuoteResponse {
  quote: BrochureQuote
  errors: Record<string, string>
}

async function postQuote([url, body]: readonly [string, string]): Promise<QuoteResponse> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body })
  if (!res.ok) throw new Error(await readApiError(res, "Không tính được giá, vui lòng thử lại"))
  return (await res.json()) as QuoteResponse
}

/**
 * Lựa chọn mua + báo giá từ server (SWR khoá theo lựa chọn — đổi lựa chọn là
 * hỏi lại, kết quả cũ được giữ trong lúc chờ để tổng tiền không nhấp nháy).
 * Mã giảm giá chỉ gửi khi khách bấm "Áp dụng".
 */
export function useBrochureQuote(quoteUrl: string, extraBody: Record<string, string>, customerPhone: string) {
  const [selection, setSelection] = useState<QuoteSelection>({
    variantId: "",
    quantity: 1,
    shippingZoneId: "",
    voucherCode: "",
  })

  const body = JSON.stringify({
    ...extraBody,
    quantity: selection.quantity,
    ...(selection.variantId ? { variantId: selection.variantId } : {}),
    ...(selection.shippingZoneId ? { shippingZoneId: selection.shippingZoneId } : {}),
    ...(selection.voucherCode ? { voucherCode: selection.voucherCode, customerPhone } : {}),
  })
  const swr = useSWR([quoteUrl, body] as const, postQuote, { keepPreviousData: true, revalidateOnFocus: false })

  return {
    selection,
    update: (patch: Partial<QuoteSelection>) => setSelection((prev) => ({ ...prev, ...patch })),
    quote: swr.data?.quote ?? null,
    errors: swr.data?.errors ?? {},
    loading: swr.isValidating,
    error: swr.error as Error | undefined,
  }
}
