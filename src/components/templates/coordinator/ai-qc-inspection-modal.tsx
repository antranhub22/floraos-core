"use client"

import React, { useState } from "react"
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  FileCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CoordinationMockOrder } from "@/components/coordinator/control-tower-dashboard"

export interface AiQcInspectionModalProps {
  isOpen: boolean
  order: CoordinationMockOrder | null
  onClose: () => void
  onApprovePass: (updatedOrder: CoordinationMockOrder) => void
  onRequestRework: (updatedOrder: CoordinationMockOrder, reworkNotes: string) => void
}

export function AiQcInspectionModal({
  isOpen,
  order,
  onClose,
  onApprovePass,
  onRequestRework,
}: AiQcInspectionModalProps) {
  const [similarityScore] = useState<number>(94)
  const [reworkNotes, setReworkNotes] = useState("")
  const [isReworkMode, setIsReworkMode] = useState(false)

  if (!isOpen || !order) return null

  const masterImg =
    order.sampleImageUrl ||
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80"
  const finishedImg =
    order.finishedImageUrls?.[0] ||
    order.sampleImageUrl ||
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80"

  const handlePass = () => {
    const updated: CoordinationMockOrder = {
      ...order,
      stage: "DISPATCHING",
      stageLabel: "Đã duyệt QC (Chờ giao hàng)",
      riskLevel: "NORMAL",
      riskReason: undefined,
      nextAction: "Bàn giao đơn vị vận chuyển / Shipper giao hoa",
      qcScore: similarityScore,
      qcStatus: "PASSED",
    }
    onApprovePass(updated)
  }

  const handleRework = () => {
    if (!reworkNotes.trim()) {
      alert("Vui lòng nhập lý do cần thợ sửa lại (Rework)!")
      return
    }
    const updated: CoordinationMockOrder = {
      ...order,
      stage: "IN_PRODUCTION",
      stageLabel: "Yêu cầu thợ sửa lại (Rework QC)",
      riskLevel: "ATTENTION",
      riskReason: `Yêu cầu sửa: ${reworkNotes}`,
      nextAction: "Thợ cắm hoa đang hiệu chỉnh lại theo yêu cầu QC",
      qcStatus: "REWORK_REQUIRED",
    }
    onRequestRework(updated, reworkNotes)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase border border-zinc-200">
                  CHẶNG P5 • KIỂM ĐỊNH QC
                </span>
                <h3 className="text-base font-extrabold text-text">
                  Kiểm Định Thị Giác AI QC (Visual QC — T14)
                </h3>
              </div>
              <p className="text-[11px] text-text-muted">
                Đơn #{order.orderCode} • Đối chiếu ảnh thợ cắm với ảnh mẫu chuẩn đầu vào
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-5 text-xs">
          {/* Khối So sánh Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ảnh Mẫu Đầu Vào */}
            <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-surface-alt">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text text-xs flex items-center gap-1.5">
                  <span>📸 Ảnh Mẫu Chuẩn Đầu Vào (Master Spec)</span>
                </span>
                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  Tiêu chuẩn gốc
                </span>
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={masterImg} alt="Ảnh mẫu đầu vào" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => window.open(masterImg, "_blank")}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-surface/90 text-text hover:bg-white text-xs shadow flex items-center gap-1 font-bold"
                >
                  <Eye size={12} />
                  <span>Xem lớn</span>
                </button>
              </div>
              <div className="text-[11px] text-text font-bold truncate">{order.productTitle}</div>
            </div>

            {/* Ảnh Thợ Cắm Hoàn Thiện */}
            <div className="flex flex-col gap-2 p-3 rounded-xl border-2 border-emerald-300 bg-emerald-50/30">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <span>🌸 Ảnh Thợ Cắm Thực Tế (Thành phẩm)</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Đối tác gửi về
                </span>
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden border border-emerald-200 bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={finishedImg} alt="Ảnh hoa thành phẩm" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => window.open(finishedImg, "_blank")}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-surface/90 text-text hover:bg-white text-xs shadow flex items-center gap-1 font-bold"
                >
                  <Eye size={12} />
                  <span>Xem lớn</span>
                </button>
              </div>
              <div className="text-[11px] text-emerald-900 font-bold truncate">
                {order.partnerName || "Xưởng đối tác"} • Vừa cập nhật
              </div>
            </div>
          </div>

          {/* Khối Điểm Số AI Vision Score */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                {similarityScore}%
              </div>
              <div>
                <div className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
                  <Sparkles size={15} className="text-emerald-600" />
                  <span>Đạt Điểm Kiểm Định Tương Đồng Thị Giác (PASS)</span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  AI Multimodal Vision xác nhận độ tương đồng màu sắc, form dáng và loài hoa đạt chuẩn.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                ✓ Sẵn sàng xuất xưởng
              </span>
            </div>
          </div>

          {/* Checklist 4 tiêu chuẩn P5 */}
          <div className="p-3.5 rounded-xl border border-border bg-surface-alt flex flex-col gap-2">
            <span className="font-bold text-text text-xs flex items-center gap-1.5">
              <FileCheck size={14} className="text-red-600" />
              <span>Biên bản thẩm định 4 tiêu chí chất lượng (P5 Sổ tay):</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Đúng loài hoa, số lượng cành & màu sắc (Atomic BOM)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Đúng form dáng & phong cách gói nơ</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Đầy đủ thiệp in lời chúc mừng chính xác</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Chất lượng hoa tươi mới 100%, không dập cánh</span>
              </div>
            </div>
          </div>

          {/* Chế độ Rework nếu không đạt */}
          {isReworkMode && (
            <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 flex flex-col gap-2">
              <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                Nhập nội dung yêu cầu thợ sửa lại (Rework):
              </span>
              <textarea
                rows={2}
                placeholder="Ví dụ: Nơ thắt hơi lệch, cần thêm 2 cành baby che xốp ở góc trái, thiệp cần in lại..."
                value={reworkNotes}
                onChange={(e) => setReworkNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-amber-300 bg-surface text-text text-xs focus:outline-none focus:border-amber-500"
              />
              <div className="flex justify-end gap-2 mt-1">
                <Button variant="outline" size="sm" onClick={() => setIsReworkMode(false)}>
                  Hủy yêu cầu
                </Button>
                <Button
                  size="sm"
                  onClick={handleRework}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Gửi Yêu Cầu Sửa (Rework)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-3 sticky bottom-0 bg-surface">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            {!isReworkMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReworkMode(true)}
                className="text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 font-bold"
              >
                <AlertTriangle size={13} />
                <span>Yêu Cầu Sửa (Rework)</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={handlePass}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 px-4 shadow-sm"
            >
              <CheckCircle2 size={14} />
              <span>Duyệt Đạt QC (PASS) ➔ Giao Hàng (P6)</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
