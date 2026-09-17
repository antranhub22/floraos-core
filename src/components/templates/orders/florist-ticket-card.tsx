"use client"

import React from "react"
import { Printer, CheckSquare, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface FloristFlowerItem {
  flowerName: string
  quantity: number
  unit: string
  color: string
}

export interface FloristTicketCardProps {
  orderCode: string
  productName: string
  sampleImageUrl?: string | undefined
  deadlineTime: string
  floristName?: string | undefined
  items: FloristFlowerItem[]
  wrapStyle: string
  notes?: string | undefined
  onPrint?: () => void
  onComplete?: () => void
}

/**
 * FloristTicketCard (Phiếu cắm hoa cho thợ xưởng M09)
 */
export function FloristTicketCard({
  orderCode,
  productName,
  sampleImageUrl,
  deadlineTime,
  floristName = "Chưa nhận thợ",
  items,
  wrapStyle,
  notes,
  onPrint,
  onComplete,
}: FloristTicketCardProps) {
  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M09 Lệnh Cắm Hoa (Xưởng)</div>
          <div className="text-[16px] font-extrabold text-text">Đơn #{orderCode}: {productName}</div>
        </div>
        <Badge tone="danger" className="gap-1 font-bold">
          <Clock size={12} />
          Hạn giao: {deadlineTime}
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {sampleImageUrl && (
          <div className="relative aspect-square w-32 h-32 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
            <img src={sampleImageUrl} alt="Mẫu cắm" className="h-full w-full object-cover" />
            <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">
              Ảnh mẫu
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col gap-2">
          <div className="text-xs text-text-muted">
            Thợ phụ trách: <span className="font-bold text-text">{floristName}</span> • Kiểu gói: <span className="font-bold text-text">{wrapStyle}</span>
          </div>

          <div className="rounded-lg border border-border bg-background p-2.5">
            <div className="text-xs font-bold text-text mb-1.5">Định lượng hoa bắt buộc:</div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-text">
                  <span>• {it.flowerName} ({it.color})</span>
                  <span className="font-bold text-primary">{it.quantity} {it.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {notes && (
            <div className="rounded bg-rose-50 border border-rose-200 p-2 text-xs text-rose-800 font-medium">
              Lưu ý khách: {notes}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        {onPrint && (
          <Button variant="secondary" size="sm" onClick={onPrint} className="gap-1.5">
            <Printer size={14} />
            In phiếu thợ
          </Button>
        )}
        {onComplete && (
          <Button size="sm" onClick={onComplete} className="gap-1.5">
            <CheckSquare size={14} />
            Báo cắm xong
          </Button>
        )}
      </div>
    </Card>
  )
}
