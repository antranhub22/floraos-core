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
    <Card className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-4 hover:border-red-200 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase border border-zinc-200 tracking-wider">
            P2 • BRIEF (T02)
          </span>
          <span className="text-xs font-bold text-text-muted">ĐIỀU PHỐI ĐƠN</span>
          <span className="text-base font-extrabold text-text">#{orderCode}</span>
          <Badge tone={riskTone} className="font-bold text-[11px]">
            {stageLabel}
          </Badge>
          {partnerName && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10.5px] font-bold border border-blue-200">
              🏪 {partnerName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
          <Clock size={13} />
          <span>Hẹn giao: {deliveryTargetTime}</span>
        </div>
      </div>

      {riskLevel !== "NORMAL" && riskReason && (
        <div className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
            <span>{riskReason}</span>
          </div>
          {hasMissingItems && onOpenMissingInfo && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenMissingInfo}
              className="h-6 text-[11px] px-2 font-bold text-amber-900 border-amber-300 bg-amber-100 hover:bg-amber-200 shrink-0"
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
              <div className="w-12 h-12 rounded-lg border border-red-200 overflow-hidden shrink-0 relative bg-surface shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sampleImageUrl}
                  alt={productTitle || "Mẫu hoa đầu vào"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg border border-border bg-surface flex items-center justify-center shrink-0 text-text-muted">
                <Flower2 size={20} className="text-red-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded shrink-0">
                  Mẫu Input
                </span>
                <span className="font-extrabold text-text text-xs truncate">
                  {productTitle || "Bó hoa nghệ thuật"}
                </span>
              </div>
              <span className="text-[11px] text-text-muted mt-0.5 block truncate">
                Chuẩn đối chiếu AI QC & Thợ cắm
              </span>
            </div>
          </div>
          {onOpenDetail && (
            <button
              type="button"
              onClick={onOpenDetail}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 whitespace-nowrap shrink-0 hover:underline cursor-pointer"
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
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
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
              <MapPin size={13} className="text-red-600" />
              <span>Địa chỉ giao hàng:</span>
            </div>
            {typeof deliveryAddress === "object" && deliveryAddress !== null && (
              <span className="text-[9.5px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
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
              <span className="px-1.5 py-0.2 rounded bg-red-50 text-red-700 text-[10px] font-bold">
                {deliveryAddress.ward}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                {deliveryAddress.district}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">
                {deliveryAddress.city}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-dashed border-border">
        <div className="text-xs text-text-muted font-medium flex items-center gap-1.5">
          <span className="font-bold text-text">Hành động kế tiếp:</span>
          <span className="text-rose-700 font-semibold">{nextAction}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick-action buttons for specific stages */}
          {(stage === "PLANNING" || stage === "ASSIGNING" || stage === "INTAKE") && onOpenAssignModal && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAssignModal}
              className="text-xs h-7 px-2.5 font-bold border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100"
            >
              ⚡ Phân công xưởng (T06)
            </Button>
          )}

          {stage === "IN_PRODUCTION" && onOpenProduction && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenProduction}
              className="text-xs h-7 px-2.5 font-bold border-amber-200 text-amber-800 bg-amber-50/70 hover:bg-amber-100"
            >
              🌸 Phiếu cắm hoa (T07)
            </Button>
          )}

          {stage === "QUALITY_CHECK" && onOpenQC && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenQC}
              className="text-xs h-7 px-2.5 font-bold border-purple-200 text-purple-800 bg-purple-50/70 hover:bg-purple-100"
            >
              🤖 Duyệt AI QC (T14)
            </Button>
          )}

          {stage === "DISPATCHING" && onOpenPOD && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenPOD}
              className="text-xs h-7 px-2.5 font-bold border-blue-200 text-blue-800 bg-blue-50/70 hover:bg-blue-100"
            >
              📦 Biên nhận POD (T21)
            </Button>
          )}

          {(stage === "DELIVERED" || stage === "COMPLETED") && onOpenClosure && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenClosure}
              className="text-xs h-7 px-2.5 font-bold border-emerald-200 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100"
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
            <Button size="sm" onClick={onAdvanceStage} className="bg-red-600 hover:bg-red-700 text-white gap-1 h-7 text-xs font-bold">
              <span>Chuyển bước</span>
              <ArrowRight size={13} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
