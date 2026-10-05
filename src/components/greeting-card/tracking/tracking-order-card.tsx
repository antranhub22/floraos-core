"use client"

import React from "react"
import { MessageSquare, MapPin, Calendar, Phone, User } from "lucide-react"
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

export function TrackingOrderCard({ item, onOpenNotes }: TrackingOrderCardProps) {
  const isOrder = item.type === "ORDER"
  const isPaid = item.paidVnd >= item.totalVnd && item.totalVnd > 0

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-4 hover:border-primary/40 transition-colors">
      {/* Header: Code, catalog, and active step badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-body text-foreground">
            {item.orderCode ? `Đơn ${item.orderCode}` : `Link ${item.sendCode}`}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted text-caption font-bold">
            {item.catalogName}
          </span>
          {isOrder ? (
            <span
              className={`px-2 py-0.5 rounded-full text-caption font-bold ${
                isPaid
                  ? "bg-success-bg text-success border border-success/30"
                  : "bg-warning-bg text-warning border border-warning/30"
              }`}
            >
              {isPaid ? "Đã thanh toán đủ" : `Chưa thanh toán (${formatVnd(item.balanceVnd)})`}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-info-bg text-info text-caption font-bold border border-info/30">
              Khách đang duyệt mẫu
            </span>
          )}
        </div>

        {/* Current status tag & Internal Note trigger */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenNotes(item, item.currentStepId)}
            className="h-8 gap-1.5 text-caption font-bold text-foreground border-border hover:bg-surface-hover"
          >
            <MessageSquare size={14} className="text-primary" />
            <span>Lưu ý nội bộ</span>
            {item.notes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-caption font-extrabold">
                {item.notes.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Product snapshot (4 cols) */}
        <div className="md:col-span-4 flex gap-3 items-center">
          <div className="w-16 h-16 rounded-xl bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
            <FlowerImage src={item.productImageUrl} alt={item.productName} sizes="64px" fallback="icon" className="w-full h-full" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-caption text-text-muted font-bold">Mẫu hoa đã chọn</span>
            <span className="text-body font-bold text-foreground truncate" title={item.productName}>
              {item.productName}
            </span>
            <span className="text-caption font-extrabold text-primary">
              {formatVnd(item.totalVnd)}
            </span>
          </div>
        </div>

        {/* Customer & Delivery (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-1 text-caption text-text-muted">
          <div className="flex items-center gap-1.5 text-foreground font-bold">
            <User size={13} className="text-primary" />
            <span>Người đặt: {item.customerName}</span>
            {item.customerPhone && (
              <span className="text-text-muted font-normal">({item.customerPhone})</span>
            )}
          </div>

          {item.recipientName && (
            <div className="flex items-center gap-1.5">
              <Phone size={13} className="text-text-muted" />
              <span>Người nhận: <strong className="text-foreground">{item.recipientName}</strong> ({item.recipientPhone || "—"})</span>
            </div>
          )}

          {item.deliveryAddress && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin size={13} className="text-text-muted shrink-0" />
              <span className="truncate" title={item.deliveryAddress}>{item.deliveryAddress}</span>
            </div>
          )}

          {item.deliveryDate && (
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-text-muted" />
              <span>Ngày giao: <strong className="text-foreground">{item.deliveryDate}</strong></span>
            </div>
          )}
        </div>

        {/* Status Callout (3 cols) */}
        <div className="md:col-span-3 flex flex-col justify-center items-start md:items-end p-3 rounded-xl bg-surface border border-border">
          <span className="text-caption text-text-muted font-bold">Giai đoạn hiện tại</span>
          <span className="text-body-sm font-extrabold text-primary text-left md:text-right mt-0.5">
            {item.currentStepTitle}
          </span>
          <span className="text-caption text-text-muted mt-1">
            Cập nhật: {new Date(item.lastActiveAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Stepper horizontal line */}
      <div className="pt-2 border-t border-border">
        <TrackingStepperView
          steps={item.steps}
          currentStepId={item.currentStepId}
          onSelectStepNote={(stepId) => onOpenNotes(item, stepId)}
        />
      </div>

      {/* Card message if present */}
      {item.cardMessage && (
        <div className="p-2.5 rounded-xl bg-surface border border-border text-caption flex items-start gap-2">
          <span className="font-bold text-foreground shrink-0">Lời chúc thiệp:</span>
          <span className="italic text-text-muted">&ldquo;{item.cardMessage}&rdquo;</span>
        </div>
      )}
    </div>
  )
}
