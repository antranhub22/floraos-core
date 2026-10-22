"use client"

import React from "react"
import { readDeliveryFailures } from "@/modules/greeting-card/domain/delivery-failure"

/** Lần giao chưa thành công gần nhất + số lần — dùng chung Lưới thẻ và Kanban Điều phối. */
export function DeliveryFailureNote({ deliveryStatus, deliveryWindow }: { deliveryStatus: string; deliveryWindow: unknown }) {
  if (deliveryStatus !== "FAILED") return null
  const failures = readDeliveryFailures(deliveryWindow)
  const last = failures.at(-1)
  if (!last) return null
  return (
    <div role="status" className="rounded-lg bg-warning-bg px-2 py-1.5 text-caption text-warning">
      <span className="font-bold">Giao lần {failures.length} chưa thành công:</span> {last.reasonLabel}
      {last.note ? ` — ${last.note}` : ""}. Hẹn lại với khách rồi bấm &ldquo;Giao lại&rdquo;.
    </div>
  )
}
