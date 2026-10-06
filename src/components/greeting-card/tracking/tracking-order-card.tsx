"use client"

import React, { useState } from "react"
import { ChevronDown, Clock, MapPin, MessageSquare, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TrackingStepperView } from "./tracking-stepper-view"
import type {
  TrackingPipelineItem,
  TrackingPipelineStepId,
} from "@/modules/greeting-card/domain/tracking-pipeline-types"
import { FlowerImage } from "@/components/greeting-card/flower-image"

interface TrackingOrderCardProps {
  item: TrackingPipelineItem
  onOpenNotes: (item: TrackingPipelineItem, stepId?: TrackingPipelineStepId) => void
}

function formatVnd(val: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
}

/** "dd/mm" từ "yyyy-mm-dd". */
function shortDate(iso: string | null | undefined): string | null {
  const [, m, d] = (iso ?? "").split("-")
  return m && d ? `${d}/${m}` : null
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-caption">
      <dt className="w-24 shrink-0 text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words font-semibold text-foreground">{value}</dd>
    </div>
  )
}

/**
 * Thẻ theo dõi tiến độ — chỉ hiện điều cần để nắm tiến độ: ảnh, tên mẫu, giá,
 * giai đoạn, giờ phải giao, khu vực, sale phụ trách. Thông tin khách/người nhận
 * nằm trong "Chi tiết".
 */
export function TrackingOrderCard({ item, onOpenNotes }: TrackingOrderCardProps) {
  const [open, setOpen] = useState(false)
  const isOrder = item.type === "ORDER"
  const isPaid = item.paidVnd >= item.totalVnd && item.totalVnd > 0
  const due = [shortDate(item.deliveryDate), item.deliveryTimeSlot].filter(Boolean).join(" · ")
  const detailsId = `tracking-details-${item.id}`

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col gap-3 hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-surface border border-border overflow-hidden shrink-0">
          <FlowerImage src={item.productImageUrl} alt={item.productName} sizes="56px" fallback="icon" className="w-full h-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body font-bold text-foreground truncate" title={item.productName}>{item.productName}</p>
          <p className="text-body-sm font-extrabold text-primary">{formatVnd(item.totalVnd)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-body-sm font-extrabold text-primary">{item.currentStepTitle}</p>
          {isOrder && (
            <p className={`text-caption font-bold ${isPaid ? "text-success" : "text-warning"}`}>
              {isPaid ? "Đã thu đủ" : "Chưa thu đủ"}
            </p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-1.5 text-caption sm:grid-cols-3">
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-text-muted shrink-0" aria-hidden="true" />
          <dt className="sr-only">Thời gian phải giao</dt>
          <dd className="font-semibold text-foreground">{due || (isOrder ? "Chưa có giờ giao" : "Khách đang chọn mẫu")}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-text-muted shrink-0" aria-hidden="true" />
          <dt className="sr-only">Khu vực</dt>
          <dd className="font-semibold text-foreground">{item.deliveryZone || "—"}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <UserRound size={14} className="text-text-muted shrink-0" aria-hidden="true" />
          <dt className="text-text-muted">Sale:</dt>
          <dd className="font-semibold text-foreground truncate">{item.saleName}</dd>
        </div>
      </dl>

      <TrackingStepperView
        steps={item.steps}
        currentStepId={item.currentStepId}
        stuck={!!item.stuck}
        onSelectStepNote={(stepId) => onOpenNotes(item, stepId)}
      />

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-body-sm font-semibold text-text-muted hover:text-foreground"
        >
          <ChevronDown size={16} aria-hidden="true" className={open ? "rotate-180 transition-transform" : "transition-transform"} />
          Chi tiết
        </button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenNotes(item, item.currentStepId)}
          className="h-9 gap-1.5 text-caption font-bold"
        >
          <MessageSquare size={14} className="text-primary" aria-hidden="true" />
          Lưu ý nội bộ{item.notes.length > 0 ? ` (${item.notes.length})` : ""}
        </Button>
      </div>

      {open && (
        <dl id={detailsId} className="flex flex-col gap-1.5 rounded-xl bg-surface-muted p-3">
          <DetailRow label="Mã" value={item.orderCode ? `Đơn ${item.orderCode}` : `Link ${item.sendCode}`} />
          <DetailRow label="Bộ sưu tập" value={item.catalogName} />
          <DetailRow label="Người đặt" value={[item.customerName, item.customerPhone].filter(Boolean).join(" · ")} />
          <DetailRow label="Người nhận" value={[item.recipientName, item.recipientPhone].filter(Boolean).join(" · ")} />
          <DetailRow label="Địa chỉ" value={item.deliveryAddress} />
          <DetailRow label="Thanh toán" value={isOrder ? `${formatVnd(item.paidVnd)} / ${formatVnd(item.totalVnd)}` : null} />
          <DetailRow label="Lời chúc" value={item.cardMessage ? `“${item.cardMessage}”` : null} />
        </dl>
      )}
    </div>
  )
}
