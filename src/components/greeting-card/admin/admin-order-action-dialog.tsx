"use client"

import React, { useState } from "react"
import { PaymentCheckPanel } from "./payment-check-panel"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"
import { type BrochurePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import { readPaymentPlan } from "@/modules/greeting-card/domain/payment-plan"
import { depositAmountVnd } from "@/modules/greeting-card/domain/payment-schedule"
import { vnd, type ActionResult, type OrderAction } from "./admin-order-types"
import { customerPaymentMessage } from "@/modules/greeting-card/domain/customer-notifications"
import { AlertTriangle, Info } from "lucide-react"

const FIELD = "w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground"

const TITLES = {
  quote: "Báo giá cho khách",
  collect: "Ghi nhận đã nhận tiền",
  cancel: "Huỷ đơn hàng",
  refund: "Ghi nhận hoàn tiền",
} as const

/** Hộp thoại thu tiền / huỷ đơn / hoàn tiền cho một đơn Thẻ chào. */
export function AdminOrderActionDialog({
  action,
  policy,
  onClose,
  onDone,
}: {
  action: OrderAction
  policy: BrochurePaymentPolicy
  onClose: () => void
  onDone: (result: ActionResult) => void
}) {
  const { order, type } = action

  const plan = readPaymentPlan(order.pricing_rule_ref)
  const pct = plan?.depositPercent ?? policy.depositPercent
  const depositAmount = depositAmountVnd(order.total_vnd, pct)
  const isDepositOrder = pct > 0 && depositAmount < order.total_vnd
  const isDepositPaid = isDepositOrder && order.paid_vnd >= depositAmount
  const requireFull = policy.requireFullBeforeDispatch !== false

  // Kiểm tra điều kiện đợt 2 cho đơn đặt cọc
  const isReady = order.production_status === "READY"
  const isPhotoApproved = order.qc_records?.some((qc) => qc.notes === "CUSTOMER_PHOTO_APPROVED")
  const productPhotoQc = order.qc_records?.find((qc) => qc.notes === "PRODUCT_PHOTO_UPLOADED")
  const isAutoApproved = !!productPhotoQc && (Date.now() >= new Date(productPhotoQc.created_at).getTime() + 10 * 60_000)
  const canCollectBeforeDispatch = isReady && (isPhotoApproved || isAutoApproved)
  const canCollectAfterDelivery = order.delivery_status === "DELIVERED"

  let isBlocked = false
  let blockReason: string | null = null

  if (type === "collect" && isDepositOrder && isDepositPaid) {
    if (requireFull) {
      if (!canCollectBeforeDispatch) {
        isBlocked = true
        if (!isReady) {
          blockReason = "Đơn hàng đã được ghi nhận tiền cọc (Đợt 1). Xưởng chưa hoàn thành cắm hoa, chưa thể thu phần còn lại."
        } else {
          blockReason = "Đơn hàng đang chờ khách xác nhận ảnh hoa thành phẩm (hoặc đếm ngược 10 phút). Khách xác nhận ảnh xong mới tiến hành thu tiền Đợt 2 trước khi giao hoa."
        }
      }
    } else {
      if (!canCollectAfterDelivery) {
        isBlocked = true
        blockReason = "Đơn hàng đã được ghi nhận tiền cọc (Đợt 1). Theo chính sách của tiệm, phần còn lại sẽ thu sau khi giao hoa thành công."
      }
    }
  }

  const suggested =
    type === "collect"
      ? isDepositOrder && !isDepositPaid
        ? Math.max(0, depositAmount - order.paid_vnd)
        : Math.max(0, order.total_vnd - order.paid_vnd)
      : type === "refund"
      ? order.paid_vnd
      : 0

  const [amount, setAmount] = useState(suggested ? String(suggested) : "")
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  let dialogTitle: string = TITLES[type]
  let amountLabel = "Số tiền đã nhận (đ)"
  let submitButtonLabel: string = TITLES[type]

  if (type === "collect") {
    if (isDepositOrder && !isDepositPaid) {
      dialogTitle = `Thu tiền cọc (Đợt 1 — ${pct}%)`
      amountLabel = `Số tiền cọc đã nhận (đ)`
      submitButtonLabel = `Xác nhận nhận cọc (${vnd(suggested)})`
    } else if (isDepositOrder && isDepositPaid) {
      dialogTitle = `Thu phần còn lại (Đợt 2)`
      amountLabel = `Số tiền còn lại đã nhận (đ)`
      submitButtonLabel = `Xác nhận nhận đủ (${vnd(suggested)})`
    } else {
      dialogTitle = "Ghi nhận đã nhận tiền (100%)"
      submitButtonLabel = "Xác nhận nhận đủ"
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || isBlocked) return
    setBusy(true)
    setError(null)
    const amountVnd = Number(amount.replace(/\D/g, ""))
    try {
      if (type === "quote") {
        await apiSend(`/api/v1/greeting-card/orders/${order.id}/quote`, "POST", {
          totalVnd: amountVnd, ...(text.trim() ? { reason: text.trim() } : {}),
        }, "Không lưu được báo giá")
        onDone({ message: `Đã báo giá ${vnd(amountVnd)} cho đơn ${order.code}. Khách mở lại Thẻ chào sẽ thấy mã QR thanh toán.` })
      } else if (type === "collect") {
        await apiSend(`/api/v1/greeting-card/orders/${order.id}/confirm-payment`, "POST", {
          amountVnd, ...(text.trim() ? { reference: text.trim() } : {}),
        }, "Không ghi nhận được thanh toán")
        onDone({
          message: `Đã ghi nhận ${vnd(amountVnd)} cho đơn ${order.code}.`,
          customerMessage: customerPaymentMessage({
            orderCode: order.code,
            amountVnd,
            balanceVnd: Math.max(0, order.total_vnd - order.paid_vnd - amountVnd),
            trackingUrl: order.greeting_sessions[0]?.send_code ? `${window.location.origin}/b/${order.greeting_sessions[0].send_code}` : null,
          }),
        })
      } else if (type === "cancel") {
        await apiSend(`/api/v1/greeting-card/orders/${order.id}/cancel`, "POST", { reason: text }, "Không huỷ được đơn")
        onDone({ message: `Đã huỷ đơn ${order.code}${order.paid_vnd > 0 ? " — nhớ hoàn tiền cho khách nếu cần" : ""}.` })
      } else {
        await apiSend(`/api/v1/greeting-card/orders/${order.id}/refund`, "POST", { amountVnd, reason: text }, "Không ghi nhận được hoàn tiền")
        onDone({ message: `Đã ghi nhận hoàn ${vnd(amountVnd)} cho đơn ${order.code}.` })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác không thành công")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="order-action-title">
      <form onSubmit={submit} className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md p-5 flex flex-col gap-4">
        <h3 id="order-action-title" className="text-body font-extrabold text-foreground">
          {dialogTitle} — #{order.code}
        </h3>
        <p className="text-body-sm text-text-muted">
          Tổng đơn {vnd(order.total_vnd)} · Đã thu {vnd(order.paid_vnd)} · Còn {vnd(Math.max(0, order.total_vnd - order.paid_vnd))}
        </p>

        {isBlocked && blockReason && (
          <div role="alert" className="p-3.5 rounded-xl bg-warning-bg border border-warning/40 text-warning text-body-sm flex items-start gap-2.5">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-warning" aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-caption text-warning">Chưa đủ điều kiện thu tiền đợt 2</span>
              <p className="text-body-sm text-foreground/80 leading-relaxed">{blockReason}</p>
            </div>
          </div>
        )}

        {type === "collect" && isDepositOrder && !isDepositPaid && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-body-sm text-primary flex items-start gap-2">
            <Info size={16} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
            <span>Đơn áp dụng đặt cọc {pct}%. Xác nhận tiền cọc để chuyển đơn sang xưởng bắt đầu cắm hoa.</span>
          </div>
        )}

        {error && <p role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-body-sm">{error}</p>}
        {type === "quote" && (
          <p className="text-caption text-text-muted">Khách đặt mẫu chưa niêm yết giá. Nhập tổng tiền trọn gói (gồm phí giao) để khách thanh toán.</p>
        )}
        {type !== "cancel" && (
          <label className="flex flex-col gap-1">
            <span className="text-caption font-bold">
              {type === "quote" ? "Tổng tiền báo giá (đ)" : amountLabel}
            </span>
            <input inputMode="numeric" required value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isBlocked} className={FIELD} />
          </label>
        )}
        {(type === "collect" || type === "quote") && <PaymentCheckPanel order={order} />}
        {(
          <label className="flex flex-col gap-1">
            <span className="text-caption font-bold">
              {type === "collect" ? "Mã giao dịch ngân hàng (không bắt buộc)" : type === "quote" ? "Lý do giá chốt (không bắt buộc)" : type === "cancel" ? "Lý do huỷ *" : "Lý do hoàn tiền *"}
            </span>
            <input
              value={text}
              maxLength={type === "collect" ? 100 : type === "quote" ? 300 : 500}
              required={type === "cancel" || type === "refund"}
              minLength={type === "cancel" || type === "refund" ? 3 : 0}
              onChange={(e) => setText(e.target.value)}
              disabled={isBlocked}
              className={FIELD}
            />
          </label>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Đóng</Button>
          <Button
            type="submit"
            disabled={busy || isBlocked}
            className={
              isBlocked
                ? "bg-surface-muted text-text-muted cursor-not-allowed"
                : type === "collect" || type === "quote"
                ? "bg-success hover:bg-success/90 text-white"
                : "bg-danger hover:bg-danger/90 text-white"
            }
          >
            {busy ? "Đang xử lý..." : isBlocked ? "Chưa thể thu tiền" : submitButtonLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}

