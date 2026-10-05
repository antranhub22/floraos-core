"use client"

import React, { useState, useEffect } from "react"
import { Check, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { readApiError } from "@/components/greeting-card/api-error"
import { BrochurePaymentSettings } from "./brochure-payment-settings"
import { BrochureShippingSettings } from "./brochure-shipping-settings"

interface PaymentOrder {
  id: string
  code: string
  status: string
  total_vnd: number
  paid_vnd: number
  customer: { name: string; phone: string } | null
  greeting_sessions: Array<{ send_code: string; status: string }>
  created_at: string
}

export function AdminBrochurePaymentTab() {
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function loadPendingPayments() {
    setLoading(true)
    fetch("/api/v1/greeting-card/orders")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setOrders(res.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPendingPayments()
  }, [])

  async function handleConfirmPayment(orderId: string) {
    setConfirmingId(orderId)
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/v1/greeting-card/orders/${orderId}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Điều hành xác nhận tài khoản đã có tiền" }),
      })

      if (!res.ok) {
        throw new Error(await readApiError(res, "Không thể xác nhận thanh toán"))
      }

      setSuccessMsg("Đã xác nhận thanh toán thành công! Đơn hàng đã chuyển sang Điều phối.")
      loadPendingPayments()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Đã có lỗi xảy ra")
      loadPendingPayments()
    } finally {
      setConfirmingId(null)
    }
  }

  // Theo trạng thái đơn (server chỉ cho xác nhận đơn DRAFT); đơn huỷ không nằm ở bảng nào
  const pendingOrders = orders.filter((o) => o.status === "DRAFT")
  const confirmedOrders = orders.filter((o) => o.status !== "DRAFT" && o.status !== "CANCELLED")

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-title font-extrabold text-foreground flex items-center gap-2">
            <span>Duyệt Thanh Toán Thẻ Chào</span>
            <span className="text-caption px-2.5 py-0.5 rounded-full bg-warning/15 text-warning font-bold">
              Kế Toán & Điều Hành
            </span>
          </h2>
          <p className="text-body-sm text-text-muted mt-1">
            Đối soát chuyển khoản ngân hàng và duyệt tiền cho các đơn hàng đặt qua link Thẻ chào
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadPendingPayments}
          className="gap-1.5 text-caption h-9"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Làm mới</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <BrochurePaymentSettings />
        <BrochureShippingSettings />
      </div>

      {errorMsg && (
        <div role="alert" className="p-3.5 rounded-xl bg-danger-bg border border-danger/30 text-danger text-body-sm font-bold flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-success-bg border border-success/30 text-success text-body-sm font-bold flex items-center gap-2">
          <ShieldCheck size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pending Confirmation Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-warning-bg/30">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-warning" />
            <h3 className="text-body font-extrabold text-foreground">
              Đơn Chờ Xác Nhận Tiền ({pendingOrders.length})
            </h3>
          </div>
          <span className="text-caption text-text-muted">
            Ưu tiên duyệt để xưởng kịp tiến độ cắm hoa
          </span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <Check size={32} className="text-success mx-auto mb-2" />
            <p className="text-body font-bold text-foreground">
              Hiện không có đơn nào đang chờ xác nhận tiền.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-muted text-text-muted text-caption uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Link Thẻ chào</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Số tiền cần thu</th>
                  <th className="px-4 py-3">Thời gian đặt</th>
                  <th className="px-4 py-3 text-right">Tác vụ Điều hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingOrders.map((order) => {
                  const isConfirming = confirmingId === order.id
                  const sendCode = order.greeting_sessions[0]?.send_code || "—"

                  return (
                    <tr key={order.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        {order.code}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-text-muted">
                        {sendCode}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {order.customer?.name || "Khách đặt hoa"}
                        </div>
                        <div className="text-caption text-text-muted">
                          {order.customer?.phone || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-foreground">
                        {order.total_vnd.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3 text-caption text-text-muted">
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          disabled={isConfirming}
                          onClick={() => handleConfirmPayment(order.id)}
                          className="h-8 bg-success hover:bg-success/90 text-white text-caption font-bold gap-1.5 shadow-sm"
                        >
                          <Check size={14} />
                          <span>{isConfirming ? "Đang ghi nhận..." : "Xác nhận đã nhận tiền"}</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmed Orders History */}
      {confirmedOrders.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-body font-extrabold text-foreground">
              Đơn Thẻ Chào Đã Thu Tiền ({confirmedOrders.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-muted text-text-muted text-caption uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Số tiền đã thu</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {confirmedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      {order.code}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {order.customer?.name} ({order.customer?.phone})
                    </td>
                    <td className="px-4 py-3 font-bold text-success">
                      {order.paid_vnd.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-caption font-bold bg-success-bg text-success">
                        Đã quyết toán
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
