"use client"

import React, { useEffect, useState } from "react"
import { X, Clock, MapPin, User, Phone, Flower2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import { EvidenceTimelineDiagram } from "./evidence-timeline-diagram"
import { OrderHistoryPanel } from "./tracking/views/timeline-view"
import { zaloHref } from "@/components/greeting-card/work/work-item-card"
import { OrderDetailFooter } from "./order-detail-footer"
import { StaffNametagGroup } from "./staff-nametag"
import { OrderDetailInfoTab } from "./order-detail-info-tab"
import { BrochureFloristJobTab } from "./brochure-florist-job-tab"

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
  flowersSummary?: string | null | undefined
  totalVnd?: number | null | undefined
  paidVnd?: number | null | undefined
  balanceVnd?: number | null | undefined
  saleId?: string | null | undefined
  saleName?: string | null | undefined
  coordinatorId?: string | null | undefined
  coordinatorName?: string | null | undefined
  /** ID bước pipeline hiện tại — dùng để kiểm tra rào chắn hủy */
  currentStepId?: string | null | undefined
  currentStepTitle?: string | null | undefined
  /** Trạng thái sản xuất (WAITING | ARRANGING | READY ...) */
  productionStatus?: string | null | undefined
  deliveryStatus?: string | null | undefined
  status?: string | null | undefined
  channel?: string | null | undefined
  /** Ảnh chuyển khoản lần 1 (cọc/trả đủ) do khách tải lên */
  paymentProofUrl?: string | null | undefined
  paymentProofAnalysis?: import("@/modules/greeting-card/domain/payment-proof-analysis").PaymentProofAnalysisResult | null | undefined
  /** Ảnh chuyển khoản lần 2 (phần còn lại) do khách tải lên */
  paymentProofBalanceUrl?: string | null | undefined
  paymentProofBalanceAnalysis?: import("@/modules/greeting-card/domain/payment-proof-analysis").PaymentProofAnalysisResult | null | undefined
  /** Khách đã bấm báo chuyển khoản / có ảnh bill lần 2 */
  customerReportedPaid?: boolean | undefined
  createdAt?: string | null | undefined
}

export interface BrochureOrderDetailModalProps {
  target: OrderDetailModalTarget | null
  onClose: () => void
  onOpenNotes?: ((target: OrderDetailModalTarget) => void) | undefined
  /** Callback khi Sale đề xuất hủy/hoàn thành công — tải lại danh sách */
  onCancellationProposed?: (() => void) | undefined
}

export function BrochureOrderDetailModal({ target, onClose, onOpenNotes, onCancellationProposed }: BrochureOrderDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "timeline" | "florist">("info")
  useEffect(() => {
    if (!target) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [target, onClose])

  if (!target) return null

  const isPaid = (target.paidVnd ?? 0) >= (target.totalVnd ?? 0) && (target.totalVnd ?? 0) > 0
  const isDeposit = (target.paidVnd ?? 0) > 0 && !isPaid
  const canShowFloristJob = isPaid || isDeposit

  return (
    <>
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
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-title-sm font-extrabold text-foreground">
                {target.orderCode ? `#${target.orderCode}` : `Link ${target.sendCode}`}
              </span>
              {target.currentStepTitle && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-caption font-bold text-primary">
                  {target.currentStepTitle}
                </span>
              )}
              <StaffNametagGroup
                item={{
                  currentStepId: target.currentStepId ?? undefined,
                  productionStatus: target.productionStatus,
                  deliveryStatus: target.deliveryStatus,
                  saleId: target.saleId,
                  saleName: target.saleName ?? undefined,
                  coordinatorId: target.coordinatorId,
                  coordinatorName: target.coordinatorName ?? undefined,
                }}
              />
            </div>
            <p className="text-caption text-text-muted">
              Khách hàng: <strong className="text-foreground">{target.customerName || "Khách lẻ"}</strong>
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

        {/* Tab switcher: Chi tiết & Sơ đồ lịch sử & Thẻ gia công */}
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
            Lịch sử đơn hàng
          </button>
          {canShowFloristJob && (
            <button
              type="button"
              onClick={() => setActiveTab("florist")}
              className={`border-b-2 px-4 py-2 text-body-sm font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === "florist" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-foreground"
              }`}
            >
              Thẻ gia công
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "timeline" ? (
            <div className="flex flex-col gap-5">
            <OrderHistoryPanel orderId={target.orderId} sessionId={target.sessionId} />
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
            </div>
          ) : activeTab === "florist" ? (
            <BrochureFloristJobTab
              target={target}
              onClose={onClose}
              onAcceptedOrRejected={onCancellationProposed}
            />
          ) : (
            <OrderDetailInfoTab target={target} />
          )}
        </div>

        {/* Footer Actions */}
        {activeTab !== "florist" && (
          <OrderDetailFooter
            target={target}
            onClose={onClose}
            onOpenNotes={onOpenNotes}
            onCancellationProposed={onCancellationProposed}
          />
        )}
      </div>
    </div>
    </>
  )
}
