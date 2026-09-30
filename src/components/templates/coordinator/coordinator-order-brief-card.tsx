"use client"

import React from "react"
import { Clock, AlertTriangle, ArrowRight, User, MapPin, Flower2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { StructuredAddress } from "@/modules/products/domain/product-master-index"

export interface CoordinatorOrderBriefProps {
  orderCode: string
  stage: string
  stageLabel: string
  riskLevel: "NORMAL" | "ATTENTION" | "AT_RISK" | "CRITICAL"
  riskReason?: string | null | undefined
  customerName: string
  customerTier: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: StructuredAddress | string
  deliveryTargetTime: string
  nextAction: string
  productTitle?: string | undefined
  sampleImageUrl?: string | null | undefined
  partnerName?: string | undefined
  hasMissingItems?: boolean | undefined
  onOpenDetail?: () => void
  onAdvanceStage?: () => void
  onOpenAssignModal?: () => void
  onOpenMissingInfo?: () => void
  onOpenProduction?: () => void
  onOpenQC?: () => void
  onOpenPOD?: () => void
  onOpenClosure?: () => void
}

export function CoordinatorOrderBriefCard({
  orderCode,
  stage,
  stageLabel,
  riskLevel,
  riskReason,
  customerName,
  customerTier,
  recipientName,
  recipientPhone,
  deliveryAddress,
  deliveryTargetTime,
  nextAction,
  productTitle,
  sampleImageUrl,
  partnerName,
  hasMissingItems,
  onOpenDetail,
  onAdvanceStage,
  onOpenAssignModal,
  onOpenMissingInfo,
  onOpenProduction,
  onOpenQC,
  onOpenPOD,
  onOpenClosure,
}: CoordinatorOrderBriefProps) {
  const riskTone =
    riskLevel === "CRITICAL"
      ? "danger"
      : riskLevel === "AT_RISK"
      ? "warning"
      : riskLevel === "ATTENTION"
      ? "neutral"
      : "success"

  return (
    <Card className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-4 hover:border-alert-200 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-cool-100 text-cool-700 text-caption font-black uppercase border border-cool-200 tracking-wider">
            P2 • BRIEF (T02)
          </span>
          <span className="text-xs font-bold text-text-muted">ĐIỀU PHỐI ĐƠN</span>
          <span className="text-base font-extrabold text-text">#{orderCode}</span>
          <Badge tone={riskTone} className="font-bold text-caption">
            {stageLabel}
          </Badge>
          {partnerName && (
            <span className="px-2 py-0.5 rounded-full bg-ocean-50 text-ocean-700 text-caption font-bold border border-ocean-200">
              🏪 {partnerName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blush-600 bg-blush-50 px-2.5 py-1 rounded-full border border-blush-200">
          <Clock size={13} />
          <span>Hẹn giao: {deliveryTargetTime}</span>
        </div>
      </div>

      {riskLevel !== "NORMAL" && riskReason && (
        <div className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-sand-50 border border-sand-200 text-sand-900 text-xs font-medium">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 text-sand-600 mt-0.5" />
            <span>{riskReason}</span>
          </div>
          {hasMissingItems && onOpenMissingInfo && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenMissingInfo}
              className="h-6 text-caption px-2 font-bold text-sand-900 border-sand-300 bg-sand-100 hover:bg-sand-200 shrink-0"
            >
              Xem Phiếu Thiếu Tin (T03)
            </Button>
          )}
        </div>
      )}

      {/* Khối Ảnh Mẫu & Thông Tin Sản Phẩm Đầu Vào */}
      {(productTitle || sampleImageUrl) && (
        <div className="p-2.5 rounded-xl bg-surface-alt/70 border border-border/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {sampleImageUrl ? (
              <div className="w-12 h-12 rounded-lg border border-alert-200 overflow-hidden shrink-0 relative bg-surface shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sampleImageUrl}
                  alt={productTitle || "Mẫu hoa đầu vào"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg border border-border bg-surface flex items-center justify-center shrink-0 text-text-muted">
                <Flower2 size={20} className="text-alert-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-caption font-bold text-alert-700 bg-alert-50 border border-alert-200 px-1.5 py-0.2 rounded shrink-0">
                  Mẫu Input
                </span>
                <span className="font-extrabold text-text text-xs truncate">
                  {productTitle || "Bó hoa nghệ thuật"}
                </span>
              </div>
              <span className="text-caption text-text-muted mt-0.5 block truncate">
                Chuẩn đối chiếu AI QC & Thợ cắm
              </span>
            </div>
          </div>
          {onOpenDetail && (
            <button
              type="button"
              onClick={onOpenDetail}
              className="text-caption font-bold text-alert-600 hover:text-alert-700 whitespace-nowrap shrink-0 hover:underline cursor-pointer"
            >
              Chi tiết →
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-surface-alt border border-border/60 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-text-muted font-semibold">
            <User size={13} />
            <span>Khách đặt:</span>
            <span className="text-text font-bold">{customerName}</span>
            <span className="px-1.5 py-0.5 rounded bg-sand-100 text-sand-800 text-caption font-bold">
              {customerTier}
            </span>
          </div>
          <div className="text-text-muted">
            Người nhận: <strong className="text-text">{recipientName}</strong> ({recipientPhone})
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-alt border border-border/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-text-muted font-semibold">
              <MapPin size={13} className="text-alert-600" />
              <span>Địa chỉ giao hàng:</span>
            </div>
            {typeof deliveryAddress === "object" && deliveryAddress !== null && (
              <span className="text-caption font-bold text-alert-700 bg-alert-100 px-1.5 py-0.2 rounded">
                Chuẩn 5 tầng
              </span>
            )}
          </div>
          <div className="text-text line-clamp-2 font-bold">
            {typeof deliveryAddress === "object" && deliveryAddress !== null
              ? deliveryAddress.street
              : deliveryAddress}
          </div>
          {typeof deliveryAddress === "object" && deliveryAddress !== null && (
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              <span className="px-1.5 py-0.2 rounded bg-alert-50 text-alert-700 text-caption font-bold">
                {deliveryAddress.ward}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-ocean-50 text-ocean-700 text-caption font-bold">
                {deliveryAddress.district}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-orchid-50 text-orchid-700 text-caption font-bold">
                {deliveryAddress.city}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-dashed border-border">
        <div className="text-xs text-text-muted font-medium flex items-center gap-1.5">
          <span className="font-bold text-text">Hành động kế tiếp:</span>
          <span className="text-blush-700 font-semibold">{nextAction}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick-action buttons for specific stages */}
          {(stage === "PLANNING" || stage === "ASSIGNING" || stage === "INTAKE") && onOpenAssignModal && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAssignModal}
              className="text-xs h-7 px-2.5 font-bold border-navy-200 text-navy-700 bg-navy-50/70 hover:bg-navy-100"
            >
              ⚡ Phân công xưởng (T06)
            </Button>
          )}

          {stage === "IN_PRODUCTION" && onOpenProduction && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenProduction}
              className="text-xs h-7 px-2.5 font-bold border-sand-200 text-sand-800 bg-sand-50/70 hover:bg-sand-100"
            >
              🌸 Phiếu cắm hoa (T07)
            </Button>
          )}

          {stage === "QUALITY_CHECK" && onOpenQC && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenQC}
              className="text-xs h-7 px-2.5 font-bold border-orchid-200 text-orchid-800 bg-orchid-50/70 hover:bg-orchid-100"
            >
              🤖 Duyệt AI QC (T14)
            </Button>
          )}

          {stage === "DISPATCHING" && onOpenPOD && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenPOD}
              className="text-xs h-7 px-2.5 font-bold border-ocean-200 text-ocean-800 bg-ocean-50/70 hover:bg-ocean-100"
            >
              📦 Biên nhận POD (T21)
            </Button>
          )}

          {(stage === "DELIVERED" || stage === "COMPLETED") && onOpenClosure && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenClosure}
              className="text-xs h-7 px-2.5 font-bold border-mint-200 text-mint-800 bg-mint-50/70 hover:bg-mint-100"
            >
              ✅ Nghiệm thu (T25)
            </Button>
          )}

          {onOpenDetail && (
            <Button variant="outline" size="sm" onClick={onOpenDetail} className="h-7 text-xs font-bold">
              Chi tiết
            </Button>
          )}

          {onAdvanceStage && (
            <Button size="sm" onClick={onAdvanceStage} className="bg-alert-600 hover:bg-alert-700 text-white gap-1 h-7 text-xs font-bold">
              <span>Chuyển bước</span>
              <ArrowRight size={13} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
