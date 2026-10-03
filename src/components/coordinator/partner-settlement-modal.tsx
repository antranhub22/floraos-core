"use client"

import React, { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  calculateNetworkMargin,
  generateSettlementCsv,
  type PartnerSettlementItem,
  type PartnerSettlementPeriod,
  type SettlementStatus,
} from "@/modules/coordinator/domain/partner-settlement"

export interface PartnerSettlementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId?: string | undefined
  partnerName?: string | undefined
  initialPeriod?: PartnerSettlementPeriod | undefined
}

const SAMPLE_SETTLEMENT_ITEMS: PartnerSettlementItem[] = [
  {
    id: "item-1",
    orderId: "ord-101",
    orderCode: "FL-8921",
    partnerId: "partner-1",
    partnerName: "Xưởng Hoa Tươi An Nhiên",
    arrangementType: "BO_HOA",
    craftFeeVnd: 60_000,
    materialAllowanceVnd: 0,
    shippingAllowanceVnd: 25_000,
    bonusVnd: 10_000,
    penaltyVnd: 0,
    netPayableVnd: 95_000,
    orderPriceVnd: 650_000,
    status: "DA_DOI_SOAT",
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    notes: "Đúng giờ, hoa hồng tươi đều",
  },
  {
    id: "item-2",
    orderId: "ord-102",
    orderCode: "FL-8924",
    partnerId: "partner-1",
    partnerName: "Xưởng Hoa Tươi An Nhiên",
    arrangementType: "KE_KHAI_TRUONG",
    craftFeeVnd: 180_000,
    materialAllowanceVnd: 50_000,
    shippingAllowanceVnd: 0,
    bonusVnd: 20_000,
    penaltyVnd: 0,
    netPayableVnd: 250_000,
    orderPriceVnd: 1_850_000,
    status: "DA_DOI_SOAT",
    completedAt: new Date(Date.now() - 43200000).toISOString(),
    notes: "Kệ 2 tầng hoa hướng dương xuất sắc",
  },
  {
    id: "item-3",
    orderId: "ord-103",
    orderCode: "FL-8930",
    partnerId: "partner-1",
    partnerName: "Xưởng Hoa Tươi An Nhiên",
    arrangementType: "GIO_HOA",
    craftFeeVnd: 75_000,
    materialAllowanceVnd: 0,
    shippingAllowanceVnd: 20_000,
    bonusVnd: 0,
    penaltyVnd: 15_000,
    netPayableVnd: 80_000,
    orderPriceVnd: 550_000,
    status: "CHO_DOI_SOAT",
    completedAt: new Date().toISOString(),
    notes: "Trễ giao hẹn 20 phút do mưa lớn",
  },
]

export function PartnerSettlementModal({
  open,
  onOpenChange,
  partnerId = "partner-1",
  partnerName = "Xưởng Hoa Tươi An Nhiên",
  initialPeriod,
}: PartnerSettlementModalProps) {
  const [items, setItems] = useState<PartnerSettlementItem[]>(
    initialPeriod?.items ?? SAMPLE_SETTLEMENT_ITEMS.filter((i) => i.partnerId === partnerId),
  )
  const [periodStatus, setPeriodStatus] = useState<SettlementStatus>(
    initialPeriod?.settlementStatus ?? "CHO_DOI_SOAT",
  )

  const totalOrders = items.length
  const totalOrderPrice = items.reduce((sum, i) => sum + i.orderPriceVnd, 0)
  const totalCraftFee = items.reduce((sum, i) => sum + i.craftFeeVnd, 0)
  const totalAllowance = items.reduce((sum, i) => sum + i.materialAllowanceVnd + i.shippingAllowanceVnd, 0)
  const totalBonus = items.reduce((sum, i) => sum + i.bonusVnd, 0)
  const totalPenalty = items.reduce((sum, i) => sum + i.penaltyVnd, 0)
  const totalNetPayable = items.reduce((sum, i) => sum + i.netPayableVnd, 0)

  const marginSummary = calculateNetworkMargin(totalOrderPrice, totalNetPayable)

  const handleExportCsv = () => {
    const periodData: PartnerSettlementPeriod = {
      periodId: "2026-W39",
      partnerId,
      partnerName,
      totalOrders,
      totalOrderPriceVnd: totalOrderPrice,
      totalCraftFeeVnd: totalCraftFee,
      totalMaterialAllowanceVnd: items.reduce((s, i) => s + i.materialAllowanceVnd, 0),
      totalShippingAllowanceVnd: items.reduce((s, i) => s + i.shippingAllowanceVnd, 0),
      totalBonusVnd: totalBonus,
      totalPenaltyVnd: totalPenalty,
      totalNetPayableVnd: totalNetPayable,
      settlementStatus: periodStatus,
      items,
    }

    const csv = generateSettlementCsv(periodData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Bang-ke-doi-soat-${partnerId}-2026-W39.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleConfirmSettlement = () => {
    setItems((prev) => prev.map((item) => ({ ...item, status: "DA_DOI_SOAT" })))
    setPeriodStatus("DA_DOI_SOAT")
  }

  const handleMarkAsPaid = () => {
    setItems((prev) => prev.map((item) => ({ ...item, status: "DA_THANH_TOAN" })))
    setPeriodStatus("DA_THANH_TOAN")
  }

  const getStatusBadge = (status: SettlementStatus) => {
    switch (status) {
      case "DA_THANH_TOAN":
        return <Badge tone="success">Đã thanh toán</Badge>
      case "DA_DOI_SOAT":
        return <Badge tone="accent">Đã đối soát</Badge>
      case "TRANH_CHAP":
        return <Badge tone="danger">Tranh chấp</Badge>
      case "CHO_DOI_SOAT":
      default:
        return <Badge tone="warning">Chờ đối soát</Badge>
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center justify-between gap-3 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-primary font-semibold">Sổ cái đối soát tài chính đối tác</span>
            <span className="text-muted text-body-sm">({partnerName})</span>
          </div>
          <div>{getStatusBadge(periodStatus)}</div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={handleExportCsv}>
            Xuất bảng kê CSV (Excel)
          </Button>
          <div className="flex items-center gap-2">
            {periodStatus !== "DA_THANH_TOAN" && (
              <Button
                variant="primary"
                onClick={periodStatus === "CHO_DOI_SOAT" ? handleConfirmSettlement : handleMarkAsPaid}
              >
                {periodStatus === "CHO_DOI_SOAT" ? "Chốt đối soát kỳ này" : "Xác nhận đã chi tiền công"}
              </Button>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {/* KPI Thống kê tài chính kỳ này */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border bg-surface">
            <div className="text-caption text-muted">Số đơn hoàn tất</div>
            <div className="text-title font-bold text-text mt-0.5">{totalOrders} đơn</div>
            <div className="text-caption text-muted mt-1">Tổng giá trị: {totalOrderPrice.toLocaleString("vi-VN")} đ</div>
          </div>
          <div className="p-3 rounded-lg border border-border bg-surface">
            <div className="text-caption text-muted">Tiền công cắm hoa</div>
            <div className="text-title font-bold text-primary mt-0.5">{totalCraftFee.toLocaleString("vi-VN")} đ</div>
            <div className="text-caption text-muted mt-1">Phụ cấp: +{totalAllowance.toLocaleString("vi-VN")} đ</div>
          </div>
          <div className="p-3 rounded-lg border border-border bg-surface">
            <div className="text-caption text-muted">Thưởng / Phạt SLA</div>
            <div className="text-title font-bold text-text mt-0.5">
              +{totalBonus.toLocaleString("vi-VN")} / -{totalPenalty.toLocaleString("vi-VN")} đ
            </div>
            <div className="text-caption text-muted mt-1">Chênh lệch: +{(totalBonus - totalPenalty).toLocaleString("vi-VN")} đ</div>
          </div>
          <div className="p-3 rounded-lg border border-border bg-surface">
            <div className="text-caption text-muted">Thực thanh toán (Net)</div>
            <div className="text-title font-bold text-text mt-0.5">{totalNetPayable.toLocaleString("vi-VN")} đ</div>
            <div className="text-caption text-success font-medium mt-1">Lãi gộp mạng: {marginSummary.grossMarginPercent}%</div>
          </div>
        </div>

        {/* Danh sách bảng kê chi tiết */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-caption text-muted font-medium">
                  <th className="p-2.5">Mã đơn</th>
                  <th className="p-2.5">Kiểu hoa</th>
                  <th className="p-2.5 text-right">Giá bán</th>
                  <th className="p-2.5 text-right">Tiền công</th>
                  <th className="p-2.5 text-right">Phụ cấp/Ship</th>
                  <th className="p-2.5 text-right">Thưởng/Phạt</th>
                  <th className="p-2.5 text-right font-bold">Thực nhận</th>
                  <th className="p-2.5 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-body-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface">
                    <td className="p-2.5 font-medium text-text">
                      <div>{item.orderCode}</div>
                      <div className="text-caption text-muted">{new Date(item.completedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="p-2.5 text-text">
                      <div>{item.arrangementType}</div>
                      {item.notes && <div className="text-caption text-muted truncate max-w-xs">{item.notes}</div>}
                    </td>
                    <td className="p-2.5 text-right text-muted">{item.orderPriceVnd.toLocaleString("vi-VN")} đ</td>
                    <td className="p-2.5 text-right text-text font-medium">{item.craftFeeVnd.toLocaleString("vi-VN")} đ</td>
                    <td className="p-2.5 text-right text-muted">
                      {(item.materialAllowanceVnd + item.shippingAllowanceVnd).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="p-2.5 text-right text-caption">
                      {item.bonusVnd > 0 && <span className="text-success font-medium">+{item.bonusVnd.toLocaleString("vi-VN")} </span>}
                      {item.penaltyVnd > 0 && <span className="text-danger font-medium">-{item.penaltyVnd.toLocaleString("vi-VN")}</span>}
                      {item.bonusVnd === 0 && item.penaltyVnd === 0 && <span className="text-muted">0 đ</span>}
                    </td>
                    <td className="p-2.5 text-right font-bold text-primary">{item.netPayableVnd.toLocaleString("vi-VN")} đ</td>
                    <td className="p-2.5 text-center">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
