"use client"

import React from "react"
import { User, Phone, MapPin, Flower2, CheckCircle2 } from "lucide-react"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import { zaloHref } from "@/components/greeting-card/work/work-item-card"
import { OrderPaymentProofView } from "./order-payment-proof-view"
import type { OrderDetailModalTarget } from "./brochure-order-detail-modal"

export interface OrderDetailInfoTabProps {
  target: OrderDetailModalTarget
}

export function OrderDetailInfoTab({ target }: OrderDetailInfoTabProps) {
  const isPaid = (target.paidVnd ?? 0) >= (target.totalVnd ?? 0) && (target.totalVnd ?? 0) > 0
  const isDeposit = (target.paidVnd ?? 0) > 0 && !isPaid

  return (
    <div className="flex flex-col gap-5">
      {/* Khối Người đặt & Người nhận */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-alt p-3.5 flex flex-col gap-1.5">
          <span className="text-caption font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
            <User size={13} /> Người đặt hoa
          </span>
          <p className="text-body-sm font-bold text-foreground">{target.customerName || "Khách lẻ"}</p>
          {target.customerPhone && (
            <div className="flex items-center gap-2 mt-1">
              <a
                href={`tel:${target.customerPhone}`}
                className="inline-flex items-center gap-1 text-caption font-bold text-primary hover:underline"
              >
                <Phone size={12} /> {target.customerPhone}
              </a>
              <a
                href={zaloHref(target.customerPhone)}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-border bg-surface px-2 py-0.5 text-caption font-bold text-info hover:bg-surface-muted"
              >
                Zalo
              </a>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface-alt p-3.5 flex flex-col gap-1.5">
          <span className="text-caption font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
            <MapPin size={13} /> Người nhận hoa
          </span>
          <p className="text-body-sm font-bold text-foreground">{target.recipientName || target.customerName || "Chưa có tên"}</p>
          {target.recipientPhone && (
            <a
              href={`tel:${target.recipientPhone}`}
              className="inline-flex items-center gap-1 text-caption font-bold text-primary hover:underline"
            >
              <Phone size={12} /> {target.recipientPhone}
            </a>
          )}
          <p className="text-caption text-text-muted mt-1 leading-relaxed">
            {target.deliveryAddress || "Chưa có địa chỉ giao hàng cụ thể"}
          </p>
        </div>
      </div>

      {/* Khối Mẫu hoa & Thiệp */}
      <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
        <span className="text-caption font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
          <Flower2 size={13} /> Mẫu hoa đã chọn
        </span>
        <div className="flex items-center gap-3">
          <FlowerImage
            src={target.productImageUrl}
            alt={target.productName || "Mẫu"}
            sizes="60px"
            fallback="icon"
            className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-body font-bold text-foreground truncate">{target.productName || "Hoa tươi theo mẫu"}</h4>
            <p className="text-body-sm font-extrabold text-primary mt-0.5">
              {(target.totalVnd ?? 0) > 0 ? `${(target.totalVnd ?? 0).toLocaleString("vi-VN")} đ` : "Chưa có giá"}
            </p>
          </div>
        </div>

        {/* Thiệp chúc mừng */}
        {target.cardMessage ? (
          <div className="rounded-xl border border-warning/30 bg-warning-bg p-3 flex flex-col gap-1 mt-1">
            <span className="text-caption font-bold text-warning-text flex items-center gap-1">
              💌 Lời chúc trên thiệp mừng:
            </span>
            <p className="text-body-sm italic text-foreground">&ldquo;{target.cardMessage}&rdquo;</p>
          </div>
        ) : (
          <p className="text-caption text-text-muted italic">Không kèm nội dung thiệp.</p>
        )}
      </div>

      {/* Khối Thanh toán */}
      <div className="rounded-2xl border border-border bg-surface-alt p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-text-muted">Tổng giá trị đơn:</span>
          <span className="text-body font-bold text-foreground">
            {(target.totalVnd ?? 0).toLocaleString("vi-VN")} đ
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-text-muted">Đã thanh toán:</span>
          <span className="text-body font-bold text-success">
            {(target.paidVnd ?? 0).toLocaleString("vi-VN")} đ
          </span>
        </div>
        {(target.balanceVnd ?? 0) > 0 && (
          <div className="flex items-center justify-between border-t border-border/60 pt-2">
            <span className="text-body-sm font-bold text-danger">Còn phải thu:</span>
            <span className="text-body font-black text-danger">
              {(target.balanceVnd ?? 0).toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-bold ${
              isPaid ? "bg-success/15 text-success" : isDeposit ? "bg-warning/15 text-warning" : "bg-danger-bg text-danger"
            }`}
          >
            <CheckCircle2 size={12} />
            {isPaid ? "Đã thanh toán đủ" : isDeposit ? "Đã thanh toán một phần (Cọc)" : "Chưa thanh toán"}
          </span>
        </div>
        {isDeposit && (target.balanceVnd ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/30 bg-warning-bg/40 p-2.5">
            <span className="text-caption font-bold text-warning-text">
              ⚠️ Đơn cọc — Cần thanh toán lần 2: {(target.balanceVnd ?? 0).toLocaleString("vi-VN")} đ
            </span>
            <button
              type="button"
              onClick={() => {
                const url = target.sendCode ? `${window.location.origin}/b/${target.sendCode}` : ""
                const msg = `Dạ chào anh/chị, hoa cho đơn #${target.orderCode || target.sendCode} đã cắm xong hoàn thiện ạ! Anh/chị mở link kiểm tra ảnh hoa và thanh toán phần còn lại ${(target.balanceVnd ?? 0).toLocaleString("vi-VN")} đ để cửa hàng tiến hành giao hoa nhé ạ:${url ? ` ${url}` : ""}`
                void navigator.clipboard.writeText(msg)
              }}
              className="rounded-lg border border-border bg-surface px-2.5 py-1 text-caption font-bold text-foreground hover:bg-surface-muted transition-colors"
            >
              📋 Chép tin nhắc khách
            </button>
          </div>
        )}

        {/* Ảnh chuyển khoản do khách tải lên */}
        <OrderPaymentProofView
          paymentProofUrl={target.paymentProofUrl}
          paymentProofBalanceUrl={target.paymentProofBalanceUrl}
        />
      </div>
    </div>
  )
}
