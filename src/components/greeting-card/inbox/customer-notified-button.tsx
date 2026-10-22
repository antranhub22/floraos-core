"use client"

import React from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SEND_ERROR, useInboxSend, type Done } from "./use-inbox-send"

/** Sale xác nhận đã gọi/nhắn báo khách đơn bị huỷ — đóng việc trong Hộp việc. */
export function CustomerNotifiedButton({ orderId, onDone }: { orderId: string; onDone: Done }) {
  const { busy, error, send } = useInboxSend(onDone)
  return (
    <div className="flex flex-1 flex-col gap-1 sm:flex-none">
      <Button type="button" disabled={busy !== null} className="h-11 gap-1 text-body-sm font-bold"
        onClick={() => void send("notified", `/api/v1/greeting-card/orders/${orderId}/customer-notified`, {}, "Đã ghi nhận bạn đã báo khách", "Không thể ghi nhận")}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        <span>Đã báo khách</span>
      </Button>
      {error && <p role="alert" className={SEND_ERROR}>{error}</p>}
    </div>
  )
}
