"use client"

import React, { useState } from "react"
import { AlertTriangle, Clock, MessageSquare, Phone, Calendar } from "lucide-react"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import { zaloHref } from "@/components/greeting-card/work/work-item-card"
import { groupSaleKanban } from "@/modules/greeting-card/domain/sale-kanban"
import { STEP_OWNER_LABEL, formatMinutes } from "@/modules/greeting-card/domain/step-sla"
import type { TrackingPipelineItem, TrackingPipelineStepId } from "@/modules/greeting-card/domain/tracking-pipeline-types"
import { BrochureOrderDetailModal, type OrderDetailModalTarget } from "@/components/greeting-card/brochure-order-detail-modal"

interface Props {
  items: TrackingPipelineItem[]
  now: number
  onOpenNotes: (item: TrackingPipelineItem, stepId?: TrackingPipelineStepId) => void
  /** Đang xem "Tất cả khách" → ghi tên sale phụ trách trên thẻ. */
  showSale: boolean
  /** Đơn đã xong đang bị ẩn (chưa bấm lọc "Xong") → cột cuối nhắc cách xem. */
  doneHidden: boolean
}

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`
const ACTION = "inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-caption font-bold text-foreground hover:bg-surface-muted"

/** Kanban của Sale: 9 cột = 9 bước của quy trình, mỗi khách một thẻ ở đúng bước hiện tại. */
export function SalesKanbanView({ items, now, onOpenNotes, showSale, doneHidden }: Props) {
  const [detailTarget, setDetailTarget] = useState<OrderDetailModalTarget | null>(null)
  const columns = groupSaleKanban(items)

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 pt-1" aria-label="Bảng Kanban khách theo 9 bước">
        {columns.map(({ step, items: colItems, needsMe }) => (
          <section
            key={step.id}
            aria-label={`Bước ${step.orderIndex}: ${step.title}`}
            className="flex w-72 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-surface-alt p-2.5 shadow-xs"
          >
            <header className="flex flex-col gap-0.5 px-1 py-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-caption font-bold text-text-muted">Bước {step.orderIndex}</span>
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-caption font-bold text-text-muted">
                  {colItems.length}
                </span>
              </div>
              <h3 className="text-body-sm font-extrabold text-foreground">{step.title}</h3>
              <p className="text-caption text-text-muted">
                Phụ trách: {step.roleResponsible}
                {needsMe > 0 && <span className="ml-1 font-semibold text-danger">· {needsMe} cần bạn</span>}
              </p>
            </header>

            <div className="flex min-h-[120px] flex-col gap-2">
              {colItems.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 p-4 text-center text-caption italic text-text-muted">
                  {step.id === "STEP_9_COMPLETED" && doneHidden ? "Bấm lọc “Xong” để xem khách đã hoàn tất" : "Không có khách"}
                </div>
              ) : (
                colItems.map((item) => (
                  <SaleKanbanCard
                    key={item.id}
                    item={item}
                    now={now}
                    onOpenNotes={onOpenNotes}
                    showSale={showSale}
                    onOpenDetail={() =>
                      setDetailTarget({
                        orderId: item.orderId,
                        sessionId: item.sessionId,
                        orderCode: item.orderCode,
                        sendCode: item.sendCode,
                        customerName: item.customerName,
                        customerPhone: item.customerPhone,
                        recipientName: item.recipientName,
                        recipientPhone: item.recipientPhone,
                        deliveryAddress: item.deliveryAddress,
                        deliveryDate: item.deliveryDate,
                        deliveryTimeSlot: item.deliveryTimeSlot,
                        deliveryZone: item.deliveryZone,
                        cardMessage: item.cardMessage,
                        productName: item.productName,
                        productImageUrl: item.productImageUrl,
                        totalVnd: item.totalVnd,
                        paidVnd: item.paidVnd,
                        balanceVnd: item.balanceVnd,
                        saleName: item.saleName,
                        currentStepTitle: item.currentStepTitle,
                        channel: item.channel,
                        createdAt: item.createdAt,
                      })
                    }
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      {detailTarget && (
        <BrochureOrderDetailModal
          target={detailTarget}
          onClose={() => setDetailTarget(null)}
          onOpenNotes={() => {
            const found = items.find((i) => (detailTarget.orderId && i.orderId === detailTarget.orderId) || i.sessionId === detailTarget.sessionId)
            if (found) onOpenNotes(found, found.currentStepId)
          }}
        />
      )}
    </>
  )
}

function SaleKanbanCard({
  item,
  now,
  onOpenNotes,
  showSale,
  onOpenDetail,
}: {
  item: TrackingPipelineItem
  now: number
  onOpenNotes: Props["onOpenNotes"]
  showSale: boolean
  onOpenDetail: () => void
}) {
  const mine = item.stuck?.owner === "SALE"
  const waited = Math.max(0, Math.floor((now - Date.parse(item.stepStartedAt)) / 60_000))

  return (
    <article
      data-focus-key={item.orderId ?? item.sessionId}
      className={`flex flex-col gap-2 rounded-xl border bg-surface p-3 shadow-xs transition-shadow hover:shadow-md ${
        mine ? "border-danger/60 bg-danger-bg/10" : "border-border"
      }`}
    >
      {/* Clickable Header & Info to open detail pop-up */}
      <button
        type="button"
        onClick={onOpenDetail}
        className="flex flex-col gap-2 text-left w-full cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-1.5 w-full">
          <span className="min-w-0 truncate text-body-sm font-bold text-foreground group-hover:text-primary transition-colors">
            {item.customerName}
          </span>
          <span className="shrink-0 font-mono text-caption text-text-muted">
            {item.orderCode ? `Đơn ${item.orderCode}` : `Link ${item.sendCode}`}
          </span>
        </div>

        {/* MỐC THỜI GIAN GIAO HÀNG TO NỔI BẬT */}
        {(item.deliveryTimeSlot || item.deliveryDate) && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-caption font-extrabold text-primary flex items-center gap-1.5 w-full">
            <Clock size={13} className="shrink-0 text-primary" />
            <span className="truncate">
              Giao: {item.deliveryTimeSlot || "Trong ngày"}
              {item.deliveryDate ? ` · ${item.deliveryDate}` : ""}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 w-full">
          <FlowerImage
            src={item.productImageUrl}
            alt={item.productName}
            sizes="40px"
            fallback="icon"
            className="h-10 w-10 shrink-0 rounded-lg border border-border"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption font-semibold text-foreground">{item.productName}</p>
            <p className="truncate text-caption font-extrabold text-primary">
              {item.totalVnd > 0 ? vnd(item.totalVnd) : "Chưa có giá"}
            </p>
          </div>
        </div>

        <p className="inline-flex items-center gap-1 text-caption text-text-muted">
          <Clock size={12} aria-hidden="true" /> Ở bước này {formatMinutes(waited)}
          {showSale && <span className="truncate">· {item.saleName}</span>}
        </p>
      </button>

      {item.stuck && (
        <p
          role={mine ? "alert" : undefined}
          className={`flex items-start gap-1.5 rounded-lg p-2 text-caption font-semibold ${
            mine ? "bg-danger-bg text-danger" : "bg-warning-bg text-warning"
          }`}
        >
          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{mine ? "Cần bạn: " : `Đang chờ ${STEP_OWNER_LABEL[item.stuck.owner]}: `}{item.stuck.message}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 border-t border-border/40 pt-2">
        {item.customerPhone && (
          <>
            <a href={`tel:${item.customerPhone}`} className={ACTION}>
              <Phone size={12} aria-hidden="true" /> Gọi
            </a>
            <a href={zaloHref(item.customerPhone)} target="_blank" rel="noreferrer" className={ACTION}>
              Zalo
            </a>
          </>
        )}
        <button type="button" onClick={() => onOpenNotes(item, item.currentStepId)} className={ACTION}>
          <MessageSquare size={12} className="text-primary" aria-hidden="true" /> Nhắn tin
        </button>
      </div>
    </article>
  )
}
