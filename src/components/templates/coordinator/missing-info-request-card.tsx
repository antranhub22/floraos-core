"use client"

import React from "react"
import { HelpCircle, Send, CheckCircle2, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface MissingInfoItem {
  field: string
  label: string
  reason: string
}

export interface MissingInfoRequestCardProps {
  orderCode: string
  salesPersonName: string
  missingItems: MissingInfoItem[]
  onSendToSales?: () => void
  onResolved?: () => void
}

export function MissingInfoRequestCard({
  orderCode,
  salesPersonName,
  missingItems,
  onSendToSales,
  onResolved,
}: MissingInfoRequestCardProps) {
  return (
    <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle size={17} className="text-amber-600" />
          <span className="text-xs font-bold text-amber-950">YÊU CẦU BỔ SUNG THÔNG TIN (T03)</span>
          <Badge tone="warning" className="text-[10px] font-bold">
            Đơn #{orderCode}
          </Badge>
        </div>
        <div className="text-[11px] text-text-muted">
          Người phụ trách Sales: <strong className="text-text">{salesPersonName}</strong>
        </div>
      </div>

      <div className="text-xs flex flex-col gap-2">
        <span className="font-bold text-text">Các trường thông tin còn thiếu cần Sales bổ sung gấp:</span>
        <div className="space-y-2">
          {missingItems.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-surface border border-amber-200 flex flex-col gap-0.5">
              <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-600" />
                <span>{item.label} ({item.field})</span>
              </div>
              <p className="text-text-muted text-[11.5px]">{item.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-dashed border-amber-200">
        {onResolved && (
          <Button variant="outline" size="sm" onClick={onResolved} className="h-8 text-xs gap-1">
            <CheckCircle2 size={13} />
            <span>Đã đủ thông tin</span>
          </Button>
        )}
        {onSendToSales && (
          <Button size="sm" onClick={onSendToSales} className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-xs gap-1 font-bold">
            <Send size={13} />
            <span>Gửi Yêu Cầu Cho Sales Qua Zalo / Chat</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
