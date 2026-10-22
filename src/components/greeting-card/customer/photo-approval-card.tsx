"use client"

import React, { useState } from "react"
import { Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"

export interface PhotoApprovalCardProps {
  orderCode: string
  sendCode?: string | null | undefined
  uploadedAt: string
  countdownMinutes: number
  /** `false` = tiệm không tự duyệt khi hết giờ — không đếm ngược, chờ khách bấm */
  autoApprove?: boolean | undefined
  /** Đơn đặt cọc còn nợ: sau xác nhận ảnh sẽ hiện mã QR thanh toán lần 2. */
  hasBalanceDue?: boolean
  onApproved: () => void
}

export function PhotoApprovalCard({
  orderCode,
  sendCode,
  uploadedAt,
  countdownMinutes,
  autoApprove = true,
  hasBalanceDue = false,
  onApproved,
}: PhotoApprovalCardProps) {
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expireTime = Date.parse(uploadedAt) + countdownMinutes * 60_000
  const [timeLeftMs, setTimeLeftMs] = useState(() => Math.max(0, expireTime - Date.now()))

  React.useEffect(() => {
    if (!autoApprove || timeLeftMs <= 0) return
    const timer = setInterval(() => {
      const left = Math.max(0, expireTime - Date.now())
      setTimeLeftMs(left)
      if (left <= 0) {
        clearInterval(timer)
        onApproved()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [autoApprove, expireTime, onApproved, timeLeftMs])

  async function handleApprove() {
    setApproving(true)
    setError(null)
    try {
      const url = `/api/v1/public/brochure/tracking/${encodeURIComponent(orderCode)}/approve-photo${
        sendCode ? `?link=${encodeURIComponent(sendCode)}` : ""
      }`
      await apiSend(url, "POST", {})
      onApproved()
    } catch {
      setError("Không thể xác nhận, vui lòng thử lại")
    } finally {
      setApproving(false)
    }
  }

  const totalSec = Math.floor(timeLeftMs / 1000)
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0")
  const ss = String(totalSec % 60).padStart(2, "0")

  return (
    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col gap-3 mt-1">
      <div className="flex items-center justify-between">
        <span className="text-body-sm font-extrabold text-foreground flex items-center gap-1.5">
          <Clock size={16} className="text-primary animate-pulse" />
          <span>Xác nhận hình ảnh sản phẩm</span>
        </span>
        {autoApprove && (
          <span className="text-body-sm font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg tabular-nums">
            {mm}:{ss}
          </span>
        )}
      </div>

      <p className="text-caption text-text-muted leading-relaxed">
        Vui lòng xem kỹ ảnh hoa thành phẩm ở trên.{" "}
        {hasBalanceDue ? (
          <>
            Sau khi xác nhận, bạn sẽ được hướng dẫn <strong>thanh toán phần còn lại</strong> để cửa hàng tiến hành giao hoa.
          </>
        ) : !autoApprove ? (
          <>
            Cửa hàng sẽ <strong>giao hoa sau khi bạn xác nhận</strong> hình ảnh này.
          </>
        ) : (
          <>
            Sau khi đồng hồ kết thúc, hệ thống sẽ <strong>tự động xác nhận</strong> để xưởng tiến hành bàn giao đơn cho tài xế giao hoa.
          </>
        )}
      </p>

      {error && <p className="text-caption text-danger">{error}</p>}

      <Button
        type="button"
        size="sm"
        onClick={() => void handleApprove()}
        disabled={approving || (autoApprove && timeLeftMs <= 0)}
        className="h-10 w-full gap-1.5 rounded-xl font-bold bg-primary text-white"
      >
        <CheckCircle2 size={16} />
        <span>
          {approving
            ? "Đang xác nhận..."
            : hasBalanceDue
            ? "Xác nhận ảnh và tiếp tục thanh toán"
            : "Tôi đồng ý với hình ảnh sản phẩm này"}
        </span>
      </Button>
    </div>
  )
}
