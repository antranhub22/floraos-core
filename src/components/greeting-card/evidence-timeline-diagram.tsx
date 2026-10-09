"use client"

import React, { useState } from "react"
import { CheckCircle2, Clock, Copy, Check, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApi } from "@/components/greeting-card/greeting-api"
import type { TimelineEvent, StepSegment } from "@/modules/greeting-card/domain/tracking-timeline"

interface EvidenceTimelineProps {
  orderId?: string | null | undefined
  sessionId?: string | null | undefined
  orderCode?: string | null | undefined
  customerName?: string | null | undefined
  customerPhone?: string | null | undefined
  recipientName?: string | null | undefined
  recipientPhone?: string | null | undefined
  deliveryAddress?: string | null | undefined
  deliveryTimeSlot?: string | null | undefined
  productName?: string | null | undefined
  totalVnd?: number | null | undefined
  paidVnd?: number | null | undefined
}

interface TimelineResponse {
  orderId: string | null
  sessionId: string | null
  segments: StepSegment[]
  data: TimelineEvent[]
  total: number
}

function formatDt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const mo = String(d.getMonth() + 1).padStart(2, "0")
  return `${hh}:${mm} - ${dd}/${mo}/${d.getFullYear()}`
}

export function EvidenceTimelineDiagram({
  orderId,
  sessionId,
  orderCode,
  customerName,
  customerPhone,
  recipientName,
  recipientPhone,
  deliveryAddress,
  deliveryTimeSlot,
  productName,
  totalVnd,
  paidVnd,
}: EvidenceTimelineProps) {
  const [copied, setCopied] = useState(false)
  const qs = orderId ? `orderId=${encodeURIComponent(orderId)}` : `sessionId=${encodeURIComponent(sessionId ?? "")}`
  const { data, isLoading } = useApi<TimelineResponse>(`/api/v1/greeting-card/tracking/timeline?${qs}`)

  const events = data?.data ?? []
  const segments = data?.segments ?? []

  function handleCopyEvidence() {
    const lines: string[] = [
      `=== BẰNG CHỨNG ĐỐI SOÁT ĐƠN HÀNG FLORAOS ===`,
      `Mã đơn: #${orderCode || "---"}`,
      `Khách hàng: ${customerName || "---"} (${customerPhone || "---"})`,
      `Người nhận: ${recipientName || "---"} (${recipientPhone || "---"})`,
      `Địa chỉ giao: ${deliveryAddress || "---"}`,
      `Khung giờ hẹn giao: ${deliveryTimeSlot || "Trong ngày"}`,
      `Mẫu hoa: ${productName || "---"}`,
      `Giá trị: ${(totalVnd ?? 0).toLocaleString("vi-VN")} đ | Đã thanh toán: ${(paidVnd ?? 0).toLocaleString("vi-VN")} đ`,
      ``,
      `--- LỊCH SỬ DIỄN TIẾN & MỐC BẰNG CHỨNG ---`,
    ]

    if (events.length === 0) {
      lines.push(`(Chưa có bản ghi sự kiện chi tiết)`)
    } else {
      for (const ev of events) {
        lines.push(`• [${formatDt(ev.at)}] ${ev.label}${ev.note ? ` — Ghi chú: ${ev.note}` : ""}`)
      }
    }

    lines.push(``)
    lines.push(`Hệ thống đối soát xác nhận tự động · FloraOS Core`)

    void navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-alt p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          <h4 className="text-body-sm font-extrabold text-foreground">
            Lịch sử đơn hàng & bằng chứng xác nhận
          </h4>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopyEvidence}
          className="h-8 gap-1.5 text-caption font-bold"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          <span>{copied ? "Đã sao chép bằng chứng" : "Sao chép tóm tắt đối soát"}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-caption text-text-muted">
          <Clock size={16} className="mr-2 animate-spin text-primary" />
          Đang nạp dữ liệu lịch sử đối soát...
        </div>
      ) : events.length === 0 ? (
        <p className="py-4 text-center text-caption italic text-text-muted">
          Chưa ghi nhận sự kiện lịch sử nào cho mục này.
        </p>
      ) : (
        <div className="relative pl-6 before:absolute before:bottom-2 before:left-2.5 before:top-2 before:w-0.5 before:bg-border">
          <div className="flex flex-col gap-4">
            {events.map((ev, idx) => {
              const isLatest = idx === events.length - 1
              return (
                <div key={`${ev.at}-${idx}`} className="relative flex flex-col gap-0.5">
                  <div
                    className={`absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border bg-surface ${
                      isLatest ? "border-primary text-primary" : "border-border text-text-muted"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isLatest ? "bg-primary" : "bg-text-muted"}`} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-body-sm font-bold text-foreground">{ev.label}</span>
                    <span className="font-mono text-caption text-text-muted">{formatDt(ev.at)}</span>
                  </div>
                  {ev.note && <p className="text-caption text-text-muted italic">{ev.note}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {segments.length > 0 && (
        <div className="mt-2 border-t border-border/40 pt-3">
          <span className="text-caption font-bold text-text-muted block mb-1.5">
            Thời lượng từng bước:
          </span>
          <div className="flex flex-wrap gap-2">
            {segments.map((seg) => (
              <span
                key={seg.stepId}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-caption font-medium"
              >
                <CheckCircle2 size={12} className="text-success" />
                <span>{seg.title}: {seg.durationMinutes} phút</span>
                {seg.overMinutes > 0 && (
                  <span className="text-danger font-bold">(vượt {seg.overMinutes}p)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
