"use client"

import React from "react"
import { Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SEND_ERROR, useInboxSend, type Done } from "./use-inbox-send"

/** Sale nhận đơn chưa có người phụ trách — ghi tên mình vào đơn ngay trong Hộp việc. */
export function ClaimOrderButton({ orderId, onDone }: { orderId: string; onDone: Done }) {
  const { busy, error, send } = useInboxSend(onDone)
  return (
    <div className="flex flex-1 flex-col gap-1 sm:flex-none">
      <Button type="button" disabled={busy !== null} className="h-11 gap-1 text-body-sm font-bold"
        onClick={() => void send("claim", `/api/v1/greeting-card/orders/${orderId}/claim`, {}, "Bạn đã nhận đơn này", "Không nhận được đơn")}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
        <span>Nhận đơn</span>
      </Button>
      {error && <p role="alert" className={SEND_ERROR}>{error}</p>}
    </div>
  )
}
