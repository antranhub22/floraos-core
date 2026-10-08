"use client"

import React, { useState } from "react"
import { Heart, Sparkles, RefreshCw, FileText, ArrowRight, CheckCircle2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CustomerThankYouCardProps {
  orderCode: string
  sendCode?: string | null | undefined
  onViewOrderInfo: () => void
  onViewProgress: () => void
  onReorder: () => void
}

export function CustomerThankYouCard({
  orderCode,
  sendCode,
  onViewOrderInfo,
  onViewProgress,
  onReorder,
}: CustomerThankYouCardProps) {
  return (
    <section
      aria-label="Cảm ơn quý khách"
      className="w-full overflow-hidden rounded-3xl border border-primary/20 bg-surface shadow-md flex flex-col"
    >
      {/* Banner cảm ơn trang trọng */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/15 via-primary/5 to-surface p-6 sm:p-8 text-center flex flex-col items-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
          <Heart size={32} className="animate-pulse fill-primary/20" />
        </div>

        <span className="rounded-full bg-primary/15 px-3 py-1 text-caption font-extrabold uppercase tracking-wider text-primary">
          Đơn hàng đã hoàn tất thành công
        </span>

        <h3 className="mt-3 text-title font-black text-foreground sm:text-2xl">
          Cảm ơn bạn đã tin chọn chúng tôi!
        </h3>

        <p className="mt-2 max-w-md text-body-sm text-text-muted leading-relaxed">
          Đơn hoa <strong className="text-foreground">#{orderCode}</strong> đã được trao gửi trọn vẹn yêu thương đến người nhận. Sự hài lòng của bạn là niềm vinh hạnh lớn nhất của tiệm hoa.
        </p>

        {/* 3 Nút Tác vụ chính */}
        <div className="mt-6 flex w-full max-w-sm flex-col gap-2.5">
          {/* Nút 1: Xem lại thông tin đơn hàng */}
          <Button
            type="button"
            variant="outline"
            onClick={onViewOrderInfo}
            className="h-11 w-full justify-center gap-2 rounded-xl border-border bg-surface text-body-sm font-bold text-foreground hover:bg-surface-muted cursor-pointer"
          >
            <FileText size={16} className="text-primary" />
            <span>Xem lại thông tin đơn hàng</span>
          </Button>

          {/* Nút 2: Theo dõi tiến độ */}
          <Button
            type="button"
            variant="secondary"
            onClick={onViewProgress}
            className="h-11 w-full justify-center gap-2 rounded-xl text-body-sm font-bold text-foreground hover:bg-surface-muted cursor-pointer"
          >
            <CheckCircle2 size={16} className="text-success" />
            <span>Theo dõi tiến độ & Bằng chứng</span>
          </Button>

          {/* Nút 3: Đặt đơn mới */}
          <Button
            type="button"
            variant="primary"
            onClick={onReorder}
            className="h-12 w-full justify-center gap-2 rounded-xl bg-primary text-body font-extrabold text-white shadow-md hover:bg-primary-dark cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Đặt đơn mới</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </section>
  )
}
