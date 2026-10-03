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
    <Card className="rounded-2xl border border-mint-200 bg-mint-50/40 p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-dashed border-mint-200 pb-4">
        <div>
          <div className="text-caption font-bold uppercase tracking-wider text-mint-900">
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
            <CheckCircle2 size={12} className="text-mint-600" />
            Thực tế giao hoa:
          </span>
          <span className="font-extrabold text-mint-800">{actualDeliveryTime}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-border flex flex-col gap-1">
          <span className="text-text-muted font-medium flex items-center gap-1">
            <Award size={12} className="text-sand-500" />
            Điểm kiểm định AI QC:
          </span>
          <span className="font-extrabold text-sand-700">{qcScore}/100 Điểm</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surface border border-border flex flex-col gap-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-text">Đánh giá chất lượng cắm hoa của đối tác ({partnerName}):</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
              aria-label="Đánh dấu yêu thích"
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  size={16}
                  className={star <= rating ? "text-sand-500 fill-sand-500" : "text-cool-300"}
                />
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          placeholder="Nhận xét vận hành (ghi nhận vào hồ sơ đối tác Tín dụng AI)..."
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-mint-500"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-dashed border-mint-200">
        <div className="text-caption text-text-muted flex items-center gap-1">
          <TrendingUp size={13} className="text-mint-600" />
          <span>Tự động cập nhật CRM Khách hàng (Đơn hàng) & Hiệu suất thợ (Tín dụng AI)</span>
        </div>

        {onConfirmClosure && (
          <Button onClick={handleComplete} className="bg-mint-600 hover:bg-mint-700 text-white font-bold gap-1.5 text-xs">
            <FileCheck size={14} />
            <span>Nghiệm Thu Hoàn Tất & Đóng Hồ Sơ</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
