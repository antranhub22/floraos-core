"use client"

import React, { useState } from "react"
import { X, Calendar, Clock, MapPin, User, Phone, Flower2, HeartHandshake, ShieldAlert, CheckCircle2, MessageSquare, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import { EvidenceTimelineDiagram } from "./evidence-timeline-diagram"
import { zaloHref } from "@/components/greeting-card/work/work-item-card"

export interface OrderDetailModalTarget {
  orderId?: string | null | undefined
  sessionId?: string | null | undefined
  orderCode?: string | null | undefined
  sendCode?: string | null | undefined
  customerName?: string | null | undefined
  customerPhone?: string | null | undefined
  recipientName?: string | null | undefined
  recipientPhone?: string | null | undefined
  deliveryAddress?: string | null | undefined
  deliveryDate?: string | null | undefined
  deliveryTimeSlot?: string | null | undefined
  deliveryZone?: string | null | undefined
  cardMessage?: string | null | undefined
  productName?: string | null | undefined
  productImageUrl?: string | null | undefined
  totalVnd?: number | null | undefined
  paidVnd?: number | null | undefined
  balanceVnd?: number | null | undefined
  saleName?: string | null | undefined
  currentStepTitle?: string | null | undefined
  status?: string | null | undefined
  channel?: string | null | undefined
  createdAt?: string | null | undefined
}

interface BrochureOrderDetailModalProps {
  target: OrderDetailModalTarget | null
  onClose: () => void
  onOpenNotes?: ((target: OrderDetailModalTarget) => void) | undefined
}

export function BrochureOrderDetailModal({ target, onClose, onOpenNotes }: BrochureOrderDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "timeline">("info")

  if (!target) return null

  const isPaid = (target.paidVnd ?? 0) >= (target.totalVnd ?? 0) && (target.totalVnd ?? 0) > 0
  const isDeposit = (target.paidVnd ?? 0) > 0 && !isPaid

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border p-5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono text-title-sm font-extrabold text-foreground">
                {target.orderCode ? `#${target.orderCode}` : `Link ${target.sendCode}`}
              </span>
              {target.currentStepTitle && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-caption font-bold text-primary">
                  {target.currentStepTitle}
                </span>
              )}
            </div>
            <p className="text-caption text-text-muted mt-0.5">
              Khách hàng: <strong className="text-foreground">{target.customerName || "Khách lẻ"}</strong>
              {target.saleName && ` · Sale: ${target.saleName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-xl p-1.5 text-text-muted hover:bg-surface-alt hover:text-foreground"
          >
            <X size={20} />
          </button>
        </header>

        {/* MỐC THỜI GIAN GIAO HÀNG TO NỔI BẬT */}
        <div className="border-b border-border bg-primary/5 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-primary">
              <Clock size={20} className="shrink-0" />
              <div>
                <span className="text-caption font-bold uppercase tracking-wider text-text-muted block">
                  Khung giờ giao hàng
                </span>
                <span className="text-body font-black text-primary">
                  {target.deliveryTimeSlot || "Trong ngày"}
                  {target.deliveryDate ? ` · Ngày ${target.deliveryDate}` : ""}
                </span>
              </div>
            </div>
            {target.deliveryZone && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-surface px-2.5 py-1 text-caption font-bold text-primary">
                <MapPin size={13} />
                {target.deliveryZone}
              </span>
            )}
          </div>
        </div>

        {/* Tab switcher: Chi tiết & Sơ đồ lịch sử */}
        <div className="flex border-b border-border px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`border-b-2 px-4 py-2 text-body-sm font-bold transition-colors ${
              activeTab === "info" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-foreground"
            }`}
          >
            Thông tin đơn hàng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`border-b-2 px-4 py-2 text-body-sm font-bold transition-colors ${
              activeTab === "timeline" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-foreground"
            }`}
          >
            Sơ đồ Lịch sử Milestones
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "timeline" ? (
            <EvidenceTimelineDiagram
              orderId={target.orderId}
              sessionId={target.sessionId}
              orderCode={target.orderCode}
              customerName={target.customerName}
              customerPhone={target.customerPhone}
              recipientName={target.recipientName}
              recipientPhone={target.recipientPhone}
              deliveryAddress={target.deliveryAddress}
              deliveryTimeSlot={target.deliveryTimeSlot}
              productName={target.productName}
              totalVnd={target.totalVnd}
              paidVnd={target.paidVnd}
            />
          ) : (
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
                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 flex flex-col gap-1 mt-1">
                    <span className="text-caption font-bold text-amber-900 flex items-center gap-1">
                      💌 Lời chúc trên thiệp mừng:
                    </span>
                    <p className="text-body-sm italic text-amber-950">&ldquo;{target.cardMessage}&rdquo;</p>
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
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-alt p-4">
          <div className="flex items-center gap-2">
            {target.sendCode && (
              <a
                href={`/b/${target.sendCode}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-caption font-bold text-foreground hover:bg-surface"
              >
                <ExternalLink size={14} /> Mở link khách
              </a>
            )}
            {onOpenNotes && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onOpenNotes(target)
                }}
                className="h-9 gap-1 text-caption font-bold"
              >
                <MessageSquare size={14} /> Nhắn tin / Ghi chú
              </Button>
            )}
          </div>
          <Button type="button" onClick={onClose} className="h-9 px-4 text-caption font-bold">
            Đóng
          </Button>
        </footer>
      </div>
    </div>
  )
}
