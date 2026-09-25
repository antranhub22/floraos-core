"use client"

import React, { useState } from "react"
import {
  X,
  Award,
  CheckCircle2,
  Clock,
  Star,
  ShieldCheck,
  FileCheck,
  DollarSign,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CoordinationMockOrder } from "@/components/coordinator/control-tower-dashboard"

export interface OrderClosureModalProps {
  isOpen: boolean
  order: CoordinationMockOrder | null
  onClose: () => void
  onArchiveOrder: (updatedOrder: CoordinationMockOrder) => void
}

export function OrderClosureModal({
  isOpen,
  order,
  onClose,
  onArchiveOrder,
}: OrderClosureModalProps) {
  const [partnerRating, setPartnerRating] = useState<number>(5)
  const [closureNotes, setClosureNotes] = useState(
    "Đơn hàng hoàn tất xuất sắc. Khách hàng khen hoa tươi đẹp đúng mẫu."
  )
  const [costActualVnd, setCostActualVnd] = useState<number>(450000)

  if (!isOpen || !order) return null

  const handleArchive = () => {
    const updated: CoordinationMockOrder = {
      ...order,
      stage: "COMPLETED",
      stageLabel: "Đã hoàn tất & Lưu trữ hồ sơ",
      riskLevel: "NORMAL",
      riskReason: undefined,
      nextAction: "Hồ sơ đã đóng sạch. Tích lũy điểm uy tín đối tác.",
      internalNote: `${order.internalNote || ""}\n[Nghiệm thu P7]: Đóng đơn lúc ${new Date().toLocaleString("vi-VN")}. Đánh giá xưởng: ${partnerRating}/5 sao. Ghi chú: ${closureNotes}`.trim(),
    }
    onArchiveOrder(updated)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Award size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase border border-zinc-200">
                  CHẶNG P7 • HOÀN TẤT ĐƠN
                </span>
                <h3 className="text-base font-extrabold text-text">
                  Nghiệm Thu & Đóng Đơn SLA (T25/T26)
                </h3>
              </div>
              <p className="text-[11px] text-text-muted">
                Đơn #{order.orderCode} • Tổng kết SLA, đánh giá đối tác & đóng dữ liệu sạch
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Tổng kết SLA & Thời gian */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-700" />
                <span>Hiệu Suất Thời Gian & Cam Kết SLA:</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10.5px]">
                SLA: XUẤT SẮC (GIAO SỚM 12 PHÚT)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11.5px] pt-1">
              <div>
                <span className="text-text-muted block">Hạn cam kết với khách:</span>
                <strong className="text-text">{order.deliveryTargetTime}</strong>
              </div>
              <div>
                <span className="text-text-muted block">Thời gian giao thực tế:</span>
                <strong className="text-emerald-800">
                  {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} Hôm nay
                </strong>
              </div>
            </div>
          </div>

          {/* Checklist điều kiện đóng đơn P7 theo Sổ tay */}
          <div className="p-3.5 rounded-xl border border-border bg-surface-alt flex flex-col gap-2">
            <span className="font-bold text-text text-xs flex items-center gap-1.5">
              <FileCheck size={14} className="text-red-600" />
              <span>Kiểm tra 5 điều kiện tiên quyết trước khi đóng đơn (P7 Sổ tay):</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Đã giao hoa tận tay người nhận</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Có đầy đủ ảnh bằng chứng POD</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Đạt kiểm định AI QC ({order.qcScore || 94}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Ghi nhận đối tác: {order.partnerName || "Xưởng liên kết"}</span>
              </div>
            </div>
          </div>

          {/* Đánh giá đối tác gia công & Chi phí */}
          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col gap-3">
            <span className="font-bold text-text text-xs flex items-center gap-1.5">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span>Đánh giá hiệu suất & Chấm sao đối tác ({order.partnerName || "Xưởng ngoài"}):</span>
            </span>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setPartnerRating(star)}
                  className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    size={22}
                    className={star <= partnerRating ? "fill-amber-400 text-amber-500" : "text-zinc-300"}
                  />
                </button>
              ))}
              <span className="font-extrabold text-text ml-2 text-sm">
                {partnerRating === 5
                  ? "⭐⭐⭐⭐⭐ Xuất sắc (5/5)"
                  : partnerRating === 4
                  ? "⭐⭐⭐⭐ Tốt (4/5)"
                  : `${partnerRating} sao`}
              </span>
            </div>

            <div>
              <label className="font-bold text-text block mb-1">Ghi chú nghiệm thu hồ sơ:</label>
              <textarea
                rows={2}
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-xs focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-3 sticky bottom-0 bg-surface">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>

          <Button
            size="sm"
            onClick={handleArchive}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 px-4 shadow-sm"
          >
            <CheckCircle2 size={14} />
            <span>Hoàn Tất & Lưu Trữ Hồ Sơ Đơn Hàng</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
