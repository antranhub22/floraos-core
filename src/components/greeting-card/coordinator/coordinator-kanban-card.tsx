"use client"

import { PhotoApprovalNote } from "./photo-approval-note"
import React from "react"
import { Clock, ShieldCheck, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BrochureOrder, ModalState } from "./coordinator-order-card"
import type { BrochurePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import type { TrackingPipelineItem } from "@/modules/greeting-card/domain/tracking-pipeline-types"
import type { OrderTimeTier } from "@/modules/greeting-card/domain/order-time-tier"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import { coordinatorAcceptanceBlocker } from "@/modules/greeting-card/domain/brochure-commerce-rules"
import { coordinatorBlockerOf } from "@/modules/greeting-card/domain/coordinator-card-actions"
import { CoordinatorCardActions } from "./coordinator-card-actions"
import { coordinatorFactsOf } from "./coordinator-order-facts"
import { DeliveryFailureNote } from "./delivery-failure-note"
import { StaffNametagGroup } from "@/components/greeting-card/staff-nametag"
import type { CoordinatorKanbanColDef } from "./coordinator-kanban-view"
import { isUrgentOrder } from "@/modules/greeting-card/domain/brochure-workflow-policy"

interface CoordinatorKanbanCardProps {
  order: BrochureOrder
  col: CoordinatorKanbanColDef
  tier: OrderTimeTier
  work?: TrackingPipelineItem | undefined
  policy: BrochurePaymentPolicy
  onOpen: (m: ModalState) => void
  onOpenDetail: () => void
  /** Giờ hiện tại (tick từ tab) — đếm ngược chờ khách duyệt ảnh */
  now: number
}

export function CoordinatorKanbanCard({
  order: o,
  col,
  tier,
  work,
  policy,
  onOpen,
  onOpenDetail,
  now,
}: CoordinatorKanbanCardProps) {
  const { product } = o
  const isStuck = work?.stuck?.owner === "COORDINATOR"

  const isUrgent = isUrgentOrder({
    deliveryDate: o.delivery_window?.date,
    deliveryTimeSlot: o.delivery_window?.timeSlot,
  })
  // Cùng hàm chặn với Lưới thẻ và máy chủ (policy = chính sách hiệu lực theo Quy trình vận hành)
  const blockerOf = coordinatorBlockerOf(coordinatorFactsOf(o), policy, { isUrgent, nowMs: now })
  const acceptBlocker = coordinatorAcceptanceBlocker(
    { status: o.status, productionStatus: o.production_status, deliveryStatus: o.delivery_status },
    { paidVnd: o.paid_vnd, paymentProofUrl: work?.paymentProofUrl || o.payment_proof_url },
  )

  // Viền và nền theo tầng thời gian
  let tierBorder = "border-border"
  let tierBadge = null

  if (tier === "OVERDUE" || isStuck) {
    tierBorder = "border-danger/60 bg-danger-bg/10"
    tierBadge = (
      <span className="rounded-md bg-danger-bg px-1.5 py-0.5 text-caption font-extrabold text-danger shrink-0">
        Quá hạn
      </span>
    )
  } else if (tier === "URGENT") {
    tierBorder = "border-warning/70 bg-warning-bg/15 shadow-sm"
    tierBadge = (
      <span className="rounded-md bg-warning-bg px-1.5 py-0.5 text-caption font-extrabold text-warning shrink-0 animate-pulse">
        Sắp đến hạn
      </span>
    )
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border bg-surface p-3 text-left shadow-xs transition-shadow hover:shadow-md ${tierBorder}`}
    >
      {/* Clickable Card Body to open detail modal */}
      <button
        type="button"
        onClick={onOpenDetail}
        className="flex flex-col gap-2 text-left w-full cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-1 border-b border-border/60 pb-1.5 w-full">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-caption font-bold text-foreground group-hover:text-primary transition-colors">
              #{o.code}
            </span>
            {o.greeting_sessions[0]?.send_code && (
              <span className="font-mono text-caption text-text-muted bg-surface-alt px-1.5 py-0.5 rounded">
                {o.greeting_sessions[0].send_code}
              </span>
            )}
            {tierBadge}
          </div>
          <span className="text-caption font-extrabold text-primary shrink-0">
            {o.total_vnd.toLocaleString("vi-VN")} đ
          </span>
        </div>

        <StaffNametagGroup
          item={work}
          fallbackSaleName={o.saleName}
          fallbackSaleId={o.saleId}
          fallbackCoordinatorName={o.coordinatorName}
          fallbackCoordinatorId={o.coordinatorId}
          forceStage="coordinator"
          compact
        />

        {/* MỐC THỜI GIAN GIAO HÀNG */}
        <div
          className={`rounded-lg px-2.5 py-1 text-caption font-extrabold flex items-center gap-1.5 w-full ${
            tier === "OVERDUE"
              ? "bg-danger-bg text-danger border border-danger/30"
              : tier === "URGENT"
              ? "bg-warning-bg text-warning border border-warning/40"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}
        >
          <Clock size={13} className="shrink-0" />
          <span className="truncate">
            Giao: {o.delivery_window?.timeSlot || "Trong ngày"}
            {o.delivery_window?.date ? ` · ${o.delivery_window.date}` : ""}
          </span>
        </div>

        <div className="flex gap-2 items-center w-full">
          <FlowerImage
            src={product.imageUrl}
            alt={product.name}
            sizes="40px"
            fallback="icon"
            className="w-10 h-10 rounded-lg border border-border shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-caption font-semibold text-foreground truncate">
              {product.name}
            </p>
            <p className="text-caption text-text-muted truncate">
              Nhận: {o.delivery_address?.recipientName || "Khách nhận"}
            </p>
          </div>
        </div>
      </button>

      <PhotoApprovalNote approval={o.photo_approval} now={now} />
      <DeliveryFailureNote deliveryStatus={o.delivery_status} deliveryWindow={o.delivery_window} />
      {/* Cùng thanh tác vụ với Lưới thẻ (PO 17/10/2026): không lệch nút, không hiện nút bị chặn */}
      {col.id !== "DELIVERED" && (
        <div className="flex flex-col gap-1.5">
          {acceptBlocker === null && (
            <div className="flex gap-1.5 pt-1 border-t border-border/40">
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => onOpen({ type: "accept-order", orderId: o.id, orderCode: o.code })}
                className="h-7 text-caption gap-1 px-2 flex-1 bg-success hover:bg-success/90 text-white font-extrabold"
              >
                <ShieldCheck size={12} />
                Nhận đơn
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onOpen({ type: "reject-order", orderId: o.id, orderCode: o.code })}
                className="h-7 text-caption gap-1 px-2 border-danger/40 text-danger hover:bg-danger-bg"
              >
                <XCircle size={12} />
                Từ chối
              </Button>
            </div>
          )}
          <CoordinatorCardActions order={o} policy={policy} isUrgent={isUrgent} blockerOf={blockerOf} onOpen={onOpen} compact />
        </div>
      )}
    </div>
  )
}
