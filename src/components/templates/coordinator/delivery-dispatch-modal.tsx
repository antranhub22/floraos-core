"use client"

import React, { useState } from "react"
import {
  X,
  Truck,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Camera,
  Upload,
  ArrowRight,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CoordinationMockOrder } from "@/components/coordinator/control-tower-dashboard"

export interface DeliveryDispatchModalProps {
  isOpen: boolean
  order: CoordinationMockOrder | null
  onClose: () => void
  onConfirmDelivered: (updatedOrder: CoordinationMockOrder) => void
}

export function DeliveryDispatchModal({
  isOpen,
  order,
  onClose,
  onConfirmDelivered,
}: DeliveryDispatchModalProps) {
  const [carrier, setCarrier] = useState<string>("GrabExpress")
  const [driverName, setDriverName] = useState("Trần Văn Bình")
  const [driverPhone, setDriverPhone] = useState("0912.345.678")
  const [trackingCode, setTrackingCode] = useState(`GRAB-${Date.now().toString().slice(-6)}`)
  const [podImageUrl, setPodImageUrl] = useState<string>(
    order?.podImageUrl ||
      order?.sampleImageUrl ||
      "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80"
  )
  const [recipientActualName, setRecipientActualName] = useState(order?.recipientName || "")
  const [deliveryNote, setDeliveryNote] = useState("Người nhận đã ký nhận hoa tươi nguyên vẹn.")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  if (!isOpen || !order) return null

  const addr = order.deliveryAddress
  const formattedAddress: string =
    typeof addr === "object" && addr !== null
      ? [addr.street, addr.ward, addr.district, addr.city].filter(Boolean).join(", ")
      : String(addr)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPodImageUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCompleteDelivery = () => {
    const updated: CoordinationMockOrder = {
      ...order,
      stage: "DELIVERED",
      stageLabel: "Đã giao thành công (Chờ nghiệm thu)",
      riskLevel: "NORMAL",
      riskReason: undefined,
      nextAction: "Nghiệm thu đơn hàng & đánh giá SLA",
      podImageUrl,
      internalNote: `${order.internalNote || ""}\n[POD P6]: Shipper ${carrier} (${driverName}) giao lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}. Người nhận: ${recipientActualName}`.trim(),
    }
    onConfirmDelivered(updated)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Truck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase border border-zinc-200">
                  CHẶNG P6 • GIAO HÀNG
                </span>
                <h3 className="text-base font-extrabold text-text">
                  Điều Phối Giao Hàng & Thu Thập POD (T20/T21)
                </h3>
              </div>
              <p className="text-[11px] text-text-muted">
                Đơn #{order.orderCode} • Bàn giao shipper & xác nhận bằng chứng giao hoa tận tay
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Thông tin người nhận và địa chỉ */}
          <div className="p-3.5 rounded-xl border border-border bg-surface-alt flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text flex items-center gap-1.5">
                <User size={13} className="text-red-600" />
                <span>Người nhận: <strong>{order.recipientName}</strong></span>
              </span>
              <a
                href={`tel:${order.recipientPhone}`}
                className="text-red-700 font-bold flex items-center gap-1 hover:underline"
              >
                <Phone size={11} />
                <span>{order.recipientPhone}</span>
              </a>
            </div>

            <div className="flex items-start gap-1.5 text-text-muted text-[11.5px]">
              <MapPin size={13} className="text-red-600 shrink-0 mt-0.5" />
              <span className="text-text font-medium">{formattedAddress}</span>
            </div>

            <div className="flex items-center gap-1 text-rose-700 font-bold text-[11px] pt-1 border-t border-dashed border-border/80">
              <Clock size={12} />
              <span>Hẹn giao: {order.deliveryTargetTime}</span>
            </div>
          </div>

          {/* Chỉ định Shipper / Đơn vị vận chuyển */}
          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col gap-3">
            <span className="font-bold text-text text-xs flex items-center gap-1.5">
              <Truck size={13} className="text-indigo-600" />
              <span>Thông tin đơn vị vận chuyển & Tài xế:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="font-bold text-text block mb-1">Đơn vị vận chuyển</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text font-bold"
                >
                  <option value="GrabExpress">GrabExpress (Giao nhanh)</option>
                  <option value="AhaMove">AhaMove (Túi giữ nhiệt)</option>
                  <option value="Lalamove">Lalamove</option>
                  <option value="ShipperShop">Shipper nội bộ shop</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-text block mb-1">Tên tài xế</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-text block mb-1">SĐT tài xế</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text font-medium"
                />
              </div>
            </div>
          </div>

          {/* Thu thập Bằng chứng Giao hàng POD */}
          <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50/40 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-red-950 text-xs flex items-center gap-1.5">
                <Camera size={14} className="text-red-600" />
                Ảnh Bằng Chứng Giao Hoa Tận Tay (Proof of Delivery — POD):
              </span>
              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                Bắt buộc để đóng đơn P7
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="relative w-28 h-28 rounded-xl border border-red-200 bg-surface overflow-hidden shrink-0 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={podImageUrl} alt="Ảnh POD giao hàng" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5">
                  Bằng chứng POD
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <div>
                  <label className="font-bold text-text text-[11px] block mb-0.5">
                    Link ảnh hoặc tải ảnh chụp giao hàng thực tế:
                  </label>
                  <input
                    type="text"
                    value={podImageUrl}
                    onChange={(e) => setPodImageUrl(e.target.value)}
                    placeholder="Dán URL link ảnh POD..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs h-7 gap-1 border-red-300 text-red-700 bg-red-50 hover:bg-red-100 font-bold"
                  >
                    <Upload size={12} />
                    <span>Tải ảnh POD từ máy</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="font-bold text-text block mb-1">Tên người nhận thực tế ký nhận:</label>
                <input
                  type="text"
                  value={recipientActualName}
                  onChange={(e) => setRecipientActualName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text"
                />
              </div>

              <div>
                <label className="font-bold text-text block mb-1">Ghi chú xác nhận của shipper:</label>
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text"
                />
              </div>
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
            onClick={handleCompleteDelivery}
            className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 px-4 shadow-sm"
          >
            <CheckCircle2 size={14} />
            <span>Xác Nhận Đã Giao Thành Công ➔ Đóng Đơn (P7)</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
