"use client"

import React, { useEffect, useState } from "react"
import { X, Wallet, PlusCircle, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  coordinatorApi,
  errorMessage,
  type CoordinationOrder,
  type OrderPaymentView,
  type RecordPaymentBody,
} from "@/components/coordinator/coordinator-api"

/**
 * ĐP-4a.4 (26/09/2026) — Sổ thu của một đơn (§2.14 dac-ta-truong-du-lieu-dieu-phoi-v2).
 *
 * Hiển thị Tổng/Đã thu/Còn phải thu + lịch sử `order_payments`, và cho ghi
 * thêm một dòng (cọc/thu nốt/hoàn tiền). `paidVnd`/`balanceVnd` do MÁY CHỦ
 * tính lại mỗi lần — modal chỉ gọi API rồi hiển thị đúng đơn máy chủ trả về,
 * không tự cộng trừ ở client.
 */
export interface PaymentLedgerModalProps {
  isOpen: boolean
  order: CoordinationOrder | null
  onClose: () => void
  /** Đơn đã cập nhật (paidVnd/balanceVnd/paymentStatus mới) sau khi ghi một dòng sổ thu. */
  onRecorded: (order: CoordinationOrder) => void
}

const KIND_LABEL: Record<RecordPaymentBody["kind"], string> = {
  DEPOSIT: "Đặt cọc",
  BALANCE: "Thu nốt",
  REFUND: "Hoàn tiền",
}

const STATUS_LABEL: Record<CoordinationOrder["paymentStatus"], { label: string; className: string }> = {
  UNPAID: { label: "Chưa thu", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  PARTIALLY_PAID: { label: "Thu một phần", className: "bg-amber-100 text-amber-800 border-amber-200" },
  PAID: { label: "Đã thu đủ", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  REFUNDED: { label: "Đã hoàn tiền", className: "bg-red-100 text-red-700 border-red-200" },
}

const fmtVnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`

export function PaymentLedgerModal({ isOpen, order, onClose, onRecorded }: PaymentLedgerModalProps) {
  const [payments, setPayments] = useState<OrderPaymentView[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [kind, setKind] = useState<RecordPaymentBody["kind"]>("DEPOSIT")
  const [amountVnd, setAmountVnd] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !order) return
    let cancelled = false
    void (async () => {
      setLoadingList(true)
      setListError(null)
      try {
        const rows = await coordinatorApi.listPayments(order.id)
        if (!cancelled) setPayments(rows)
      } catch (e) {
        if (!cancelled) setListError(errorMessage(e))
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, order?.id])

  if (!isOpen || !order) return null

  const statusTag = STATUS_LABEL[order.paymentStatus]

  const handleSubmit = async () => {
    const amount = Number(amountVnd)
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Số tiền phải lớn hơn 0.")
      return
    }
    setBusy(true)
    setFormError(null)
    try {
      const body: RecordPaymentBody = {
        kind,
        amountVnd: amount,
        ...(paymentMethod.trim() ? { paymentMethod: paymentMethod.trim() } : {}),
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }
      const updated = await coordinatorApi.recordPayment(order.id, body)
      onRecorded(updated)
      const rows = await coordinatorApi.listPayments(order.id)
      setPayments(rows)
      setAmountVnd("")
      setPaymentMethod("")
      setReference("")
      setNote("")
    } catch (e) {
      setFormError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-text">Sổ Thu — Đơn #{order.orderCode}</h3>
              <p className="text-[11px] text-text-muted">Đặt cọc, thu nốt, hoàn tiền (§2.14)</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl border border-border bg-surface-alt">
            <div>
              <span className="text-text-muted block">Tổng</span>
              <strong className="text-text text-sm">{fmtVnd(order.unitPriceVnd)}</strong>
            </div>
            <div>
              <span className="text-text-muted block">Đã thu</span>
              <strong className="text-emerald-700 text-sm">{fmtVnd(order.paidVnd)}</strong>
            </div>
            <div>
              <span className="text-text-muted block">Còn phải thu</span>
              <strong className={`text-sm ${order.balanceVnd > 0 ? "text-red-700" : "text-emerald-700"}`}>{fmtVnd(order.balanceVnd)}</strong>
            </div>
            <div className="col-span-3">
              <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${statusTag.className}`}>{statusTag.label}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-text">Lịch sử thu:</span>
            {loadingList && <p className="text-text-muted">Đang tải…</p>}
            {listError && (
              <p role="alert" className="text-red-700 font-semibold">
                {listError}
              </p>
            )}
            {!loadingList && !listError && payments.length === 0 && <p className="text-text-muted">Chưa có dòng sổ thu nào.</p>}
            {payments.length > 0 && (
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-border bg-surface">
                    <div className="flex flex-col">
                      <span className="font-semibold text-text">
                        {KIND_LABEL[p.kind]} {p.paymentMethod ? `· ${p.paymentMethod}` : ""}
                      </span>
                      <span className="text-text-muted text-[10.5px]">
                        {new Date(p.collectedAt).toLocaleString("vi-VN")}
                        {p.note ? ` · ${p.note}` : ""}
                      </span>
                    </div>
                    <strong className={p.kind === "REFUND" ? "text-red-700" : "text-emerald-700"}>
                      {p.kind === "REFUND" ? "−" : "+"}
                      {fmtVnd(p.amountVnd)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col gap-2.5">
            <span className="font-bold text-text flex items-center gap-1.5">
              <PlusCircle size={14} className="text-red-600" /> Ghi dòng mới:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-text-muted block mb-1">Loại</label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as RecordPaymentBody["kind"])}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text"
                >
                  <option value="DEPOSIT">Đặt cọc</option>
                  <option value="BALANCE">Thu nốt</option>
                  <option value="REFUND">Hoàn tiền</option>
                </select>
              </div>
              <div>
                <label className="text-text-muted block mb-1">Số tiền (VNĐ) *</label>
                <input
                  type="number"
                  min={1}
                  value={amountVnd}
                  onChange={(e) => setAmountVnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text"
                />
              </div>
              <div>
                <label className="text-text-muted block mb-1">Phương thức</label>
                <input
                  type="text"
                  placeholder="Tiền mặt / Chuyển khoản…"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text"
                />
              </div>
              <div>
                <label className="text-text-muted block mb-1">Mã tham chiếu</label>
                <input
                  type="text"
                  placeholder="Mã GD / biên nhận…"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text"
                />
              </div>
              <div className="col-span-2">
                <label className="text-text-muted block mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text"
                />
              </div>
            </div>
            {kind === "REFUND" && (
              <p className="text-[10.5px] text-amber-700 font-semibold">
                Hoàn tiền chỉ dành cho Điều hành (R10) — máy chủ sẽ từ chối nếu tài khoản không đủ quyền.
              </p>
            )}
            {formError && (
              <p role="alert" className="text-red-700 font-semibold">
                {formError}
              </p>
            )}
            <Button onClick={handleSubmit} disabled={busy} className="w-full font-bold gap-1.5">
              {kind === "REFUND" ? <Undo2 size={14} /> : <PlusCircle size={14} />}
              {busy ? "Đang ghi…" : `Ghi ${KIND_LABEL[kind].toLowerCase()}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
