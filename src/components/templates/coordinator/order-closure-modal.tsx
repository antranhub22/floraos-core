"use client"

import React, { useState } from "react"
import { X, Award, CheckCircle2, Clock, Star, FileCheck, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { errorMessage, type CoordinationOrder } from "@/components/coordinator/coordinator-api"

/**
 * P7 — Nghiệm thu & đóng đơn (Template T25/T26, F14).
 *
 * SLA và điều kiện đóng đơn đọc từ dữ liệu thật của đơn (giờ hẹn, giờ giao
 * thực tế, QC, POD, sự cố). Bản trước in cứng "SLA XUẤT SẮC — GIAO SỚM 12
 * PHÚT" và năm dấu tích xanh bất kể đơn thế nào. Máy chủ vẫn là nơi quyết
 * định cuối (chặn đóng khi còn sự cố).
 */
export interface OrderClosureModalProps {
  isOpen: boolean
  order: CoordinationOrder | null
  onClose: () => void
  onSubmit: (input: { partnerRating?: number; partnerPayoutVnd?: number; notes?: string }) => Promise<void>
}

function slaSummary(order: CoordinationOrder): { label: string; tone: "ok" | "late" | "unknown" } {
  const target = order.deliveryTargetAt ? new Date(order.deliveryTargetAt) : null
  const actual = order.delivery.actualDeliveryAt ? new Date(order.delivery.actualDeliveryAt) : null
  if (!target || !actual) return { label: "Không đo được (thiếu giờ hẹn hoặc giờ giao)", tone: "unknown" }
  const diff = Math.round((actual.getTime() - target.getTime()) / 60_000)
  if (diff <= 0) return { label: `Đúng hẹn (sớm ${Math.abs(diff)} phút)`, tone: "ok" }
  return { label: `Trễ ${diff} phút`, tone: "late" }
}

export function OrderClosureModal({ isOpen, order, onClose, onSubmit }: OrderClosureModalProps) {
  const [partnerRating, setPartnerRating] = useState<number>(5)
  const [closureNotes, setClosureNotes] = useState("")
  const [payout, setPayout] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !order) return null

  const sla = slaSummary(order)
  const checks = [
    { ok: order.stage === "DELIVERED", label: "Đơn ở bước Đã giao" },
    { ok: Boolean(order.delivery.podImageUrl || order.delivery.podRecipientName), label: "Có bằng chứng giao (POD)" },
    { ok: order.qc?.status === "PASSED", label: "QC gần nhất: Đạt" },
    { ok: Boolean(order.partner), label: `Đối tác: ${order.partnerName ?? "chưa phân công"}` },
    { ok: !order.hasException, label: "Không còn sự cố mở" },
  ]
  const ready = checks.every((c) => c.ok)
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("vi-VN") : "—")

  const handleClose = async () => {
    const payoutNumber = payout.trim() === "" ? undefined : Number(payout)
    if (payoutNumber !== undefined && (!Number.isFinite(payoutNumber) || payoutNumber < 0)) {
      setError("Tiền công đối tác phải là số không âm.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit({
        ...(order.partner ? { partnerRating } : {}),
        ...(payoutNumber !== undefined ? { partnerPayoutVnd: payoutNumber } : {}),
        ...(closureNotes.trim() ? { notes: closureNotes.trim() } : {}),
      })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Award size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase border border-zinc-200">
                  CHẶNG P7 • HOÀN TẤT ĐƠN
                </span>
                <h3 className="text-base font-extrabold text-text">Nghiệm Thu & Đóng Đơn (T25/T26)</h3>
              </div>
              <p className="text-[11px] text-text-muted">Đơn #{order.orderCode}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 text-xs">
          <div
            className={`p-4 rounded-xl border flex flex-col gap-2 ${
              sla.tone === "ok" ? "border-emerald-200 bg-emerald-50/50" : sla.tone === "late" ? "border-amber-200 bg-amber-50/50" : "border-border bg-surface-alt"
            }`}
          >
            <span className="font-extrabold text-text flex items-center gap-1.5">
              <Clock size={14} /> SLA giao hàng: {sla.label}
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11.5px]">
              <div>
                <span className="text-text-muted block">Hẹn với khách:</span>
                <strong className="text-text">{order.deliveryTargetAt ? fmt(order.deliveryTargetAt) : order.deliveryTargetTime}</strong>
              </div>
              <div>
                <span className="text-text-muted block">Giao thực tế:</span>
                <strong className="text-text">{fmt(order.delivery.actualDeliveryAt)}</strong>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface-alt flex flex-col gap-2">
            <span className="font-bold text-text flex items-center gap-1.5">
              <FileCheck size={14} className="text-red-600" /> Điều kiện đóng đơn:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {checks.map((c) => (
                <div key={c.label} className={`flex items-center gap-1.5 font-semibold ${c.ok ? "text-emerald-800" : "text-red-700"}`}>
                  {c.ok ? <CheckCircle2 size={13} className="shrink-0" /> : <XCircle size={13} className="shrink-0" />}
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col gap-3">
            {order.partner && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-text">Chấm đối tác {order.partnerName}:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" aria-label={`${star} sao`} onClick={() => setPartnerRating(star)} className="p-0.5">
                    <Star size={20} className={star <= partnerRating ? "fill-amber-400 text-amber-500" : "text-zinc-300"} />
                  </button>
                ))}
              </div>
            )}
            <div>
              <label className="font-bold text-text block mb-1">Tiền công trả đối tác (VNĐ):</label>
              <input
                type="number"
                min={0}
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
                placeholder="Để trống nếu chưa chốt"
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="font-bold text-text block mb-1">Ghi chú nghiệm thu:</label>
              <textarea
                rows={2}
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-surface text-text focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-800 font-semibold">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between gap-3 sticky bottom-0 bg-surface">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button
            size="sm"
            disabled={busy || !ready}
            onClick={handleClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 px-4"
          >
            <CheckCircle2 size={14} />
            <span>{busy ? "Đang đóng đơn…" : "Hoàn tất & đóng đơn"}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
