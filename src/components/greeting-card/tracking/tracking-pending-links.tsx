"use client"

import React, { useState } from "react"
import { AlertTriangle, ChevronDown, Link2, MessageSquare } from "lucide-react"
import { useApi } from "@/components/greeting-card/greeting-api"
import { formatMinutes } from "@/modules/greeting-card/domain/step-sla"
import type { TrackingPipelineItem } from "@/modules/greeting-card/domain/tracking-pipeline-types"

const KIND_LABEL: Record<TrackingPipelineItem["linkKind"], string> = {
  PERSONAL: "Link riêng",
  SHARED: "Link bộ sưu tập",
  LEGACY: "Link chung",
}

const hhmm = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—"

function expiryText(iso: string | null, now: number): string {
  if (!iso) return "Không hết hạn"
  const min = Math.floor((Date.parse(iso) - now) / 60_000)
  return min <= 0 ? "Đã hết hạn" : `Còn ${formatMinutes(min)}`
}

/** Khu "Chờ khách đặt": link đã gửi / khách đã mở nhưng chưa có thông tin khách — mỗi dòng một link. */
export function TrackingPendingLinks({ items, now, onMessage }: { items: TrackingPipelineItem[]; now: number; onMessage: (item: TrackingPipelineItem) => void }) {
  return (
    <section aria-labelledby="pending-links-title" className="flex flex-col gap-2">
      <h3 id="pending-links-title" className="text-body font-extrabold text-foreground">Chờ khách đặt ({items.length})</h3>
      <ShareLinksSummary />
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-body-sm text-text-muted">Không có link nào đang chờ khách.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {items.map((i) => (
            <li key={i.id} data-focus-key={i.orderId ?? i.sessionId} className={`flex flex-col gap-1.5 p-3 sm:flex-row sm:items-center sm:gap-3 ${i.stuck ? "bg-danger-bg/40" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className={`text-body-sm font-extrabold ${i.stuck ? "text-danger" : "text-foreground"}`}>
                  {i.stuck && <AlertTriangle size={14} className="mr-1 inline" aria-hidden="true" />}
                  {i.currentStepTitle}
                </p>
                <p className="text-caption text-text-muted">
                  <span className="font-semibold text-foreground">{i.saleName}</span> · {KIND_LABEL[i.linkKind]} · <span className="font-mono">{i.sendCode}</span>
                </p>
                <p className="text-caption text-text-muted">
                  {i.linkKind === "PERSONAL" ? `Gửi lúc ${hhmm(i.copiedAt)}` : `Khách mở lúc ${hhmm(i.stepStartedAt)}`} · {expiryText(i.expiresAt, now)}
                  {i.stuck && <span className="font-semibold text-danger"> · {i.stuck.message}</span>}
                </p>
              </div>
              <button type="button" onClick={() => onMessage(i)}
                className="inline-flex h-9 shrink-0 items-center gap-1 self-start rounded-lg border border-border px-2.5 text-caption font-bold text-foreground hover:bg-surface-muted sm:self-center">
                <MessageSquare size={13} className="text-primary" aria-hidden="true" /> Nhắn tin
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

interface ShareLinkRow { code: string; catalogName: string; ownerName: string; channel: string | null; copiedAt: string; opens: number; orders: number }

/** Link bộ sưu tập đã sao chép (30 ngày): ai sao chép, bao nhiêu khách mở, bao nhiêu đơn — thu gọn. */
function ShareLinksSummary() {
  const [open, setOpen] = useState(false)
  const links = useApi<{ data: ShareLinkRow[] }>(open ? "/api/v1/greeting-card/share-links" : null)
  return (
    <div className="rounded-2xl border border-border bg-surface">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left text-body-sm font-bold text-foreground hover:bg-surface-muted">
        <span className="flex items-center gap-2"><Link2 size={16} className="text-primary" aria-hidden="true" /> Link bộ sưu tập đã sao chép</span>
        <ChevronDown size={16} aria-hidden="true" className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {!links.data ? <li className="h-10 animate-pulse bg-surface-muted" aria-busy="true" />
            : links.data.data.length === 0 ? <li className="p-3 text-body-sm text-text-muted">Chưa có ai sao chép link bộ sưu tập trong 30 ngày qua.</li>
            : links.data.data.map((l) => (
              <li key={l.code} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-3 py-2 text-body-sm">
                <span className="min-w-0"><strong>{l.ownerName}</strong> · {l.catalogName}{l.channel ? ` · ${l.channel}` : ""}</span>
                <span className="text-caption text-text-muted">Sao chép {hhmm(l.copiedAt)} · {l.opens} khách mở · {l.orders} đơn</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
