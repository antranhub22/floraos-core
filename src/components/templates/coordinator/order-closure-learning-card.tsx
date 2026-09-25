"use client"

import React, { useState } from "react"
import {
  Award,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  FileCheck,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface OrderClosureLearningCardProps {
  orderCode: string
  recipeTitle: string
  partnerName: string
  promisedDeliveryTime: string
  actualDeliveryTime: string
  varianceMinutes: number
  qcScore: number
  initialPartnerRating?: number | undefined
  onConfirmClosure?: (review: { partnerRating: number; reviewNote: string }) => void
}

export function OrderClosureLearningCard({
  orderCode,
  recipeTitle,
  partnerName,
  promisedDeliveryTime,
  actualDeliveryTime,
  varianceMinutes,
  qcScore,
  initialPartnerRating = 5,
  onConfirmClosure,
}: OrderClosureLearningCardProps) {
  const [rating, setRating] = useState<number>(initialPartnerRating)
  const [reviewNote, setReviewNote] = useState("Hoa cắm đúng mẫu Master Index, giao đúng hẹn.")
  const isOntime = varianceMinutes <= 0

  const handleComplete = () => {
    onConfirmClosure?.({ partnerRating: rating, reviewNote })
  }

  return (
    <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-dashed border-emerald-200 pb-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
            Nghiệm Thu Vận Hành & Học Máy Đơn Hàng (T25 / T26 / T27)
          </div>
          <h3 className="text-lg font-extrabold text-text">
            Đóng Đơn #{orderCode}: {recipeTitle}
          </h3>
        </div>
        <Badge tone={isOntime ? "success" : "warning"} className="font-bold px-3 py-1 text-xs">
          {isOntime ? "GIAO ĐÚNG HẸN SLA" : `TRỄ HẸN ${varianceMinutes} PHÚT`}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-surface border border-border flex flex-col gap-1">
          <span className="text-text-muted font-medium flex items-center gap-1">
            <Clock size={12} />
            Thời gian cam kết:
          </span>
          <span className="font-extrabold text-text">{promisedDeliveryTime}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-border flex flex-col gap-1">
          <span className="text-text-muted font-medium flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Thực tế giao hoa:
          </span>
          <span className="font-extrabold text-emerald-800">{actualDeliveryTime}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-border flex flex-col gap-1">
          <span className="text-text-muted font-medium flex items-center gap-1">
            <Award size={12} className="text-amber-500" />
            Điểm kiểm định AI QC:
          </span>
          <span className="font-extrabold text-amber-700">{qcScore}/100 Điểm</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surface border border-border flex flex-col gap-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-text">Đánh giá chất lượng cắm hoa của đối tác ({partnerName}):</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  size={16}
                  className={star <= rating ? "text-amber-500 fill-amber-500" : "text-neutral-300"}
                />
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          placeholder="Nhận xét vận hành (ghi nhận vào hồ sơ đối tác M11)..."
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-dashed border-emerald-200">
        <div className="text-[11.5px] text-text-muted flex items-center gap-1">
          <TrendingUp size={13} className="text-emerald-600" />
          <span>Tự động cập nhật CRM Khách hàng (M09) & Hiệu suất thợ (M11)</span>
        </div>

        {onConfirmClosure && (
          <Button onClick={handleComplete} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs">
            <FileCheck size={14} />
            <span>Nghiệm Thu Hoàn Tất & Đóng Hồ Sơ</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
