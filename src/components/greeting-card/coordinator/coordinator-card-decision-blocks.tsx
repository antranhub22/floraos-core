"use client"

import React, { useState } from "react"
import { CheckCircle2, ShieldCheck, XCircle, Banknote, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { coordinatorAcceptanceBlocker } from "@/modules/greeting-card/domain/brochure-commerce-rules"
import type { BrochureOrder, ModalState } from "./coordinator-order-card"
import type { BrochurePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import type { TrackingPipelineItem } from "@/modules/greeting-card/domain/tracking-pipeline-types"
import { customerSecondPaymentReminderMessage } from "@/modules/greeting-card/domain/customer-notifications"
import { firstPaymentAmountVnd } from "@/modules/greeting-card/domain/payment-plan"
import {
  isUrgentOrder,
  shouldRequireCoordinatorAcceptance,
  canRoleApproveDeposit,
  type BrochureWorkflowPolicy,
} from "@/modules/greeting-card/domain/brochure-workflow-policy"

export function CoordinatorCardDecisionBlocks({
  order,
  policy,
  work,
  onOpen,
  workflowPolicy,
}: {
  order: BrochureOrder
  policy: BrochurePaymentPolicy
  work?: TrackingPipelineItem | undefined
  onOpen: (m: ModalState) => void
  workflowPolicy?: BrochureWorkflowPolicy | undefined
}) {
  const [copied, setCopied] = useState(false)

  const isUrgent = isUrgentOrder({
    deliveryDate: order.delivery_window?.date,
    deliveryTimeSlot: order.delivery_window?.timeSlot,
  })

  // 1. Khối Xác nhận nhận đơn — chỉ hiện khi đơn đã thanh toán nhưng chưa được Điều phối duyệt
  const paymentProofUrl = work?.paymentProofUrl || order.payment_proof_url
  const requireAcceptance = workflowPolicy ? shouldRequireCoordinatorAcceptance(workflowPolicy, isUrgent) : true
  const rawAcceptBlocker = coordinatorAcceptanceBlocker(
    { status: order.status, productionStatus: order.production_status, deliveryStatus: order.delivery_status },
    { paidVnd: order.paid_vnd, paymentProofUrl },
  )
  const acceptBlocker = requireAcceptance ? rawAcceptBlocker : "BYPASSED"

  const isDepositOrder = order.paid_vnd > 0 && order.paid_vnd < order.total_vnd
  const isReadyForDispatch = order.production_status === "READY" || order.production_status === "DONE"
  const hasBalanceReported = order.greeting_sessions.some((s) => s.status === "PAYMENT_REPORTED")
  const requireFullBeforeDispatch = policy.requireFullBeforeDispatch !== false
  const balanceVnd = order.total_vnd - order.paid_vnd

  return (
    <>
      {acceptBlocker === null && (
        <div className="flex flex-col gap-2 p-3 rounded-xl border-2 border-dashed border-success/40 bg-success-bg/30">
          <p className="text-body-sm font-bold text-success text-center flex items-center justify-center gap-1.5">
            <ShieldCheck size={16} />
            Đơn hàng chờ Điều phối xác nhận nhận đơn
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onOpen({ type: "accept-order", orderId: order.id, orderCode: order.code })}
              className="h-9 text-body-sm font-extrabold gap-1.5 bg-success hover:bg-success/90 text-white"
            >
              <CheckCircle2 size={15} />
              Xác nhận Nhận đơn
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpen({ type: "reject-order", orderId: order.id, orderCode: order.code })}
              className="h-9 text-body-sm font-bold gap-1.5 border-danger/40 text-danger hover:bg-danger-bg"
            >
              <XCircle size={15} />
              Từ chối (Hoàn tiền)
            </Button>
          </div>
        </div>
      )}

      {/* Khối Xác nhận Tiền Cọc Đợt 1 nếu có bill và Điều phối có quyền hoặc được ủy quyền */}
      {(() => {
        const isOverdueSla = Boolean(work?.stuck)
        const canApprove = workflowPolicy
          ? canRoleApproveDeposit("COORDINATOR", workflowPolicy, { isOverdueSla, isUrgent })
          : true

        if (!canApprove || order.paid_vnd > 0 || !Boolean(paymentProofUrl)) return null

        const isEscalation = workflowPolicy?.requireAdminDepositApproval && isOverdueSla
        return (
          <div className="flex flex-col gap-2 p-3 rounded-xl border-2 border-dashed border-success/50 bg-success-bg/40">
            <p className="text-body-sm font-bold text-success text-center flex items-center justify-center gap-1.5">
              <Banknote size={16} />
              {isUrgent
                ? "Duyệt cọc nhanh (Đơn hỏa tốc)"
                : isEscalation
                ? "Ủy quyền duyệt cọc (Quá hạn SLA)"
                : "Khách đã gửi bill tiền cọc (Đợt 1) — Chờ Xác nhận"}
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                onOpen({
                  type: "confirm-deposit",
                  orderId: order.id,
                  orderCode: order.code,
                  depositVnd: firstPaymentAmountVnd(order.total_vnd, order.pricing_rule_ref, policy.depositPercent),
                  proofUrl: paymentProofUrl ?? null,
                })
              }
              className="h-9 text-body-sm font-extrabold gap-1.5 bg-success hover:bg-success/90 text-white w-full"
            >
              <CheckCircle2 size={15} />
              {isEscalation ? "Duyệt cọc ủy quyền" : "Xác nhận Tiền Cọc Đợt 1"}
            </Button>
          </div>
        )
      })()}

      {/* 2. Khối Xác nhận Thanh toán Lần 2 — Đơn đặt cọc, hoa xong, khách đã báo bill lần 2
          NOTE: Hiện khi khách báo bill lần 2 (hasBalanceReported) bất kể chính sách thu khi nào.
          requireFullBeforeDispatch chỉ ảnh hưởng đến việc có chặn dispatch hay không — không ẩn xác nhận. */}
      {isDepositOrder && isReadyForDispatch && hasBalanceReported && (
        <div className="flex flex-col gap-2 p-3 rounded-xl border-2 border-dashed border-warning/50 bg-warning-bg/40">
          <p className="text-body-sm font-bold text-warning text-center flex items-center justify-center gap-1.5">
            <Banknote size={16} />
            Khách đã báo chuyển khoản Lần 2 — Chờ Xác nhận
          </p>
          <p className="text-caption text-text-muted text-center">
            Phần còn lại: <span className="font-extrabold text-foreground">{balanceVnd.toLocaleString("vi-VN")}đ</span>
            {order.payment_proof_balance_url && (
              <> · <a href={order.payment_proof_balance_url} target="_blank" rel="noopener noreferrer" className="text-primary underline font-bold">Xem ảnh bill</a></>
            )}
          </p>
          <Button
            type="button"
            variant="warning"
            size="sm"
            onClick={() => onOpen({
              type: "confirm-balance",
              orderId: order.id,
              orderCode: order.code,
              balanceVnd,
              proofUrl: order.payment_proof_balance_url ?? null,
            })}
            className="h-9 text-body-sm font-extrabold gap-1.5 bg-warning hover:bg-warning/90 text-white w-full"
          >
            <CheckCircle2 size={15} />
            Xác nhận Đã Nhận Đủ Tiền (Lần 2)
          </Button>
        </div>
      )}

      {/* 3. Khối Nhắc khách Thanh toán Lần 2 — Hoa xong nhưng khách chưa báo bill lần 2 */}
      {isDepositOrder && isReadyForDispatch && !hasBalanceReported && (
        <div className="flex flex-col gap-2 p-2.5 rounded-xl border border-warning/40 bg-warning-bg/30">
          <div className="flex items-center justify-between text-caption">
            <span className="font-bold text-warning flex items-center gap-1">
              <Banknote size={14} /> Chờ thanh toán Lần 2:
            </span>
            <span className="font-extrabold text-foreground">{balanceVnd.toLocaleString("vi-VN")}đ</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const sendCode = order.greeting_sessions[0]?.send_code
                const trackingUrl = sendCode && typeof window !== "undefined" ? `${window.location.origin}/b/${sendCode}` : null
                const skippedPhoto = !order.delivery_window // fallback
                const msg = customerSecondPaymentReminderMessage({
                  orderCode: order.code,
                  balanceVnd,
                  trackingUrl,
                  skippedPhoto,
                })
                if (typeof navigator !== "undefined") {
                  void navigator.clipboard.writeText(msg).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2500)
                  })
                }
              }}
              className="h-8 text-caption font-bold gap-1 border-warning/40 text-warning hover:bg-warning/10 w-full"
            >
              {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              <span>{copied ? "Đã chép Zalo" : "Chép tin nhắc lần 2"}</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onOpen({
                type: "confirm-balance",
                orderId: order.id,
                orderCode: order.code,
                balanceVnd,
                proofUrl: order.payment_proof_balance_url ?? null,
              })}
              className="h-8 text-caption font-bold gap-1 bg-success hover:bg-success/90 text-white w-full shadow-xs"
            >
              <CheckCircle2 size={13} />
              <span>Xác nhận thu đủ (Lần 2)</span>
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
