"use client"

import React, { useState } from "react"
import { Check, Shuffle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import {
  SUBSTITUTE_CHOICE_LABEL,
  SUBSTITUTE_MAX_OPTIONS,
  SUBSTITUTE_REASON_MAX,
  SUBSTITUTE_REASON_MIN,
  type SubstituteOption,
  type SubstitutePayload,
} from "@/modules/greeting-card/domain/substitute-proposal"

interface OptionsResponse {
  data: {
    current: { productId: string; name: string }
    lockedReason: string | null
    options: SubstituteOption[]
    latest: (SubstitutePayload & { id: string }) | null
  }
}

const money = (n: number) => (n > 0 ? `${n.toLocaleString("vi-VN")} đ` : "Liên hệ")

/**
 * Tiệm không làm được mẫu khách chọn: chọn 1–3 mẫu còn bán trong cùng bộ sưu tập + lý do. Khách
 * được báo, chọn trên trang theo dõi; tổng tiền giữ nguyên.
 */
export function SubstituteProposalModal({ orderId, orderCode, onClose, onDone }: { orderId: string; orderCode: string; onClose: () => void; onDone: () => void }) {
  const { data, isLoading, error: loadError } = useApi<OptionsResponse>(`/api/v1/greeting-card/orders/${orderId}/substitute`)
  const [picked, setPicked] = useState<string[]>([])
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const info = data?.data
  const pending = info?.latest?.status === "PENDING"
  const invalid =
    reason.trim().length < SUBSTITUTE_REASON_MIN ? "Ghi lý do cho khách hiểu (ít nhất 5 ký tự)" : picked.length === 0 ? "Chọn ít nhất một mẫu" : null

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= SUBSTITUTE_MAX_OPTIONS ? p : [...p, id]))
  }

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await apiSend(`/api/v1/greeting-card/orders/${orderId}/substitute`, "POST", { reason: reason.trim(), productIds: picked }, "Chưa gửi được đề xuất")
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa gửi được đề xuất")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div role="presentation" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="substitute-title" className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 id="substitute-title" className="text-body font-extrabold text-foreground flex items-center gap-2">
            <Shuffle size={18} className="text-primary" aria-hidden="true" /> Đề xuất mẫu khác — #{orderCode}
          </h3>
          <button type="button" aria-label="Đóng" onClick={onClose} className="text-text-muted hover:text-foreground"><X size={18} /></button>
        </div>

        {isLoading && <SkeletonBlock lines={3} label="Đang tải mẫu trong bộ sưu tập" />}
        {loadError && <p role="alert" className="text-danger text-caption">{loadError.message}</p>}

        {info && (
          <>
            <p className="text-body-sm text-text-muted">
              Khách đang đặt <strong className="text-foreground">{info.current.name}</strong>. Chọn tối đa {SUBSTITUTE_MAX_OPTIONS} mẫu thay thế; khách chọn trên trang theo dõi đơn, <strong>tổng tiền giữ nguyên</strong>.
            </p>
            {info.latest && (
              <p className="rounded-xl bg-surface-muted p-3 text-caption text-foreground">
                {info.latest.status === "PENDING"
                  ? "Đang chờ khách trả lời đề xuất trước."
                  : `Lần trước: ${info.latest.choice ? SUBSTITUTE_CHOICE_LABEL[info.latest.choice] : "đã trả lời"}${info.latest.customerNote ? ` — "${info.latest.customerNote}"` : ""}.`}
              </p>
            )}
            {info.lockedReason && <p role="alert" className="text-warning text-caption">{info.lockedReason}</p>}

            {info.options.length === 0 ? (
              <p className="text-body-sm text-text-muted">Bộ sưu tập không còn mẫu nào khác đang bán. Hãy liên hệ khách hoặc đề xuất huỷ đơn.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {info.options.map((o) => {
                  const on = picked.includes(o.productId)
                  return (
                    <li key={o.productId}>
                      <button type="button" aria-pressed={on} disabled={busy || pending || !!info.lockedReason} onClick={() => toggle(o.productId)}
                        className={`relative flex w-full flex-col gap-1 rounded-xl border p-2 text-left ${on ? "border-primary bg-primary/5" : "border-border"}`}>
                        <FlowerImage src={o.imageUrl} driveLink={o.driveLink} alt={o.name} className="aspect-square w-full rounded-lg" sizes="160px" fallback="icon" />
                        <span className="text-caption font-bold text-foreground line-clamp-2">{o.name}</span>
                        <span className="text-caption text-text-muted">{money(o.priceVnd)}</span>
                        {on && <Check size={16} className="absolute right-3 top-3 rounded-full bg-primary text-primary-foreground" aria-hidden="true" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            <label className="text-body-sm font-bold text-foreground" htmlFor="substitute-reason">Lý do (khách sẽ đọc)</label>
            <textarea id="substitute-reason" rows={2} maxLength={SUBSTITUTE_REASON_MAX} value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy || pending}
              placeholder="Vd: Hoa hồng Ecuador hôm nay về bị dập, tiệm xin đề xuất mẫu tương đương"
              className="w-full rounded-xl border border-border bg-surface-muted p-3 text-body-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </>
        )}

        {error && <p role="alert" className="text-danger text-caption">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-9 text-caption">Đóng</Button>
          <Button type="button" size="sm" disabled={!info || !!invalid || busy || pending || !!info.lockedReason} title={invalid ?? undefined} onClick={() => void submit()} className="h-9 text-caption">
            {busy ? "Đang gửi..." : "Gửi đề xuất cho khách"}
          </Button>
        </div>
      </div>
    </div>
  )
}
