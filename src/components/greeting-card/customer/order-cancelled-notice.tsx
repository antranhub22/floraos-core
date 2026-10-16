"use client"

import React from "react"
import { XCircle } from "lucide-react"

export interface CancellationNoticeData {
  cancelledAt: string
  contactDeadline: string
  /** 0 = huỷ không hoàn tiền → không nhắc tới hoàn tiền */
  refundVnd: number
}

/** "16:30 ngày 16/10" theo giờ Việt Nam, không phụ thuộc múi giờ máy khách. */
function formatDeadline(iso: string): string {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", hour12: false,
  }).formatToParts(new Date(iso))
  const v = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ""
  return `${v("hour")}:${v("minute")} ngày ${v("day")}/${v("month")}`
}

/**
 * Đơn bị huỷ vì tiệm không thực hiện được (Điều phối không nhận / huỷ giữa chừng, đã được duyệt):
 * báo khách lý do, hạn nhân viên liên hệ và hoàn tiền (nếu có) — PO 16/10/2026.
 */
export function OrderCancelledNotice({ orderCode, notice }: { orderCode: string; notice: CancellationNoticeData }) {
  const deadline = formatDeadline(notice.contactDeadline)
  return (
    <section role="alert" aria-labelledby="order-cancelled-title" className="w-full flex flex-col items-center gap-2 rounded-2xl border border-danger/30 bg-danger-bg p-5 text-center">
      <XCircle size={32} className="text-danger" aria-hidden="true" />
      <h2 id="order-cancelled-title" className="text-title-sm font-extrabold text-danger">
        Rất tiếc, cửa hàng không thể thực hiện đơn #{orderCode}
      </h2>
      <p className="text-body-sm text-foreground">Cửa hàng đang quá tải nên không thực hiện được đơn hàng của bạn.</p>
      <p className="text-body-sm text-foreground">
        {notice.refundVnd > 0 ? (
          <>
            Nhân viên cửa hàng sẽ liên hệ và hoàn <strong>{notice.refundVnd.toLocaleString("vi-VN")}đ</strong> cho bạn trước{" "}
            <strong>{deadline}</strong>.
          </>
        ) : (
          <>
            Nhân viên cửa hàng sẽ liên hệ với bạn trước <strong>{deadline}</strong>.
          </>
        )}
      </p>
      <p className="text-body-sm text-text-muted">Cần thêm thông tin, bạn vui lòng liên hệ nhân viên đã tư vấn cho bạn.</p>
    </section>
  )
}
