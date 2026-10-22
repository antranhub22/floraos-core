"use client"

import React from "react"
import { UserCheck, Truck, Image as ImageIcon, Camera, PackageX, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CoordinatorAction } from "@/modules/greeting-card/domain/brochure-commerce-rules"
import type { BrochurePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import { dispatchActionLabel, noActionReason, visibleCoordinatorActions } from "@/modules/greeting-card/domain/coordinator-card-actions"
import { substituteLockReason } from "@/modules/greeting-card/domain/substitute-proposal"
import { canProposeCancellation } from "@/modules/greeting-card/domain/cancellation-request"
import type { BrochureOrder, ModalState } from "./coordinator-order-card"
import { coordinatorFactsOf } from "./coordinator-order-facts"

const ACTION_VIEW: Record<CoordinatorAction, { label: string; icon: typeof Truck; modal: "florist" | "product-photo" | "dispatch" | "recipient-photo" | "delivery-failed" }> = {
  "assign-florist": { label: "Giao Florist", icon: UserCheck, modal: "florist" },
  "product-photo": { label: "Chụp thành phẩm", icon: Camera, modal: "product-photo" },
  "dispatch-shipping": { label: "Giao Ship", icon: Truck, modal: "dispatch" },
  "recipient-photo": { label: "Ảnh người nhận", icon: ImageIcon, modal: "recipient-photo" },
  "delivery-failed": { label: "Giao không thành công", icon: PackageX, modal: "delivery-failed" },
}

/**
 * Thanh tác vụ thẻ đơn tab Điều phối — DÙNG CHUNG cho Lưới thẻ và Kanban (PO 17/10/2026) để hai giao diện
 * không lệch nhau: chỉ hiện việc của bước hiện tại (`domain/coordinator-card-actions.ts`), kèm "Đề xuất
 * mẫu khác" và "Đề xuất Hủy / Hoàn tiền". `compact` = cỡ nút nhỏ cho thẻ Kanban.
 */
export function CoordinatorCardActions({
  order, policy, isUrgent, blockerOf, onOpen, compact = false,
}: {
  order: BrochureOrder
  policy: BrochurePaymentPolicy
  isUrgent: boolean
  blockerOf: (action: CoordinatorAction) => string | null
  onOpen: (m: ModalState) => void
  compact?: boolean
}) {
  const actions = visibleCoordinatorActions(blockerOf, { status: order.status, productionStatus: order.production_status, deliveryStatus: order.delivery_status })
  // Cùng luật vòng đời máy chủ kiểm khi tạo đề xuất: đã huỷ / đã giao / thợ đang cắm → không hiện link
  const cancelCheck = canProposeCancellation({ status: order.status, productionStatus: order.production_status, deliveryStatus: order.delivery_status })
  const substituteLock = substituteLockReason({ status: order.status, deliveryStatus: order.delivery_status })
  const dispatchLabel = dispatchActionLabel(coordinatorFactsOf(order), policy, isUrgent)
  const label = (a: CoordinatorAction) => (a === "dispatch-shipping" ? dispatchLabel : ACTION_VIEW[a].label)
  const height = compact ? "h-7" : "h-8"
  const iconSize = compact ? 12 : 13

  return (
    <div className={`grid grid-cols-2 ${compact ? "gap-1.5 pt-1 border-border/40" : "gap-2 pt-2 border-border"} border-t`}>
      {actions.length === 0 && (
        <p className="col-span-2 rounded-lg bg-surface-alt px-3 py-2 text-caption text-text-muted">{noActionReason(blockerOf)}</p>
      )}
      {actions.map(({ action, blocker }) => {
        const v = ACTION_VIEW[action]
        const Icon = v.icon
        const waitingMoney = action === "dispatch-shipping" && dispatchLabel === "Chờ TT lần 2"
        return (
          <div key={action} className={actions.length % 2 === 1 && action === actions.at(-1)?.action ? "col-span-2" : ""}>
            <Button
              type="button"
              variant={action === "recipient-photo" ? "secondary" : "outline"}
              size="sm"
              disabled={!!blocker}
              title={blocker ?? undefined}
              onClick={() => onOpen({ type: v.modal, orderId: order.id, orderCode: order.code })}
              className={`w-full text-caption gap-1.5 ${height} ${waitingMoney ? "border-warning/50 text-warning bg-warning-bg/30" : ""}`}
            >
              <Icon size={iconSize} />
              {label(action)}
            </Button>
            {blocker && <p className="mt-1 text-caption text-text-muted">{blocker}</p>}
          </div>
        )
      })}

      {!substituteLock && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Không làm được mẫu khách chọn — gửi khách mẫu khác để chọn"
          onClick={() => onOpen({ type: "substitute", orderId: order.id, orderCode: order.code })}
          className={`col-span-2 text-caption gap-1.5 ${height}`}
        >
          <Shuffle size={iconSize} />
          Đề xuất mẫu khác
        </Button>
      )}

      {cancelCheck.allowed ? (
        <button
          type="button"
          onClick={() => onOpen({ type: "cancel-proposal", orderId: order.id, orderCode: order.code, totalVnd: order.total_vnd, paidVnd: order.paid_vnd, status: order.status, productionStatus: order.production_status, deliveryStatus: order.delivery_status })}
          className="col-span-2 text-caption text-text-muted hover:text-danger hover:underline text-center pt-1 transition-colors"
        >
          Đề xuất Hủy / Hoàn tiền đơn này
        </button>
      ) : (
        <p className="col-span-2 text-caption text-text-muted text-center pt-1">{cancelCheck.reason}</p>
      )}
    </div>
  )
}
