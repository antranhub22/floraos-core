"use client"

import React from "react"
import { ShoppingCart, Clock, User, MapPin, Tag } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import type { StructuredAddress } from "@/modules/products/domain/product-master-index"

export interface SalesOrderIntakeCardProps {
  orderCode: string
  source: string
  customerName: string
  customerTier: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: StructuredAddress | string
  deliveryTargetTime: string
  productTitle: string
  sampleImageUrl?: string | null | undefined
  unitPriceVnd: number
  priority: "STANDARD" | "RUSH" | "VIP"
}

export function SalesOrderIntakeCard({
  orderCode,
  source,
  customerName,
  customerTier,
  recipientName,
  recipientPhone,
  deliveryAddress,
  deliveryTargetTime,
  productTitle,
  sampleImageUrl,
  unitPriceVnd,
  priority,
}: SalesOrderIntakeCardProps) {
  const priorityTone = priority === "VIP" ? "danger" : priority === "RUSH" ? "warning" : "neutral"
  const isStructured = typeof deliveryAddress === "object" && deliveryAddress !== null

  return (
    <Card className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-red-600" />
          <span className="text-xs font-bold text-text-muted">HỒ SƠ TIẾP NHẬN SALES (T01)</span>
          <span className="text-sm font-extrabold text-text">#{orderCode}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral" className="text-[10px]">
            Nguồn: {source}
          </Badge>
          <Badge tone={priorityTone} className="text-[10px] font-bold">
            {priority}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-surface-alt border border-border flex flex-col gap-1">
          <span className="text-text-muted flex items-center gap-1 font-semibold">
            <User size={12} />
            Khách hàng đặt:
          </span>
          <div className="font-extrabold text-text">
            {customerName}{" "}
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold ml-1">
              {customerTier}
            </span>
          </div>
          <div className="text-text-muted mt-1">
            Người nhận: <strong className="text-text">{recipientName}</strong> ({recipientPhone})
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-alt border border-border flex items-start gap-3">
          {sampleImageUrl && (
            <div className="w-20 h-20 rounded-lg border border-red-200 overflow-hidden shrink-0 relative bg-surface shadow-xs group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sampleImageUrl}
                alt={productTitle}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5 backdrop-blur-xs">
                Mẫu đầu vào
              </span>
            </div>
          )}
          <div className="flex-1 flex flex-col justify-between h-full">
            <div>
              <span className="text-text-muted flex items-center gap-1 font-semibold">
                <Tag size={12} />
                Sản phẩm & Giá báo:
              </span>
              <div className="font-extrabold text-text text-sm mt-0.5 line-clamp-2">{productTitle}</div>
            </div>
            <div className="text-rose-700 font-extrabold text-sm mt-1">
              {unitPriceVnd.toLocaleString("vi-VN")} đ
            </div>
          </div>
        </div>
      </div>

      {/* Khối Địa Chỉ Phân Cấp 5 Tầng */}
      <div className="flex flex-col gap-2 text-xs p-3.5 rounded-xl bg-surface-alt border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-text-muted font-bold">
            <MapPin size={14} className="text-red-600 shrink-0" />
            <span className="text-text">
              {isStructured ? deliveryAddress.street : deliveryAddress}
            </span>
          </div>
          <div className="flex items-center gap-1 font-bold text-text shrink-0 ml-2">
            <Clock size={13} className="text-rose-600" />
            <span>{deliveryTargetTime}</span>
          </div>
        </div>

        {isStructured && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-dashed border-border/70">
            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold">
              {deliveryAddress.ward}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
              {deliveryAddress.district}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
              {deliveryAddress.city}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium">
              {deliveryAddress.country || "Việt Nam"}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
