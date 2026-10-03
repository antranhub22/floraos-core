"use client"

import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"

interface OrderCancelDialogProps {
  open: boolean
  onClose: () => void
  orderCode: string | undefined
  onConfirm: (reason: string) => void
  loading: boolean
}

export function OrderCancelDialog({
  open,
  onClose,
  orderCode,
  onConfirm,
  loading,
}: OrderCancelDialogProps) {
  const [reason, setReason] = useState("")

  function handleClose() {
    setReason("")
    onClose()
  }

  function handleConfirm() {
    if (!reason.trim() || loading) return
    onConfirm(reason)
  }

  const dialogTitle = (
    <span className="flex items-center gap-2 text-danger">
      <AlertCircle className="h-4 w-4" />
      Xác nhận hủy đơn #{orderCode}
    </span>
  )

  const dialogFooter = (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" onClick={handleClose} disabled={loading}>
        Hủy bỏ
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="border-danger/30 text-danger hover:bg-danger-bg"
        disabled={!reason.trim() || loading}
        onClick={handleConfirm}
      >
        {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
        Xác nhận hủy đơn
      </Button>
    </div>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}
      title={dialogTitle}
      size="sm"
      footer={dialogFooter}
    >
      <div className="space-y-3">
        <p className="text-caption text-text-muted">
          Hành động này sẽ hủy đơn hàng vĩnh viễn và ghi log vào chuỗi sự kiện SLA.
        </p>
        <textarea
          rows={3}
          className="w-full rounded-md border border-border bg-surface p-2.5 text-caption focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Nhập lý do hủy đơn (bắt buộc)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Dialog>
  )
}
