"use client"

import React from "react"
import { Calculator, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface CostBreakdownItem {
  name: string
  quantity: number | string
  unitCost: string
  total: string
}

export interface QuoteSummaryCardProps {
  productName: string
  items: CostBreakdownItem[]
  laborCost: string
  wrappingCost: string
  subtotal: string
  suggestedPrice: string
  marginPercent?: number
}

/**
 * QuoteSummaryCard (Thẻ bảng tính giá cấu thành M02)
 */
export function QuoteSummaryCard({
  productName,
  items,
  laborCost,
  wrappingCost,
  subtotal,
  suggestedPrice,
  marginPercent = 45,
}: QuoteSummaryCardProps) {
  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M02 Smart Pricing</div>
          <div className="text-[16px] font-extrabold text-text">Bảng tính giá cấu phần: {productName}</div>
        </div>
        <Badge tone="success" className="gap-1">
          <Calculator size={12} />
          Biên LN: {marginPercent}%
        </Badge>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted text-text-muted font-bold">
            <tr>
              <th className="p-2.5">Thành phần</th>
              <th className="p-2.5 text-center">SL</th>
              <th className="p-2.5 text-right">Đơn giá</th>
              <th className="p-2.5 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-muted/30">
                <td className="p-2.5 font-medium text-text">{item.name}</td>
                <td className="p-2.5 text-center text-text-muted">{item.quantity}</td>
                <td className="p-2.5 text-right text-text-muted">{item.unitCost}</td>
                <td className="p-2.5 text-right font-semibold text-text">{item.total}</td>
              </tr>
            ))}
            <tr className="bg-muted/20">
              <td colSpan={3} className="p-2.5 text-text-muted">Công thợ cắm hoa</td>
              <td className="p-2.5 text-right font-semibold text-text">{laborCost}</td>
            </tr>
            <tr className="bg-muted/20">
              <td colSpan={3} className="p-2.5 text-text-muted">Giấy gói, ruy băng & phụ liệu</td>
              <td className="p-2.5 text-right font-semibold text-text">{wrappingCost}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <div className="text-xs text-text-muted">Giá vốn trực tiếp: {subtotal}</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-0.5">
            <CheckCircle2 size={13} />
            Đã áp dụng công thức giá sàn & trần
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-muted">Giá bán đề xuất</div>
          <div className="text-lg font-black text-primary">{suggestedPrice}</div>
        </div>
      </div>
    </Card>
  )
}
