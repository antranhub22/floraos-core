"use client"

import React, { useState } from "react"
import {
  X,
  Users,
  CheckCircle2,
  Sparkles,
  MapPin,
  Star,
  Clock,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { StructuredAddress } from "@/modules/products/domain/product-master-index"

export interface PartnerCandidate {
  id: string
  name: string
  type: "INTERNAL_FLORIST" | "EXTERNAL_PARTNER_SHOP"
  phone: string
  address: string
  distanceKm: number
  matchScore: number // 0-100
  matchReasons: string[]
  tier: "STANDARD" | "PREFERRED" | "VIP"
  rating: number
  activeOrdersCount: number
  estimatedReadyTime: string
}

export interface PartnerAssignmentModalProps {
  isOpen: boolean
  orderCode: string
  recipeTitle: string
  deliveryAddress: StructuredAddress | string
  deliveryTargetTime: string
  candidates?: PartnerCandidate[] | undefined
  onClose: () => void
  onAssign: (partner: PartnerCandidate, notes?: string) => void
}

const DEFAULT_CANDIDATES: PartnerCandidate[] = [
  {
    id: "part-01",
    name: "Flora Boutique Ba Đình",
    type: "EXTERNAL_PARTNER_SHOP",
    phone: "0988776655",
    address: "24 Liễu Giai, Ba Đình, Hà Nội",
    distanceKm: 1.2,
    matchScore: 96,
    matchReasons: ["Cùng quận Ba Đình", "Có sẵn Hồng Ohara Kem", "SLA đúng hạn 99%"],
    tier: "PREFERRED",
    rating: 4.9,
    activeOrdersCount: 2,
    estimatedReadyTime: "16:15",
  },
  {
    id: "part-02",
    name: "Nguyễn Thu Hà (Thợ cắm chính tiệm)",
    type: "INTERNAL_FLORIST",
    phone: "0912348899",
    address: "Xưởng trung tâm FloraOS",
    distanceKm: 3.5,
    matchScore: 91,
    matchReasons: ["Thợ cắm chuyên dáng hoa tròn", "Điểm QC trung bình 96/100"],
    tier: "VIP",
    rating: 5.0,
    activeOrdersCount: 3,
    estimatedReadyTime: "16:30",
  },
  {
    id: "part-03",
    name: "Xưởng Hoa Cầu Giấy Art",
    type: "EXTERNAL_PARTNER_SHOP",
    phone: "0904556677",
    address: "102 Trần Thái Tông, Cầu Giấy, Hà Nội",
    distanceKm: 4.8,
    matchScore: 84,
    matchReasons: ["Thế mạnh hoa khai trương", "Hỗ trợ ship nhanh"],
    tier: "STANDARD",
    rating: 4.7,
    activeOrdersCount: 1,
    estimatedReadyTime: "16:45",
  },
]

export function PartnerAssignmentModal({
  isOpen,
  orderCode,
  recipeTitle,
  deliveryAddress,
  deliveryTargetTime,
  candidates = DEFAULT_CANDIDATES,
  onClose,
  onAssign,
}: PartnerAssignmentModalProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(candidates[0]?.id || "")
  const [notes, setNotes] = useState("")

  if (!isOpen) return null

  const selectedCandidate = candidates.find((c) => c.id === selectedPartnerId)

  const handleConfirm = () => {
    if (!selectedCandidate) return
    onAssign(selectedCandidate, notes)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-text">
                Phân Công Đối Tác / Thợ Cắm (Template T06)
              </h2>
              <p className="text-[11px] text-text-muted">
                Đơn #{orderCode}: {recipeTitle} · Hẹn giao: {deliveryTargetTime}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-alt border border-border flex items-start gap-2.5">
            <MapPin size={15} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text">Địa chỉ giao hoa đích (Phân cấp chuẩn):</span>
                {typeof deliveryAddress === "object" && deliveryAddress !== null && (
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.2 rounded-full">
                    Khớp khu vực
                  </span>
                )}
              </div>
              <span className="text-text font-semibold">
                {typeof deliveryAddress === "object" && deliveryAddress !== null
                  ? deliveryAddress.street
                  : deliveryAddress}
              </span>
              {typeof deliveryAddress === "object" && deliveryAddress !== null && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                    {deliveryAddress.ward}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {deliveryAddress.district}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                    {deliveryAddress.city}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-bold text-text flex items-center gap-1.5 text-xs">
              <Sparkles size={14} className="text-amber-500" />
              Gợi ý đối tác tối ưu theo AI Matching Engine:
            </span>

            <div className="space-y-2.5">
              {candidates.map((cand) => {
                const isSelected = cand.id === selectedPartnerId
                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedPartnerId(cand.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "border-red-500 bg-red-50/40 ring-2 ring-red-500/20"
                        : "border-border bg-surface hover:border-red-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="partnerCandidate"
                          checked={isSelected}
                          onChange={() => setSelectedPartnerId(cand.id)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="font-extrabold text-text text-sm">{cand.name}</span>
                        <Badge tone={cand.type === "INTERNAL_FLORIST" ? "neutral" : "warning"} className="text-[10px]">
                          {cand.type === "INTERNAL_FLORIST" ? "Thợ nội bộ" : "Xưởng đối tác"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs">
                        <Sparkles size={12} className="text-emerald-600" />
                        <span>{cand.matchScore}% Khớp</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-muted text-[11.5px] pl-6">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        Cách {cand.distanceKm} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        {cand.rating}/5.0
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Dự kiến cắm xong: <strong className="text-text">{cand.estimatedReadyTime}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pl-6 pt-1">
                      {cand.matchReasons.map((reason, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-surface-alt border border-border text-[10.5px] font-medium text-text-muted"
                        >
                          ✓ {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <label className="font-bold text-text block mb-1">Lời nhắn giao việc cho đối tác:</label>
            <input
              type="text"
              placeholder="Ví dụ: Đơn cắm hoa kỷ niệm, lưu ý tuyển hoa búp đẹp và gửi ảnh QC trước 16:15..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-end gap-3 sticky bottom-0 bg-surface">
          <Button variant="outline" size="sm" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5"
          >
            <CheckCircle2 size={15} />
            <span>Xác Nhận Giao Việc & Phát Hành Phiếu T07</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
