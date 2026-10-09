"use client"

import React, { useState } from "react"
import { Clock, UserCheck, Flower2, Camera, Truck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BrochureOrder, ModalState } from "./coordinator-order-card"
import type { BrochurePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import type { TrackingPipelineItem } from "@/modules/greeting-card/domain/tracking-pipeline-types"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import { coordinatorActionBlocker, type CoordinatorAction } from "@/modules/greeting-card/domain/brochure-commerce-rules"
import { paymentGateBlocker } from "@/modules/greeting-card/domain/brochure-payment-policy"
import { sortByDelivery } from "@/modules/greeting-card/domain/coordinator-board"
import { BrochureOrderDetailModal, type OrderDetailModalTarget } from "@/components/greeting-card/brochure-order-detail-modal"
import { StaffNametagGroup } from "@/components/greeting-card/staff-nametag"

export type CoordinatorKanbanColId =
  | "PENDING"
  | "ASSIGNED"
  | "ARRANGING"
  | "READY"
  | "DELIVERING"
  | "DELIVERED"

export interface CoordinatorKanbanColDef {
  id: CoordinatorKanbanColId
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

export const COORDINATOR_KANBAN_COLS: readonly CoordinatorKanbanColDef[] = [
  { id: "PENDING", label: "Chờ xử lý", icon: Clock },
  { id: "ASSIGNED", label: "Đã phân công", icon: UserCheck },
  { id: "ARRANGING", label: "Đang cắm", icon: Flower2 },
  { id: "READY", label: "Đã cắm xong", icon: Camera },
  { id: "DELIVERING", label: "Đang giao", icon: Truck },
  { id: "DELIVERED", label: "Đã giao", icon: CheckCircle2 },
]

export function getCoordinatorOrderStage(o: BrochureOrder): CoordinatorKanbanColId {
  if (o.delivery_status === "DELIVERED" || o.status === "COMPLETED") return "DELIVERED"
  if (o.delivery_status === "DELIVERING" || o.delivery_status === "DISPATCHED") return "DELIVERING"
  if (o.production_status === "READY" || o.production_status === "QUALITY_CHECK") return "READY"
  if (o.production_status === "ARRANGING") return "ARRANGING"
  if (o.production_status === "ASSIGNED") return "ASSIGNED"
  return "PENDING"
}

interface CoordinatorKanbanViewProps {
  orders: BrochureOrder[]
  policy: BrochurePaymentPolicy
  onOpen: (m: ModalState) => void
  workOf: Map<string, TrackingPipelineItem>
  now: number
}

export function CoordinatorKanbanView({
  orders,
  policy,
  onOpen,
  workOf,
}: CoordinatorKanbanViewProps) {
  const [detailTarget, setDetailTarget] = useState<OrderDetailModalTarget | null>(null)
  const grouped = new Map<CoordinatorKanbanColId, BrochureOrder[]>()
  for (const col of COORDINATOR_KANBAN_COLS) grouped.set(col.id, [])

  for (const o of orders) {
    const stage = getCoordinatorOrderStage(o)
    grouped.get(stage)?.push(o)
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 pt-1" aria-label="Bảng Kanban Điều phối">
        {COORDINATOR_KANBAN_COLS.map((col) => {
          const Icon = col.icon
          // Đơn giao sớm nhất (ngày + giờ bắt đầu khung, kể cả "Giờ cụ thể") lên đầu cột
          const colOrders = sortByDelivery(grouped.get(col.id) ?? [])

          return (
            <section
              key={col.id}
              aria-label={col.label}
              className="flex w-72 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-surface-alt p-2.5 shadow-xs"
            >
              <header className="flex items-center justify-between px-1 py-0.5">
                <div className="flex items-center gap-1.5">
                  <Icon size={14} className="text-primary" />
                  <h3 className="text-body-sm font-extrabold text-foreground">{col.label}</h3>
                </div>
                <span className="text-caption font-bold text-text-muted bg-surface rounded-full px-2 py-0.5 border border-border">
                  {colOrders.length}
                </span>
              </header>

              <div className="flex flex-col gap-2 min-h-[120px]">
                {colOrders.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center p-4 text-caption text-text-muted italic border border-dashed border-border/60 rounded-xl">
                    Không có đơn
                  </div>
                ) : (
                  colOrders.map((o) => {
                    const work = workOf.get(o.id)
                    const snapshot = o.greeting_sessions[0]?.product_snapshot || o.items[0]?.metadata
                    const isStuck = work?.stuck?.owner === "COORDINATOR"

                    const blockerOf = (action: CoordinatorAction) =>
                      coordinatorActionBlocker(action, {
                        status: o.status,
                        productionStatus: o.production_status,
                        deliveryStatus: o.delivery_status,
                      }) ?? paymentGateBlocker(action, policy, { totalVnd: o.total_vnd, paidVnd: o.paid_vnd })

                    const openDetail = () => {
                      setDetailTarget({
                        orderId: o.id,
                        orderCode: o.code,
                        sendCode: o.greeting_sessions[0]?.send_code,
                        customerName: work?.customerName,
                        customerPhone: work?.customerPhone,
                        recipientName: o.delivery_address?.recipientName,
                        recipientPhone: o.delivery_address?.phone,
                        deliveryAddress: o.delivery_address?.street || [o.delivery_address?.street, o.delivery_address?.notes].filter(Boolean).join(" · "),
                        deliveryDate: o.delivery_window?.date,
                        deliveryTimeSlot: o.delivery_window?.timeSlot,
                        cardMessage: o.card_message,
                        productName: snapshot?.name || o.items[0]?.description || "Hoa tươi theo mẫu",
                        productImageUrl: snapshot?.imageUrl,
                        totalVnd: o.total_vnd,
                        paidVnd: o.paid_vnd,
                        balanceVnd: Math.max(0, o.total_vnd - o.paid_vnd),
                        saleId: work?.saleId ?? o.saleId,
                        saleName: work?.saleName ?? o.saleName,
                        coordinatorId: work?.coordinatorId ?? o.coordinatorId,
                        coordinatorName: work?.coordinatorName ?? o.coordinatorName,
                        currentStepId: col.id,
                        currentStepTitle: col.label,
                        status: o.status,
                        productionStatus: o.production_status,
                        deliveryStatus: o.delivery_status,
                        createdAt: o.created_at,
                      })
                    }

                    return (
                      <div
                        key={o.id}
                        className={`flex flex-col gap-2 rounded-xl border bg-surface p-3 text-left shadow-xs transition-shadow hover:shadow-md ${
                          isStuck ? "border-danger/60 bg-danger-bg/10" : "border-border"
                        }`}
                      >
                        {/* Clickable Card Body to open detail modal */}
                        <button
                          type="button"
                          onClick={openDetail}
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

                          {/* MỐC THỜI GIAN GIAO HÀNG TO NỔI BẬT */}
                          <div className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-caption font-extrabold text-primary flex items-center gap-1.5 w-full">
                            <Clock size={13} className="shrink-0 text-primary" />
                            <span className="truncate">
                              Giao: {o.delivery_window?.timeSlot || "Trong ngày"}
                              {o.delivery_window?.date ? ` · ${o.delivery_window.date}` : ""}
                            </span>
                          </div>

                          <div className="flex gap-2 items-center w-full">
                            <FlowerImage
                              src={snapshot?.imageUrl}
                              alt={snapshot?.name || "Mẫu"}
                              sizes="40px"
                              fallback="icon"
                              className="w-10 h-10 rounded-lg border border-border shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-caption font-semibold text-foreground truncate">
                                {snapshot?.name || o.items[0]?.description || "Hoa tươi theo mẫu"}
                              </p>
                              <p className="text-caption text-text-muted truncate">
                                Nhận: {o.delivery_address?.recipientName || "Khách nhận"}
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* Quick Action buttons depending on state */}
                        {col.id !== "DELIVERED" && (
                          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
                            {col.id === "PENDING" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!!blockerOf("assign-florist")}
                                onClick={() => onOpen({ type: "florist", orderId: o.id, orderCode: o.code })}
                                className="h-7 text-caption gap-1 px-2 flex-1"
                              >
                                <UserCheck size={12} />
                                Giao Florist
                              </Button>
                            )}
                            {(col.id === "ASSIGNED" || col.id === "ARRANGING") && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!!blockerOf("product-photo")}
                                onClick={() => onOpen({ type: "product-photo", orderId: o.id, orderCode: o.code })}
                                className="h-7 text-caption gap-1 px-2 flex-1"
                              >
                                <Camera size={12} />
                                Ảnh TP
                              </Button>
                            )}
                            {col.id === "READY" && (() => {
                              const isWaitingSecondPayment =
                                o.paid_vnd > 0 &&
                                o.paid_vnd < o.total_vnd &&
                                policy.requireFullBeforeDispatch
                              return (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={!!blockerOf("dispatch-shipping")}
                                  title={blockerOf("dispatch-shipping") ?? undefined}
                                  onClick={() => onOpen({ type: "dispatch", orderId: o.id, orderCode: o.code })}
                                  className={`h-7 text-caption gap-1 px-2 flex-1 ${isWaitingSecondPayment ? "border-warning/50 text-warning bg-warning-bg/30" : ""}`}
                                >
                                  <Truck size={12} />
                                  {isWaitingSecondPayment ? "Chờ TT lần 2" : "Giao Ship"}
                                </Button>
                              )
                            })()}
                            {col.id === "DELIVERING" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={!!blockerOf("recipient-photo")}
                                onClick={() => onOpen({ type: "recipient-photo", orderId: o.id, orderCode: o.code })}
                                className="h-7 text-caption gap-1 px-2 flex-1"
                              >
                                <CheckCircle2 size={12} />
                                Ảnh nhận
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          )
        })}
      </div>

      {detailTarget && (
        <BrochureOrderDetailModal
          target={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </>
  )
}
