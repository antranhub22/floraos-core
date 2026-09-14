"use client"

import React from "react"
import { AlertCircle, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface HumanTakeoverBannerProps {
  reason: string
  customerName: string
  onAcceptTakeover: () => void
  onDismiss?: () => void
}

/**
 * HumanTakeoverBanner (Thẻ cảnh báo tiếp quản hội thoại tư vấn M10)
 */
export function HumanTakeoverBanner({
  reason,
  customerName,
  onAcceptTakeover,
  onDismiss,
}: HumanTakeoverBannerProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800">
          <AlertCircle size={20} />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Yêu cầu nhân viên can thiệp: {customerName}
          </div>
          <div className="text-xs text-amber-900/90 mt-0.5">{reason}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss} className="text-amber-800 hover:text-amber-950 text-xs">
            Bỏ qua
          </Button>
        )}
        <Button size="sm" onClick={onAcceptTakeover} className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs">
          <UserCheck size={14} />
          Nhận xử lý ngay
        </Button>
      </div>
    </div>
  )
}
