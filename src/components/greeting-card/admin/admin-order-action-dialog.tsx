"use client"

import React, { useState } from "react"
import { PaymentCheckPanel } from "./payment-check-panel"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"
import { expectedPayment, type BrochurePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import { policyForOrder } from "@/modules/greeting-card/domain/payment-plan"
import { vnd, type ActionResult, type OrderAction } from "./admin-order-types"
import { customerPaymentMessage } from "@/modules/greeting-card/domain/customer-notifications"

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
  const suggested =
    type === "collect" ? expectedPayment(policyForOrder(policy, order.pricing_rule_ref), order.total_vnd, order.paid_vnd).amountVnd : type === "refund" ? order.paid_vnd : 0
  const [amount, setAmount] = useState(suggested ? String(suggested) : "")
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
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
          {TITLES[type]} — #{order.code}
        </h3>
        <p className="text-body-sm text-text-muted">
          Tổng đơn {vnd(order.total_vnd)} · Đã thu {vnd(order.paid_vnd)} · Còn {vnd(Math.max(0, order.total_vnd - order.paid_vnd))}
        </p>
        {error && <p role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-body-sm">{error}</p>}
        {type === "quote" && (
          <p className="text-caption text-text-muted">Khách đặt mẫu chưa niêm yết giá. Nhập tổng tiền trọn gói (gồm phí giao) để khách thanh toán.</p>
        )}
        {type !== "cancel" && (
          <label className="flex flex-col gap-1">
            <span className="text-caption font-bold">
              {type === "quote" ? "Tổng tiền báo giá (đ)" : type === "collect" ? "Số tiền đã nhận (đ)" : "Số tiền hoàn (đ)"}
            </span>
            <input inputMode="numeric" required value={amount} onChange={(e) => setAmount(e.target.value)} className={FIELD} />
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
              className={FIELD}
            />
          </label>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Đóng</Button>
          <Button type="submit" disabled={busy} className={type === "collect" || type === "quote" ? "bg-success hover:bg-success/90 text-white" : "bg-danger hover:bg-danger/90 text-white"}>
            {busy ? "Đang xử lý..." : TITLES[type]}
          </Button>
        </div>
      </form>
    </div>
  )
}
