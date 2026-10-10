"use client"

import React from "react"
import { FlowerImage } from "@/components/greeting-card/flower-image"

interface OrderPaymentProofViewProps {
  paymentProofUrl?: string | null | undefined
  paymentProofBalanceUrl?: string | null | undefined
}

export function OrderPaymentProofView({
  paymentProofUrl,
  paymentProofBalanceUrl,
}: OrderPaymentProofViewProps) {
  if (!paymentProofUrl && !paymentProofBalanceUrl) return null

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
      <span className="text-caption font-bold text-text-muted flex items-center gap-1">
        📸 Ảnh chuyển khoản của khách:
      </span>
      <div className="flex flex-wrap items-center gap-3">
        {paymentProofUrl && (
          <div className="flex flex-col gap-1">
            <span className="text-caption text-text-muted">Lần 1 (Cọc/Trả đủ)</span>
            <a
              href={paymentProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-20 w-20 rounded-xl border border-border overflow-hidden bg-surface hover:opacity-90 transition-opacity block group cursor-pointer"
            >
              <FlowerImage
                src={paymentProofUrl}
                alt="Ảnh chuyển khoản lần 1"
                className="h-20 w-20"
                sizes="80px"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-caption font-bold">
                Xem
              </div>
            </a>
          </div>
        )}
        {paymentProofBalanceUrl && (
          <div className="flex flex-col gap-1">
            <span className="text-caption text-text-muted">Lần 2 (Phần còn lại)</span>
            <a
              href={paymentProofBalanceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-20 w-20 rounded-xl border border-border overflow-hidden bg-surface hover:opacity-90 transition-opacity block group cursor-pointer"
            >
              <FlowerImage
                src={paymentProofBalanceUrl}
                alt="Ảnh chuyển khoản lần 2"
                className="h-20 w-20"
                sizes="80px"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-caption font-bold">
                Xem
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
