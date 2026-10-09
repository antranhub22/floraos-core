"use client"

import React from "react"
import { MapPin, Calendar, UserCheck, Truck, Image as ImageIcon, CheckCircle2, Camera, ExternalLink, PackageX, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { coordinatorActionBlocker, type CoordinatorAction } from "@/modules/greeting-card/domain/brochure-commerce-rules"
import { paymentGateBlocker, type BrochurePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import { CoordinatorProgressStrip } from "./coordinator-progress-strip"
import { WorkStatus } from "@/components/greeting-card/work/work-status"
import type { TrackingPipelineItem } from "@/modules/greeting-card/domain/tracking-pipeline-types"
import { readDeliveryNote } from "@/modules/greeting-card/domain/delivery-note"
import { readDeliveryFailures } from "@/modules/greeting-card/domain/delivery-failure"
import { substituteLockReason } from "@/modules/greeting-card/domain/substitute-proposal"
import { StaffNametagGroup } from "@/components/greeting-card/staff-nametag"

export interface BrochureOrder {
  id: string
  code: string
  status: string
  production_status: string
  delivery_status: string
  total_vnd: number
  paid_vnd: number
  card_message: string | null
  delivery_address: { recipientName?: string; phone?: string; street?: string; notes?: string; mapUrl?: string } | null
  delivery_window: { date?: string; timeSlot?: string; failures?: unknown } | null
  items: Array<{
    id: string
    description: string
    quantity: number
    unit_price_vnd: number
    metadata?: { name?: string; imageUrl?: string }
  }>
  greeting_sessions: Array<{
    id: string
    send_code: string
    product_snapshot?: { name?: string; imageUrl?: string }
  }>
  customer?: { id?: string; code?: string; name?: string; phone?: string } | null
  /** Bản chụp báo giá + ưu đãi khách chọn (`policies.promotion`) lúc đặt. */
  pricing_rule_ref?: { policies?: { promotion?: { title?: string } | null } | null } | null
  saleId?: string | null | undefined
  saleName?: string | null | undefined
  coordinatorId?: string | null | undefined
  coordinatorName?: string | null | undefined
  created_at: string
}

export type ModalState =
  | { type: "none" }
  | { type: "florist"; orderId: string; orderCode: string }
  | { type: "product-photo"; orderId: string; orderCode: string }
  | { type: "dispatch"; orderId: string; orderCode: string }
  | { type: "recipient-photo"; orderId: string; orderCode: string }
  | { type: "delivery-failed"; orderId: string; orderCode: string }
  | { type: "substitute"; orderId: string; orderCode: string }
  | { type: "cancel-proposal"; orderId: string; orderCode: string; totalVnd: number; paidVnd: number }
  | { type: "detail"; order: BrochureOrder }

function productionLabel(status: string) {
  const map: Record<string, string> = {
    WAITING: "Chờ cắm hoa",
    ASSIGNED: "Đã phân công",
    ARRANGING: "Đang cắm hoa",
    QUALITY_CHECK: "Đang kiểm tra",
    READY: "Hoa đã hoàn thiện",
    DONE: "Đã xong",
  }
  return map[status] ?? status
}

function deliveryLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: "Chưa giao",
    DELIVERING: "Đang giao",
    DISPATCHED: "Đã bàn giao Ship",
    DELIVERED: "Giao thành công",
    FAILED: "Giao thất bại",
  }
  return map[status] ?? status
}

/** Thẻ một đơn Thẻ chào trong tab Điều phối: mẫu, giao nhận, thanh toán, bốn tác vụ xưởng. */
export function CoordinatorOrderCard({
  order,
  policy,
  onOpen,
  work,
  now,
}: {
  order: BrochureOrder
  policy: BrochurePaymentPolicy
  onOpen: (m: ModalState) => void
  /** Dòng tương ứng trong quy trình theo dõi — để hiện bước hiện tại và cảnh báo kẹt. */
  work?: TrackingPipelineItem | undefined
  now: number
}) {
  const session = order.greeting_sessions[0]
  const snapshot = session?.product_snapshot || order.items[0]?.metadata
  const recipient = order.delivery_address?.recipientName || "Khách nhận"
  const phone = order.delivery_address?.phone || ""
  const address = order.delivery_address?.street || ""
  const delivery = readDeliveryNote(order.delivery_address)
  const failures = readDeliveryFailures(order.delivery_window)
  const lastFailure = order.delivery_status === "FAILED" ? failures.at(-1) : undefined
  const date = order.delivery_window?.date || ""
  const timeSlot = order.delivery_window?.timeSlot || "Trong ngày"
  const awaitingQuote = order.total_vnd <= 0
  const isPaid = !awaitingQuote && order.paid_vnd >= order.total_vnd
  const isDelivered = order.delivery_status === "DELIVERED" || order.status === "COMPLETED"
  // Cùng luật thứ tự với server — nút sai bước bị khoá kèm lý do (tooltip)
  const blockerOf = (action: CoordinatorAction) =>
    coordinatorActionBlocker(action, {
      status: order.status,
      productionStatus: order.production_status,
      deliveryStatus: order.delivery_status,
    }) ?? paymentGateBlocker(action, policy, { totalVnd: order.total_vnd, paidVnd: order.paid_vnd })

  return (
    <div data-focus-key={order.id} className={`bg-surface rounded-2xl border p-5 shadow-sm flex flex-col gap-4 ${work?.stuck?.owner === "COORDINATOR" ? "border-danger/50" : "border-border"}`}>
      {work && <WorkStatus item={work} me="COORDINATOR" now={now} />}
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpen({ type: "detail", order })}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <span className="text-title-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
              #{order.code}
            </span>
            {session?.send_code && (
              <span className="text-caption px-2 py-0.5 rounded-md bg-surface-muted text-text-muted font-mono font-bold">
                {session.send_code}
              </span>
            )}
            <span className="text-caption text-primary underline font-medium ml-1">Xem chi tiết</span>
          </button>
          <StaffNametagGroup
            item={work}
            fallbackSaleName={order.saleName}
            fallbackSaleId={order.saleId}
            fallbackCoordinatorName={order.coordinatorName}
            fallbackCoordinatorId={order.coordinatorId}
            forceStage="coordinator"
          />
        </div>
        <span className="text-body-sm font-extrabold text-primary">
          {order.total_vnd.toLocaleString("vi-VN")} đ
        </span>
      </div>

      {/* Product */}
      <div className="flex gap-3.5 items-start">
        <FlowerImage
          src={snapshot?.imageUrl}
          alt={snapshot?.name || "Mẫu hoa"}
          sizes="80px"
          fallback="icon"
          className="w-20 h-20 rounded-xl border border-border shrink-0"
        />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="text-caption text-text-muted font-medium">Mẫu khách chọn:</div>
          <div className="text-body font-bold text-foreground truncate">
            {snapshot?.name || order.items[0]?.description || "Hoa tươi theo mẫu"}
          </div>
          <div className="flex flex-wrap gap-2 mt-0.5">
            <span className="text-caption px-2 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border">
              SX: {productionLabel(order.production_status)}
            </span>
            <span className="text-caption px-2 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border">
              Ship: {deliveryLabel(order.delivery_status)}
            </span>
          </div>
        </div>
      </div>

      <CoordinatorProgressStrip
        status={order.status}
        productionStatus={order.production_status}
        deliveryStatus={order.delivery_status}
      />

      {/* Logistics */}
      <div className="bg-surface-muted rounded-xl p-3 flex flex-col gap-2 text-body-sm text-text-muted">
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-body-sm font-extrabold text-primary">
          <Calendar size={16} className="text-primary shrink-0" />
          <span>Khung giờ giao: {timeSlot || "Trong ngày"}{date ? ` · ${date}` : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-primary shrink-0" />
          <span className="truncate">{recipient} ({phone}) — {address}</span>
        </div>
        {(delivery.note || delivery.mapUrl) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text">
            {delivery.note && <span><span className="font-bold">Người giao lưu ý:</span> {delivery.note}</span>}
            {delivery.mapUrl && (
              <a href={delivery.mapUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
                <ExternalLink size={12} aria-hidden="true" /> Mở bản đồ
              </a>
            )}
          </div>
        )}
        {lastFailure && (
          <div role="status" className="rounded-lg bg-warning-bg px-2 py-1.5 text-caption text-warning">
            <span className="font-bold">Giao lần {failures.length} chưa thành công:</span> {lastFailure.reasonLabel}
            {lastFailure.note ? ` — ${lastFailure.note}` : ""}. Hẹn lại với khách rồi bấm &ldquo;Giao lại&rdquo;.
          </div>
        )}
        {order.card_message && (
          <div className="text-caption italic text-text border-t border-border pt-1.5 mt-0.5">
            Thiệp: &ldquo;{order.card_message}&rdquo;
          </div>
        )}
        {order.pricing_rule_ref?.policies?.promotion?.title && (
          <div className="text-caption font-bold text-success">Ưu đãi khách chọn: {order.pricing_rule_ref.policies.promotion.title}</div>
        )}
      </div>

      {/* Payment status */}
      <div className="flex items-center justify-between text-caption">
        <span className={isPaid ? "text-success font-bold" : "text-warning font-bold"}>
          {awaitingQuote ? "● Chờ báo giá" : isPaid ? "● Đã thanh toán" : "● Chưa thu tiền"}
        </span>
        {isDelivered && (
          <span className="flex items-center gap-1 text-success font-bold">
            <CheckCircle2 size={13} /> Hoàn tất
          </span>
        )}
      </div>

      {/* Action bar — 4 tác vụ */}
      {!isDelivered && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!!blockerOf("assign-florist")}
            title={blockerOf("assign-florist") ?? undefined}
            onClick={() => onOpen({ type: "florist", orderId: order.id, orderCode: order.code })}
            className="text-caption gap-1.5 h-8"
          >
            <UserCheck size={13} />
            Giao Florist
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!!blockerOf("product-photo")}
            title={blockerOf("product-photo") ?? undefined}
            onClick={() => onOpen({ type: "product-photo", orderId: order.id, orderCode: order.code })}
            className="text-caption gap-1.5 h-8"
          >
            <Camera size={13} />
            Chụp thành phẩm
          </Button>

          {(() => {
            const isWaitingSecondPayment =
              order.paid_vnd > 0 &&
              order.paid_vnd < order.total_vnd &&
              policy.requireFullBeforeDispatch &&
              (order.production_status === "READY" || order.production_status === "DONE")
            return (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!!blockerOf("dispatch-shipping")}
                title={blockerOf("dispatch-shipping") ?? undefined}
                onClick={() => onOpen({ type: "dispatch", orderId: order.id, orderCode: order.code })}
                className={`text-caption gap-1.5 h-8 ${isWaitingSecondPayment ? "border-warning/50 text-warning bg-warning-bg/30" : ""}`}
              >
                <Truck size={13} />
                {order.delivery_status === "FAILED" ? "Giao lại" : isWaitingSecondPayment ? "Chờ TT lần 2" : "Giao Ship"}
              </Button>
            )
          })()}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!!blockerOf("recipient-photo")}
            title={blockerOf("recipient-photo") ?? undefined}
            onClick={() => onOpen({ type: "recipient-photo", orderId: order.id, orderCode: order.code })}
            className="text-caption gap-1.5 h-8"
          >
            <ImageIcon size={13} />
            Ảnh người nhận
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!!blockerOf("delivery-failed")}
            title={blockerOf("delivery-failed") ?? undefined}
            onClick={() => onOpen({ type: "delivery-failed", orderId: order.id, orderCode: order.code })}
            className="col-span-2 text-caption gap-1.5 h-8"
          >
            <PackageX size={13} />
            Giao không thành công
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!!substituteLockReason({ status: order.status, deliveryStatus: order.delivery_status })}
            title={substituteLockReason({ status: order.status, deliveryStatus: order.delivery_status }) ?? "Không làm được mẫu khách chọn — gửi khách mẫu khác để chọn"}
            onClick={() => onOpen({ type: "substitute", orderId: order.id, orderCode: order.code })}
            className="col-span-2 text-caption gap-1.5 h-8"
          >
            <Shuffle size={13} />
            Đề xuất mẫu khác
          </Button>

          <button
            type="button"
            onClick={() =>
              onOpen({
                type: "cancel-proposal",
                orderId: order.id,
                orderCode: order.code,
                totalVnd: order.total_vnd,
                paidVnd: order.paid_vnd,
              })
            }
            className="col-span-2 text-caption text-text-muted hover:text-danger hover:underline text-center pt-1 transition-colors"
          >
            Đề xuất Hủy / Hoàn tiền đơn này
          </button>
        </div>
      )}
    </div>
  )
}
