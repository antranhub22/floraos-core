"use client"

import React from "react"
import { CheckCircle2, Clock, XCircle, ShieldCheck, Flower2 } from "lucide-react"

export interface OrderParallelStagesProps {
  isPaid?: boolean
  paidVnd?: number
  totalVnd?: number
  orderStatus: string
  productionStatus: string
  cancelledReason?: string | null | undefined
}

/**
 * Hiển thị 2 mốc song song độc lập cho khách hàng theo dõi:
 * Mốc 1: Xác nhận thanh toán (cọc hoặc đủ, tối đa 15')
 * Mốc 2: Tiếp nhận đơn của Điều phối xưởng (tối đa 30', hoàn tiền nếu không nhận)
 */
export function OrderParallelStagesCard({
  isPaid: legacyIsPaid,
  paidVnd = 0,
  totalVnd = 0,
  orderStatus,
  productionStatus,
  cancelledReason,
}: OrderParallelStagesProps) {
  // Chỉ hiện khi đơn chưa hoàn thành và chưa giao xong
  if (orderStatus === "COMPLETED") return null

  const isRejected = orderStatus === "CANCELLED"
  const isAccepted = !isRejected && (productionStatus !== "WAITING" || orderStatus === "CONFIRMED" || orderStatus === "PROCESSING")

  const hasMoney = paidVnd > 0 || legacyIsPaid === true
  const isFullyPaid = (totalVnd > 0 && paidVnd >= totalVnd) || (legacyIsPaid && totalVnd <= 0)
  const isDeposit = totalVnd > 0 && paidVnd > 0 && paidVnd < totalVnd

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {/* MỐC 1: XÁC NHẬN THANH TOÁN */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
          hasMoney
            ? "bg-success-bg/60 border-success/30 text-success"
            : "bg-info-bg/50 border-info/30 text-info"
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-body-sm text-foreground">
          {hasMoney ? (
            <CheckCircle2 size={18} className="text-success shrink-0" />
          ) : (
            <ShieldCheck size={18} className="text-info shrink-0" />
          )}
          <span>
            {isDeposit
              ? "Đã nhận tiền cọc thành công"
              : hasMoney
              ? "Chuyển khoản thành công"
              : "Xác nhận chuyển khoản"}
          </span>
        </div>
        <p className="text-caption text-text-muted leading-relaxed">
          {isDeposit
            ? `Cửa hàng đã nhận ${paidVnd.toLocaleString("vi-VN")} đ tiền cọc. Phần còn lại ${(totalVnd - paidVnd).toLocaleString("vi-VN")} đ thanh toán sau khi duyệt ảnh hoa hoàn thành.`
            : hasMoney
            ? "Cửa hàng đã nhận đủ tiền chuyển khoản thành công."
            : "Thời gian xác nhận trong vòng 15’ (tối đa). Hệ thống tự động duyệt sau 15’ khi có ảnh bill."}
        </p>
      </div>

      {/* MỐC 2: TIẾP NHẬN ĐƠN CỦA ĐIỀU PHỐI */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
          isRejected
            ? "bg-danger-bg/60 border-danger/30 text-danger"
            : isAccepted
            ? "bg-success-bg/60 border-success/30 text-success"
            : "bg-info-bg/50 border-info/30 text-info"
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-body-sm text-foreground">
          {isRejected ? (
            <XCircle size={18} className="text-danger shrink-0" />
          ) : isAccepted ? (
            <Flower2 size={18} className="text-success shrink-0" />
          ) : (
            <Clock size={18} className="text-info shrink-0" />
          )}
          <span>
            {isRejected
              ? "Cửa hàng không thể nhận đơn"
              : isAccepted
              ? "Đã xác nhận nhận đơn"
              : "Tiếp nhận đơn hàng"}
          </span>
        </div>
        <p className="text-caption text-text-muted leading-relaxed">
          {isRejected
            ? `Rất tiếc tiệm chưa thể phục vụ${cancelledReason ? `: ${cancelledReason}` : ""}. Đang tiến hành hoàn tiền 100% cho bạn.`
            : isAccepted
            ? "Điều phối đã duyệt đơn. Nghệ nhân hoa đang chuẩn bị nguyên liệu cắm hoa."
            : "Điều phối sẽ xác nhận trong vòng 30’ (tối đa). Nếu không thể phục vụ, tiệm hoàn tiền 100%."}
        </p>
      </div>
    </div>
  )
}
