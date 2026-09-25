"use client"

import React from "react"
import { CheckCircle2, XCircle, RotateCcw, Sparkles, Check, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface AIQCReportCardProps {
  orderCode: string
  qcStatus: "PENDING" | "PASSED" | "REJECTED" | "REWORK_REQUESTED"
  aiScore?: number | null
  aiCritique?: string | null
  finishedImageUrls?: string[]
  checklist?: {
    flowerMatchScore: number
    colorToneMatch: boolean
    wrappingMatch: boolean
    ribbonMatch: boolean
    cardMessageAccurate: boolean
  } | null
  reworkInstructions?: string | null
  onApprove?: () => void
  onRequestRework?: () => void
}

export function AIQCReportCard({
  orderCode,
  qcStatus,
  aiScore = 90,
  aiCritique,
  finishedImageUrls = [],
  checklist,
  reworkInstructions,
  onApprove,
  onRequestRework,
}: AIQCReportCardProps) {
  const isPassed = qcStatus === "PASSED"
  const isRework = qcStatus === "REWORK_REQUESTED"

  return (
    <Card className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-dashed border-border pb-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Kiểm Định Chất Lượng Thành Phẩm (T14 / T15)
          </div>
          <h3 className="text-lg font-extrabold text-text">
            Báo cáo AI QC Đơn #{orderCode}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            tone={isPassed ? "success" : isRework ? "warning" : "neutral"}
            className="font-bold px-3 py-1 text-xs"
          >
            {isPassed ? "ĐẠT CHUẨN (PASS)" : isRework ? "YÊU CẦU CẮM LẠI" : "CHỜ KIỂM ĐỊNH"}
          </Badge>
          {aiScore !== null && aiScore !== undefined && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs">
              <Sparkles size={13} className="text-emerald-600" />
              <span>{aiScore}/100 Điểm</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-text-muted">ẢNH HOA THÀNH PHẨM (THỢ GỬI)</span>
          {finishedImageUrls.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {finishedImageUrls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-surface-alt">
                  <img src={url} alt={`Hoa thành phẩm ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-dashed border-border text-center text-xs text-text-muted">
              Chưa có ảnh thành phẩm từ thợ
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-bold text-text-muted block mb-2">TIÊU CHÍ ĐỐI CHIẾU MASTER INDEX</span>
            <div className="rounded-xl border border-border bg-surface-alt p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text font-medium">Khớp loài hoa & số lượng cành (BOM):</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check size={14} />
                  {checklist?.flowerMatchScore || 95}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text font-medium">Đúng tone màu & ánh sắc:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check size={14} />
                  {checklist?.colorToneMatch !== false ? "Đạt" : "Lệch tone"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text font-medium">Đúng chất liệu giấy gói & nơ:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check size={14} />
                  {checklist?.wrappingMatch !== false ? "Đạt" : "Sai loại giấy"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text font-medium">Thiệp chúc mừng đầy đủ, chính xác:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check size={14} />
                  {checklist?.cardMessageAccurate !== false ? "Đạt" : "Chưa có thiệp"}
                </span>
              </div>
            </div>
          </div>

          {aiCritique && (
            <div className="p-3.5 rounded-xl bg-surface-alt border border-border text-xs">
              <span className="font-bold text-text block mb-1">🤖 Đánh giá của AI Vision:</span>
              <p className="text-text-muted leading-relaxed">{aiCritique}</p>
            </div>
          )}

          {reworkInstructions && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <span className="font-bold block mb-1 flex items-center gap-1 text-amber-950">
                <AlertTriangle size={14} className="text-amber-600" />
                Hướng dẫn chỉnh sửa / cắm lại:
              </span>
              <p>{reworkInstructions}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-dashed border-border">
        {onRequestRework && (
          <Button variant="outline" size="sm" onClick={onRequestRework} className="gap-1.5 text-amber-800 border-amber-300 hover:bg-amber-50">
            <RotateCcw size={14} />
            <span>Yêu cầu sửa / Cắm lại</span>
          </Button>
        )}
        {onApprove && (
          <Button size="sm" onClick={onApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-bold">
            <CheckCircle2 size={15} />
            <span>Chốt Duyệt QC & Bàn Giao Shipper</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
