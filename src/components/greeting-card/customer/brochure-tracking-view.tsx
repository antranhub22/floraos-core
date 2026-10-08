"use client"

import { MediaGallery } from "@/components/greeting-card/media-gallery"
import React, { useState } from "react"
import useSWR from "swr"
import { apiGet, apiSend } from "@/components/greeting-card/greeting-api"
import { TrackingVerifyForm } from "./tracking-verify-form"
import { CheckCircle2, Clock, Truck, Gift, Camera, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BrochureTrackingViewProps {
  orderCode: string
  /** Mã link của chính khách — có thì máy chủ trả bản đầy đủ, không cần nhập SĐT. */
  sendCode?: string | null | undefined
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
    /** `false` = bản rút gọn cho người chỉ biết mã đơn */
    verified?: boolean
    recipientName: string
    deliveryAddress: string
    finishedImageUrl?: string | null
    productPhotoUrls?: string[]
    recipientPhotoUrls?: string[]
    photoApproval?: {
      status: "NONE" | "PENDING" | "APPROVED" | "AUTO_APPROVED"
      uploadedAt: string | null
      countdownMinutes: number
      approvedAt: string | null
    }
    createdAt: string
    timeline?: {
      arranging?: { displayRange: string }
      readyQc?: { displayRange: string }
      delivering?: { displayRange: string }
    } | null
  }
  trackingStep: {
    stepIndex: number
    title: string
    description: string
    percentage: number
  }
}

export function BrochureTrackingView({ orderCode, sendCode }: BrochureTrackingViewProps) {
  const base = `/api/v1/public/brochure/tracking/${encodeURIComponent(orderCode)}`
  // Đã xác minh bằng 4 số cuối SĐT: hỏi bằng POST, không tự hỏi lại (máy chủ giới hạn số lần thử)
  const [last4, setLast4] = useState<string | null>(null)
  const key = last4 ? [base, last4] : `${base}${sendCode ? `?link=${encodeURIComponent(sendCode)}` : ""}`
  const tracking = useSWR<TrackingData>(
    key,
    (k: string | string[]) => (Array.isArray(k) ? apiSend<TrackingData>(k[0]!, "POST", { phoneLast4: k[1] }) : apiGet<TrackingData>(k)),
    { refreshInterval: last4 ? 0 : 15_000 },
  )
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
  const productPhotos = order.productPhotoUrls ?? (order.finishedImageUrl ? [order.finishedImageUrl] : [])
  const recipientPhotos = order.recipientPhotoUrls ?? []
  const awaitingQuote = order.totalVnd <= 0
  const isPaid = !awaitingQuote && order.paidVnd >= order.totalVnd

  const steps = [
    { label: "Tiếp nhận", icon: Clock },
    { label: "Cắm hoa", icon: Gift },
    { label: "Đang giao", icon: Truck },
    { label: "Hoàn tất", icon: CheckCircle2 },
  ]

  return (
    <div className="w-full max-w-xl lg:max-w-2xl mx-auto bg-surface rounded-2xl border border-border p-5 sm:p-7 shadow-sm flex flex-col gap-6">
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

        {/* 4 Steps Indicator with Actual & Expected Timeline (Spec #12) */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {steps.map((s, idx) => {
            const Icon = s.icon
            const isCompleted = trackingStep.stepIndex > idx + 1 || (trackingStep.stepIndex === 4)
            const isCurrent = trackingStep.stepIndex === idx + 1

            // Spec #12: Tiếp nhận = thời điểm thực tế; Các bước sau = khoảng thời gian dự kiến
            let stepTimeLabel = ""
            if (idx === 0) {
              const dt = new Date(order.createdAt)
              stepTimeLabel = !Number.isNaN(dt.getTime())
                ? `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
                : ""
            } else if (idx === 1 && order.timeline?.arranging) {
              stepTimeLabel = order.timeline.arranging.displayRange
            } else if (idx === 2 && order.timeline?.delivering) {
              stepTimeLabel = order.timeline.delivering.displayRange
            }

            return (
              <div key={s.label} className="flex flex-col items-center gap-1 text-center">
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
                {stepTimeLabel && (
                  <span className="text-caption font-medium text-text-muted leading-tight">
                    {stepTimeLabel}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Ảnh thành phẩm và ảnh người nhận: hai mục riêng, ảnh sau không đè ảnh trước */}
      {productPhotos.length > 0 && (
        <section className="flex flex-col gap-3 p-4 rounded-2xl bg-surface-muted border border-border">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-foreground font-extrabold text-body">
              <Camera size={18} className="text-primary" aria-hidden="true" />
              Ảnh hoa thành phẩm
            </h3>
            {order.photoApproval?.status === "APPROVED" && (
              <span className="text-caption font-bold text-success bg-success/15 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Bạn đã xác nhận ảnh
              </span>
            )}
            {order.photoApproval?.status === "AUTO_APPROVED" && (
              <span className="text-caption font-bold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Tự động xác nhận
              </span>
            )}
          </div>

          <MediaGallery urls={productPhotos} label="Ảnh hoa thành phẩm" />
          <p className="text-caption text-text-muted">Hoa được chụp nghiệm thu trước khi giao.</p>

          {/* KHUNG XÁC NHẬN HÌNH ẢNH SẢN PHẨM & ĐỒNG HỒ ĐẾM NGƯỢC (SPEC #3) */}
          {sendCode && order.photoApproval?.status === "PENDING" && order.photoApproval.uploadedAt && (
            <PhotoApprovalCard
              orderCode={order.code}
              sendCode={sendCode}
              uploadedAt={order.photoApproval.uploadedAt}
              countdownMinutes={order.photoApproval.countdownMinutes}
              onApproved={() => void loadTracking()}
            />
          )}
        </section>
      )}
      {recipientPhotos.length > 0 && (
        <section className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-muted border border-border">
          <h3 className="flex items-center gap-2 text-foreground font-extrabold text-body">
            <Camera size={18} className="text-success" aria-hidden="true" />
            Ảnh người nhận
          </h3>
          <MediaGallery urls={recipientPhotos} label="Ảnh người nhận" />
          <p className="text-caption text-text-muted">Hoa đã được trao tận tay người nhận.</p>
        </section>
      )}

      {order.verified === false && <TrackingVerifyForm orderCode={orderCode} onVerified={setLast4} />}

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
            {awaitingQuote ? "Chờ cửa hàng báo giá" : isPaid ? "Đã thanh toán" : "Chờ xác nhận chuyển khoản"}
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

function PhotoApprovalCard({
  orderCode,
  sendCode,
  uploadedAt,
  countdownMinutes,
  onApproved,
}: {
  orderCode: string
  sendCode?: string | null | undefined
  uploadedAt: string
  countdownMinutes: number
  onApproved: () => void
}) {
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expireTime = Date.parse(uploadedAt) + countdownMinutes * 60_000
  const [timeLeftMs, setTimeLeftMs] = useState(() => Math.max(0, expireTime - Date.now()))

  React.useEffect(() => {
    if (timeLeftMs <= 0) return
    const timer = setInterval(() => {
      const left = Math.max(0, expireTime - Date.now())
      setTimeLeftMs(left)
      if (left <= 0) {
        clearInterval(timer)
        onApproved()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [expireTime, onApproved, timeLeftMs])

  async function handleApprove() {
    setApproving(true)
    setError(null)
    try {
      const url = `/api/v1/public/brochure/tracking/${encodeURIComponent(orderCode)}/approve-photo${
        sendCode ? `?link=${encodeURIComponent(sendCode)}` : ""
      }`
      await apiSend(url, "POST", {})
      onApproved()
    } catch {
      setError("Không thể xác nhận, vui lòng thử lại")
    } finally {
      setApproving(false)
    }
  }

  const totalSec = Math.floor(timeLeftMs / 1000)
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0")
  const ss = String(totalSec % 60).padStart(2, "0")

  return (
    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col gap-3 mt-1">
      <div className="flex items-center justify-between">
        <span className="text-body-sm font-extrabold text-foreground flex items-center gap-1.5">
          <Clock size={16} className="text-primary animate-pulse" />
          <span>Xác nhận hình ảnh sản phẩm</span>
        </span>
        <span className="text-body-sm font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg tabular-nums">
          {mm}:{ss}
        </span>
      </div>

      <p className="text-caption text-text-muted leading-relaxed">
        Vui lòng xem kỹ ảnh hoa thành phẩm ở trên. Sau khi đồng hồ kết thúc, hệ thống sẽ{" "}
        <strong>tự động xác nhận</strong> để xưởng tiến hành bàn giao đơn cho tài xế giao hoa.
      </p>

      {error && <p className="text-caption text-danger">{error}</p>}

      <Button
        type="button"
        size="sm"
        onClick={() => void handleApprove()}
        disabled={approving || timeLeftMs <= 0}
        className="h-10 w-full gap-1.5 rounded-xl font-bold bg-primary text-white"
      >
        <CheckCircle2 size={16} />
        <span>{approving ? "Đang xác nhận..." : "Tôi đồng ý với hình ảnh sản phẩm này"}</span>
      </Button>
    </div>
  )
}
