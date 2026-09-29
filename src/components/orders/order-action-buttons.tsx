"use client"

import { Printer, Ban, CheckCircle, Truck, Flower2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OrderStatusPatch {
  status?: string
  productionStatus?: string
  deliveryStatus?: string
}

interface OrderActionButtonsProps {
  orderCode: string
  orderStatus: string
  productionStatus: string
  deliveryStatus: string
  actionLoading: boolean
  onPrint: () => void
  onCancelRequest: () => void
  onUpdateStatus: (patch: OrderStatusPatch) => void
}

/** Thanh nút hành động 1-chạm cho chi tiết đơn hàng (K2: 1 primary + overflow). */
export function OrderActionButtons({
  orderCode: _orderCode,
  orderStatus,
  productionStatus,
  deliveryStatus,
  actionLoading,
  onPrint,
  onCancelRequest,
  onUpdateStatus,
}: OrderActionButtonsProps) {
  const canCancel = orderStatus !== "CANCELLED" && orderStatus !== "COMPLETED"

  function renderPrimaryAction() {
    if (productionStatus === "PENDING") {
      return (
        <Button size="sm" variant="primary" disabled={actionLoading}
          onClick={() => onUpdateStatus({ productionStatus: "IN_PRODUCTION", status: "CONFIRMED" })}>
          <Flower2 className="mr-1.5 h-4 w-4" /> Nhận cắm hoa
        </Button>
      )
    }
    if (productionStatus === "IN_PRODUCTION") {
      return (
        <Button size="sm" variant="outline" disabled={actionLoading}
          onClick={() => onUpdateStatus({ productionStatus: "COMPLETED" })}>
          <CheckCircle className="mr-1.5 h-4 w-4" /> Đã cắm xong
        </Button>
      )
    }
    if (productionStatus === "COMPLETED" && deliveryStatus === "NOT_STARTED") {
      return (
        <Button size="sm" variant="outline" disabled={actionLoading}
          onClick={() => onUpdateStatus({ deliveryStatus: "SHIPPING", status: "IN_PROGRESS" })}>
          <Truck className="mr-1.5 h-4 w-4" /> Bắt đầu giao
        </Button>
      )
    }
    if (deliveryStatus === "SHIPPING") {
      return (
        <Button size="sm" variant="outline" disabled={actionLoading}
          onClick={() => onUpdateStatus({ deliveryStatus: "DELIVERED", status: "COMPLETED" })}>
          <CheckCircle className="mr-1.5 h-4 w-4" /> Giao thành công
        </Button>
      )
    }
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrint}>
          <Printer className="mr-1.5 h-4 w-4" /> In phiếu A6
        </Button>
        {canCancel && (
          <Button variant="outline" size="sm"
            className="text-danger hover:bg-danger-bg border-danger/30"
            onClick={onCancelRequest}>
            <Ban className="mr-1.5 h-4 w-4" /> Hủy đơn
          </Button>
        )}
      </div>
      <div className="flex gap-2">{renderPrimaryAction()}</div>
    </div>
  )
}
