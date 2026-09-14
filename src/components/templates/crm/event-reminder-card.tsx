"use client"

import React from "react"
import { Bell, Calendar, Send } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface EventReminderItem {
  id: string
  customerName: string
  eventTitle: string
  eventDate: string
  daysRemaining: number
  suggestedBudget: string
  preferredStyle: string
}

export interface EventReminderCardProps {
  reminders: EventReminderItem[]
  onSendZaloCare?: (item: EventReminderItem) => void
}

/**
 * EventReminderCard (Thẻ nhắc hẹn ngày kỷ niệm & sinh nhật M08)
 */
export function EventReminderCard({
  reminders,
  onSendZaloCare,
}: EventReminderCardProps) {
  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M08 Retention Care</div>
          <div className="text-[16px] font-extrabold text-text">Nhắc hẹn ngày kỷ niệm sắp tới</div>
        </div>
        <Badge tone="warning" className="gap-1">
          <Bell size={12} />
          {reminders.length} Sự kiện cần chăm sóc
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        {reminders.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                <Calendar size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-text">{item.customerName}</span>
                  <Badge tone={item.daysRemaining <= 2 ? "danger" : "warning"} className="text-[10px]">
                    Còn {item.daysRemaining} ngày
                  </Badge>
                </div>
                <div className="text-xs font-semibold text-text mt-0.5">{item.eventTitle} ({item.eventDate})</div>
                <div className="text-[11px] text-text-muted">
                  Gợi ý: {item.preferredStyle} • Tầm giá: {item.suggestedBudget}
                </div>
              </div>
            </div>

            {onSendZaloCare && (
              <Button size="sm" onClick={() => onSendZaloCare(item)} className="gap-1.5 shrink-0">
                <Send size={13} />
                Nhắn Zalo
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
