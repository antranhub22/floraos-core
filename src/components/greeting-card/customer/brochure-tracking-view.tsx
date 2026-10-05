"use client"

import React from "react"
import useSWR from "swr"
import { apiGet } from "@/components/greeting-card/greeting-api"
import { CheckCircle2, Clock, Truck, Gift, Camera, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlowerImage } from "@/components/greeting-card/flower-image"

interface BrochureTrackingViewProps {
  orderCode: string
}

type TrackingData = {
  status: "FOUND" | "NOT_FOUND"
  order: {
    code: string
    status: string
    productionStatus: string
    deliveryStatus: string
    totalVnd: number
    paidVnd: number
    cardMessage?: string | null
    recipientName: string
    deliveryAddress: string
    finishedImageUrl?: string | null
    createdAt: string
  }
  trackingStep: {
    stepIndex: number
    title: string
    description: string
    percentage: number
  }
}

export function BrochureTrackingView({ orderCode }: BrochureTrackingViewProps) {
  // SWR: tự hỏi lại mỗi 15 giây khi tab đang mở, giữ dữ liệu cũ trong lúc chờ
  const tracking = useSWR<TrackingData>(`/api/v1/public/brochure/tracking/${orderCode}`, apiGet, {
    refreshInterval: 15_000,
  })
  const data = tracking.data?.status === "FOUND" ? tracking.data : null
  const loading = tracking.isLoading
  const loadTracking = () => void tracking.mutate()

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted">
        <RefreshCw size={32} className="animate-spin text-primary mb-3" />
        <p className="text-body font-medium">Đang tải tiến trình đơn hoa của bạn...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-text-muted">
        <p className="text-body">Không tìm thấy thông tin đơn hàng {orderCode}.</p>
      </div>
    )
  }

  const { order, trackingStep } = data
  const isPaid = order.paidVnd >= order.totalVnd

  const steps = [
    { label: "Tiếp nhận", icon: Clock },
    { label: "Cắm hoa", icon: Gift },
    { label: "Đang giao", icon: Truck },
    { label: "Hoàn tất", icon: CheckCircle2 },
  ]

  return (
    <div className="w-full max-w-lg mx-auto bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <span className="text-caption font-bold uppercase tracking-wider text-primary">
            Theo dõi tiến độ Đơn hàng
          </span>
          <h2 className="text-title font-extrabold text-foreground">
            Đơn hàng #{order.code}
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadTracking}
          className="gap-1.5 text-caption h-8"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Cập nhật</span>
        </Button>
      </div>

      {/* Progress Bar & Current Status Card */}
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-body font-extrabold text-primary">
            {trackingStep.title}
          </span>
          <span className="text-caption font-bold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full">
            {trackingStep.percentage}%
          </span>
        </div>

        <p className="text-body-sm text-text-muted">
          {trackingStep.description}
        </p>

        {/* 4 Steps Indicator */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {steps.map((s, idx) => {
            const Icon = s.icon
            const isCompleted = trackingStep.stepIndex > idx + 1 || (trackingStep.stepIndex === 4)
            const isCurrent = trackingStep.stepIndex === idx + 1

            return (
              <div key={s.label} className="flex flex-col items-center gap-1.5 text-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted
                      ? "bg-success text-white"
                      : isCurrent
                      ? "bg-primary text-white shadow-sm ring-4 ring-primary/20"
                      : "bg-surface-muted text-text-muted border border-border"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span
                  className={`text-caption font-bold ${
                    isCurrent ? "text-primary" : isCompleted ? "text-success" : "text-text-muted"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actual Finished Flower Photo Uploaded by Florist/Coordinator */}
      {order.finishedImageUrl ? (
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-muted border border-border">
          <div className="flex items-center gap-2 text-foreground font-extrabold text-body">
            <Camera size={18} className="text-primary" />
            <span>Ảnh hoa thực tế thành phẩm từ thợ cắm:</span>
          </div>
          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border shadow-sm">
            <FlowerImage src={order.finishedImageUrl} alt="Ảnh hoa thực tế" sizes="(max-width: 512px) 100vw, 512px" className="w-full h-full" />
          </div>
          <span className="text-caption text-text-muted text-center mt-1">
            Hoa đã được chụp nghiệm thu trước khi giao đến tay người nhận.
          </span>
        </div>
      ) : null}

      {/* Order Details Summary */}
      <div className="flex flex-col gap-2 text-body-sm text-text-muted bg-surface-muted p-4 rounded-xl border border-border">
        <div className="flex justify-between">
          <span>Người nhận:</span>
          <span className="font-bold text-foreground">{order.recipientName}</span>
        </div>
        <div className="flex justify-between">
          <span>Địa chỉ giao:</span>
          <span className="font-bold text-foreground text-right max-w-xs truncate">
            {order.deliveryAddress}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Thanh toán:</span>
          <span className={`font-bold ${isPaid ? "text-success" : "text-warning"}`}>
            {isPaid ? "Đã thanh toán" : "Chờ xác nhận chuyển khoản"}
          </span>
        </div>
        {order.cardMessage && (
          <div className="pt-2 border-t border-border mt-1">
            <span className="text-caption font-semibold text-text-muted block mb-0.5">
              Lời nhắn thiệp:
            </span>
            <p className="text-body-sm italic text-foreground bg-surface p-2.5 rounded-lg border border-border">
              &ldquo;{order.cardMessage}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
