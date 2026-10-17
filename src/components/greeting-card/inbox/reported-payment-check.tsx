"use client"

import React, { useState } from "react"
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"

interface Props {
  orderId: string
  expectedVnd: number
  proofUrl: string | null
  onDone: (message: string) => void
}

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`
const FIELD = "h-10 w-full rounded-lg border border-border bg-background px-2.5 text-caption text-foreground focus:outline-none focus:ring-1 focus:ring-primary"

/** Đơn đã huỷ khi khách đã báo chuyển khoản: Điều hành kiểm sao kê rồi chốt đã hoàn / không nhận được tiền. */
export function ReportedPaymentCheck({ orderId, expectedVnd, proofUrl, onDone }: Props) {
  const [amount, setAmount] = useState(String(expectedVnd))
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState<"REFUNDED" | "NOT_RECEIVED" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function resolve(outcome: "REFUNDED" | "NOT_RECEIVED") {
    const amountVnd = Number(amount.replace(/\D/g, ""))
    if (outcome === "REFUNDED" && !(amountVnd > 0)) return setError("Nhập số tiền đã hoàn cho khách")
    setBusy(outcome)
    setError(null)
    try {
      await apiSend(
        `/api/v1/greeting-card/orders/${orderId}/reported-payment-check`,
        "POST",
        outcome === "REFUNDED" ? { outcome, amountVnd, note: note.trim() } : { outcome, note: note.trim() },
        "Không thể ghi nhận kết quả"
      )
      onDone(outcome === "REFUNDED" ? `Đã ghi nhận hoàn ${vnd(amountVnd)} vào sổ thu` : "Đã ghi nhận không nhận được tiền")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi xử lý")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 text-body-sm">
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-2.5 text-foreground">
        <p>
          Khách báo đã chuyển <strong className="font-mono">{vnd(expectedVnd)}</strong> trước khi đơn bị huỷ, nhưng tiền chưa được xác nhận.
          Kiểm tra sao kê: đã nhận thì chuyển hoàn cho khách.
        </p>
        {proofUrl && (
          <a href={proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-caption font-bold text-primary hover:underline">
            <ExternalLink size={12} /> Xem ảnh bill khách gửi
          </a>
        )}
      </div>
      {error && <p role="alert" className="text-caption font-semibold text-danger">{error}</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[10rem_1fr]">
        <input aria-label="Số tiền đã hoàn" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy !== null} className={FIELD} />
        <input type="text" aria-label="Ghi chú" placeholder="Ghi chú (mã giao dịch hoàn, đã gọi khách...)" value={note} onChange={(e) => setNote(e.target.value)} disabled={busy !== null} className={FIELD} />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={() => void resolve("NOT_RECEIVED")} className="h-11 gap-1 text-caption font-bold">
          {busy === "NOT_RECEIVED" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
          <span>Không nhận được tiền</span>
        </Button>
        <Button type="button" size="sm" disabled={busy !== null} onClick={() => void resolve("REFUNDED")} className="h-11 gap-1 text-caption font-bold">
          {busy === "REFUNDED" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          <span>Đã hoàn tiền cho khách</span>
        </Button>
      </div>
    </div>
  )
}
