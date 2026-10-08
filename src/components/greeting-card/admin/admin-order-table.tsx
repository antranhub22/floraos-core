"use client"

import React from "react"
import { Ban, Check, RotateCcw, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import { paymentCheckOf } from "@/modules/greeting-card/domain/payment-check"
import { vnd, type AdminOrder, type OrderAction } from "./admin-order-types"

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Chờ thanh toán", className: "bg-warning-bg text-warning" },
  CONFIRMED: { label: "Đã xác nhận", className: "bg-info-bg text-info" },
  PROCESSING: { label: "Đang xử lý", className: "bg-info-bg text-info" },
  DELIVERED: { label: "Đã giao", className: "bg-success-bg text-success" },
  COMPLETED: { label: "Hoàn tất", className: "bg-success-bg text-success" },
  CANCELLED: { label: "Đã huỷ", className: "bg-danger-bg text-danger" },
}

/** Bảng đơn Thẻ chào cho Điều hành: tiền đã thu/còn lại + thu, huỷ, hoàn. */
export function AdminOrderTable({ orders, onAction }: { orders: AdminOrder[]; onAction: (a: OrderAction) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-body-sm">
        <thead className="bg-surface-muted text-text-muted text-caption uppercase border-b border-border">
          <tr>
            <th className="px-4 py-3">Mã đơn</th>
            <th className="px-4 py-3">Mẫu</th>
            <th className="px-4 py-3">Khách hàng</th>
            <th className="px-4 py-3 text-right">Tổng</th>
            <th className="px-4 py-3 text-right">Đã thu</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3 text-right">Tác vụ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((o) => {
            const balance = Math.max(0, o.total_vnd - o.paid_vnd)
            const awaitingQuote = o.total_vnd <= 0 && o.status !== "CANCELLED"
            const badge = STATUS_BADGE[o.status] ?? { label: o.status, className: "bg-surface-muted" }
            const cancellable = o.status !== "CANCELLED" && o.status !== "COMPLETED" && o.delivery_status !== "DELIVERED"
            return (
              <tr key={o.id} data-focus-key={o.id} className="hover:bg-surface-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-mono font-bold text-primary">{o.code}</div>
                  <div className="text-caption text-text-muted">
                    {o.greeting_sessions[0]?.send_code ?? "—"} · {new Date(o.created_at).toLocaleString("vi-VN")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ProductCell order={o} />
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-foreground">{o.customer?.name || "Khách đặt hoa"}</div>
                  <div className="text-caption text-text-muted">{o.customer?.phone ?? ""}</div>
                </td>
                <td className="px-4 py-3 text-right font-extrabold">
                  {awaitingQuote ? <span className="text-warning">Chờ báo giá</span> : vnd(o.total_vnd)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className={balance > 0 ? "font-bold text-warning" : "font-bold text-success"}>{vnd(o.paid_vnd)}</div>
                  {balance > 0 && o.status !== "CANCELLED" && <div className="text-caption text-text-muted">còn {vnd(balance)}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-caption font-bold ${badge.className}`}>{badge.label}</span>
                  {balance > 0 && o.status !== "CANCELLED" && o.greeting_sessions[0]?.status === "PAYMENT_REPORTED" && (
                    <div className="mt-1 text-caption font-bold text-info">Khách báo đã chuyển</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    {awaitingQuote && (
                      <Button type="button" size="sm" variant="outline" onClick={() => onAction({ type: "quote", order: o })} className="h-8 text-caption gap-1">
                        <Tag size={13} /> Báo giá
                      </Button>
                    )}
                    {balance > 0 && o.status !== "CANCELLED" && (
                      <Button type="button" size="sm" onClick={() => onAction({ type: "collect", order: o })} className="h-8 bg-success hover:bg-success/90 text-white text-caption gap-1">
                        <Check size={13} /> Thu tiền
                      </Button>
                    )}
                    {o.paid_vnd > 0 && (
                      <Button type="button" size="sm" variant="outline" onClick={() => onAction({ type: "refund", order: o })} className="h-8 text-caption gap-1">
                        <RotateCcw size={13} /> Hoàn tiền
                      </Button>
                    )}
                    {cancellable && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Huỷ đơn ${o.code}`}
                        title="Huỷ đơn"
                        onClick={() => onAction({ type: "cancel", order: o })}
                        className="h-8 w-8 p-0 text-danger"
                      >
                        <Ban size={14} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ProductCell({ order }: { order: AdminOrder }) {
  const c = paymentCheckOf(order)
  return (
    <div className="flex items-center gap-2 min-w-40">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
        <FlowerImage src={c.imageUrl} alt={c.productName} sizes="40px" fallback="icon" className="h-full w-full" />
      </div>
      <div className="min-w-0">
        <div className="truncate font-semibold text-foreground">{c.productName}</div>
        <div className="text-caption text-text-muted">
          {c.listedPriceVnd !== null ? `Công bố ${vnd(c.listedPriceVnd)}` : "Chưa niêm yết giá"}
          {c.reasons.length > 0 && <span className="text-warning"> · {c.reasons.length} điều chỉnh</span>}
        </div>
      </div>
    </div>
  )
}
