"use client"

import React, { useState } from "react"
import {
  X,
  ClipboardList,
  Clock,
  AlertTriangle,
  Flower2,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { errorMessage, type CoordinationOrder } from "@/components/coordinator/coordinator-api"

export interface OrderPlanningModalProps {
  isOpen: boolean
  order: CoordinationOrder | null
  onClose: () => void
  /** Chốt kế hoạch: máy chủ chuyển đơn sang PLANNING kèm việc kế tiếp. */
  onConfirmPlan: (nextAction: string) => Promise<void>
}

export function OrderPlanningModal({
  isOpen,
  order,
  onClose,
  onConfirmPlan,
}: OrderPlanningModalProps) {
  const [productionTargetTime, setProductionTargetTime] = useState("16:00")
  const [pickupTargetTime, setPickupTargetTime] = useState("16:30")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planningNotes, setPlanningNotes] = useState("")

  if (!isOpen || !order) return null

  const addr = order.deliveryAddress as Record<string, unknown> | string | null
  const formattedAddress: string =
    typeof addr === "object" && addr !== null
      ? [addr.street, addr.ward, addr.district, addr.city].filter((v) => typeof v === "string" && v).join(", ")
      : String(addr ?? "")

  const handleConfirm = async () => {
    const plan = `Cắm xong ${productionTargetTime}, shipper lấy ${pickupTargetTime}${planningNotes.trim() ? ` — ${planningNotes.trim()}` : ""}`
    setBusy(true)
    setError(null)
    try {
      await onConfirmPlan(plan.slice(0, 300))
      setPlanningNotes("")
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <ClipboardList size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase border border-zinc-200">
                  CHẶNG P2 • KẾ HOẠCH
                </span>
                <h3 className="text-base font-extrabold text-text">
                  Lập Kế Hoạch Đơn Hàng (Order Planning — T02)
                </h3>
              </div>
              <p className="text-[11px] text-text-muted">
                Đơn #{order.orderCode} • Thẩm định yêu cầu & Thiết lập mốc thời gian sản xuất
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* 1. Tóm tắt thông tin tiếp nhận từ Sales */}
          <div className="p-3.5 rounded-xl border border-border bg-surface-alt flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-dashed border-border/80 pb-2">
              <span className="font-bold text-text flex items-center gap-1.5">
                <Flower2 size={13} className="text-red-600" />
                <span>Mẫu sản phẩm & Giá:</span>
                <strong className="text-text">{order.productTitle}</strong>
              </span>
              <span className="font-extrabold text-rose-700">
                {(order.unitPriceVnd || 0).toLocaleString("vi-VN")} đ
              </span>
            </div>

            <div className="flex items-start gap-3">
              {order.sampleImageUrl && (
                <div className="w-16 h-16 rounded-lg border border-red-200 overflow-hidden shrink-0 relative bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.sampleImageUrl}
                    alt={order.productTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 flex flex-col gap-1 text-[11.5px]">
                <div className="flex items-center gap-1 text-text-muted">
                  <MapPin size={12} className="text-red-600 shrink-0" />
                  <span className="text-text font-medium line-clamp-1">{formattedAddress}</span>
                </div>
                <div className="flex items-center gap-1 text-text-muted">
                  <Clock size={12} className="text-rose-600 shrink-0" />
                  <span>Hẹn giao khách:</span>
                  <strong className="text-text font-bold">{order.deliveryTargetTime}</strong>
                </div>
                {order.cardMessage && (
                  <div className="text-[11px] text-text-muted line-clamp-1 italic">
                    Thiệp: “{order.cardMessage}”
                  </div>
                )}
              </div>
            </div>

            {/* Atomic BOM ngắn gọn */}
            {order.flowers && order.flowers.length > 0 && (
              <div className="pt-2 border-t border-dashed border-border/80">
                <span className="text-[11px] font-bold text-text-muted block mb-1">
                  Công thức cành hoa (BOM) cần đối tác chuẩn bị:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {order.flowers.map((fl, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-surface border border-border text-[10.5px] font-medium text-text"
                    >
                      {fl.quantity} {fl.unit} {fl.flowerName} ({fl.color})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Thiết lập Timeline sản xuất lùi từ giờ giao khách (P2 Timeline) */}
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 flex flex-col gap-3">
            <span className="font-extrabold text-red-950 text-xs flex items-center gap-1.5">
              <Calendar size={13} className="text-red-600" />
              Thiết Lập Timeline Sản Xuất & Lấy Hàng (Reverse Scheduling):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-text block mb-1">
                  Giờ xưởng phải cắm xong (Sẵn sàng QC) *
                </label>
                <input
                  type="time"
                  required
                  value={productionTargetTime}
                  onChange={(e) => setProductionTargetTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text font-bold focus:outline-none focus:border-red-500"
                />
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  Nên hoàn thiện trước giờ lấy hoa 30 phút để AI QC kiểm định
                </span>
              </div>

              <div>
                <label className="font-bold text-text block mb-1">
                  Giờ Shipper lấy hoa (Pickup) *
                </label>
                <input
                  type="time"
                  required
                  value={pickupTargetTime}
                  onChange={(e) => setPickupTargetTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text font-bold focus:outline-none focus:border-red-500"
                />
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  Đảm bảo shipper kịp di chuyển trước giờ hẹn khách
                </span>
              </div>
            </div>
          </div>

          {/* 3. Rủi ro do máy chủ tính từ giờ hẹn + sự cố (F09) — không tự chọn tay */}
          <div className="p-3 rounded-xl border border-border bg-surface-alt flex items-center gap-2">
            <AlertTriangle size={13} className="text-amber-500" />
            <span>
              Rủi ro hiện tại: <strong>{order.riskLevel}</strong>
              {order.riskReason ? ` — ${order.riskReason}` : ""}
            </span>
          </div>

          {/* 4. Ghi chú chỉ đạo kỹ thuật */}
          <div>
            <label className="font-bold text-text block mb-1">
              Ghi chú chỉ đạo cho đối tác xưởng (Order Plan Notes):
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Hoa cắm xòe dáng tự nhiên phong cách Hàn Quốc, thiệp in máy chuẩn chữ đẹp, nơ thắt 2 tầng..."
              value={planningNotes}
              onChange={(e) => setPlanningNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {error && (
          <div role="alert" className="mx-5 mb-3 p-3 rounded-xl border border-red-300 bg-red-50 text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-3 sticky bottom-0 bg-surface">
          <Button variant="outline" size="sm" onClick={onClose}>
            Hủy bỏ
          </Button>

          <Button
            size="sm"
            disabled={busy}
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 px-4 shadow-sm"
          >
            <span>Chốt Kế Hoạch ➔ Tìm Đối Tác (P3)</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
