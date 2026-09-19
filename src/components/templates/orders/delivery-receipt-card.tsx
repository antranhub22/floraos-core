"use client"

import React from "react"
import { MapPin, Phone, User, MessageSquare, Printer, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface DeliveryReceiptCardProps {
  orderCode: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: string
  deliveryTime: string
  cardMessage: string
  shippingFee: string
  totalAmount: string
  onPrint?: () => void
  onDelivered?: () => void
}

/**
 * DeliveryReceiptCard (Phiếu giao hoa & thiệp chúc mừng A6 M09)
 */
export function DeliveryReceiptCard({
  orderCode,
  recipientName,
  recipientPhone,
  deliveryAddress,
  deliveryTime,
  cardMessage,
  shippingFee,
  totalAmount,
  onPrint,
  onDelivered,
}: DeliveryReceiptCardProps) {
  return (
    <Card className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M09 Delivery Slip</div>
          <div className="text-[16px] font-extrabold text-text">Phiếu giao hàng #{orderCode}</div>
        </div>
        <Badge tone="neutral">Khổ A6 Giao Vận</Badge>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-alt/40 p-3.5 text-xs">
        <div className="flex items-center gap-2">
          <User size={14} className="text-text-muted" />
          <span className="font-bold text-text">{recipientName}</span>
          <span className="text-text-muted">({recipientPhone})</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-text-muted mt-0.5" />
          <span className="text-text">{deliveryAddress}</span>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <span>Giờ giao hẹn:</span>
          <span className="font-bold text-primary">{deliveryTime}</span>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
          <MessageSquare size={13} />
          Nội dung thiệp chúc mừng:
        </div>
        <p className="text-xs italic text-text leading-relaxed font-serif">
          "{cardMessage}"
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <div className="text-xs text-text-muted">Phí ship: {shippingFee}</div>
          <div className="text-sm font-extrabold text-text">Thu hộ: {totalAmount}</div>
        </div>

        <div className="flex items-center gap-2">
          {onPrint && (
            <Button variant="secondary" size="sm" onClick={onPrint} className="gap-1.5">
              <Printer size={14} />
              In A6
            </Button>
          )}
          {onDelivered && (
            <Button size="sm" onClick={onDelivered} className="gap-1.5">
              <CheckCircle size={14} />
              Đã giao xong
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
