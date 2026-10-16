"use client"

import { useEffect, useState } from "react"
import { History, X, ChevronRight } from "lucide-react"
import { customerOrderStatusLabel, type FamilyMember } from "@/modules/greeting-card/domain/order-family"
import { familyHref } from "./use-order-family"

const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`
const dateVi = (iso: string) => {
  const [y, m, d] = iso.split("-")
  return y && m && d ? `${d}/${m}/${y}` : iso
}

/** Nút "Lịch sử đơn hàng" + danh sách các đơn khách đã đặt từ cùng link; bấm một đơn để mở lại. */
export function OrderHistorySheet({ members, currentSendCode }: { members: FamilyMember[]; currentSendCode: string }) {
  const [open, setOpen] = useState(false)
  const orderCount = members.filter((m) => m.order).length

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  // Mới nhất lên đầu
  const list = [...members].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <div className="flex justify-end px-4 pt-3 sm:px-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 text-body-sm font-semibold text-foreground hover:bg-surface-muted"
        >
          <History size={16} aria-hidden="true" />
          Lịch sử đơn hàng ({orderCount})
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="order-history-title">
          {/* Bấm ra ngoài để đóng */}
          <button type="button" aria-label="Đóng lịch sử đơn hàng" tabIndex={-1} onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id="order-history-title" className="text-body font-bold text-foreground">Lịch sử đơn hàng</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-text-muted hover:bg-surface-muted">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <ul className="flex flex-col divide-y divide-border overflow-y-auto">
              {list.map((m) => {
                const current = m.sendCode === currentSendCode
                const body = (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{m.order ? `Đơn ${m.order.code}` : "Đơn đang đặt dở"}</span>
                        {current && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-caption font-semibold text-primary">Đang xem</span>}
                      </div>
                      {m.productName && <div className="truncate text-body-sm text-text-muted">{m.productName}</div>}
                      <div className="text-caption text-text-muted">
                        {customerOrderStatusLabel(m)}
                        {m.order?.deliveryDate ? ` · Giao ${dateVi(m.order.deliveryDate)}` : ""}
                        {m.order && m.order.totalVnd > 0 ? ` · ${vnd(m.order.totalVnd)}` : ""}
                      </div>
                      {!m.available && <div className="text-caption text-warning">Link đã hết hạn</div>}
                    </div>
                    {!current && m.available && <ChevronRight size={18} className="shrink-0 text-text-muted" aria-hidden="true" />}
                  </>
                )
                return (
                  <li key={m.sendCode}>
                    {current || !m.available ? (
                      <div className="flex items-center gap-3 px-4 py-3">{body}</div>
                    ) : (
                      // Tải hẳn trang đích: mỗi đơn là một trang riêng, khách chủ động chọn → không tự chuyển đi
                      <a href={familyHref(m.sendCode)} className="flex min-h-11 items-center gap-3 px-4 py-3 hover:bg-surface-muted">{body}</a>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
