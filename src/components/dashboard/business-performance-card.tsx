"use client"

import React, { useState } from "react"
import {
  TrendingUp,
  Download,
  Printer,
  ShoppingBag,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Award,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  computeBusinessReport,
  generateReportCsvContent,
  type OrderReportingItem,
} from "@/modules/orders/domain/business-reporting"

export interface BusinessPerformanceCardProps {
  orders: OrderReportingItem[]
  aiCreditUsed?: number | undefined
  shopName: string
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
}

export function BusinessPerformanceCard({
  orders,
  aiCreditUsed = 0,
  shopName,
}: BusinessPerformanceCardProps) {
  const [downloading, setDownloading] = useState(false)

  const report = computeBusinessReport(orders, aiCreditUsed)

  function handleExportCsv() {
    setDownloading(true)
    try {
      const csvContent = generateReportCsvContent(report, shopName)
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bao-cao-kinh-doanh_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <Card className="p-5 space-y-5 border-border bg-surface shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <h2 className="text-title-sm font-extrabold text-text">
              Hiệu Năng Kinh Doanh &amp; Doanh Số Cửa Hàng
            </h2>
            <p className="text-caption text-text-muted">
              Tổng hợp thời gian thực từ đơn hàng thực tế và chi phí vận hành
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 text-caption gap-1.5"
          >
            <Printer size={13} />
            In nhanh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={downloading}
            className="h-8 text-caption gap-1.5 font-semibold text-primary border-primary/40 hover:bg-primary/5"
          >
            <Download size={13} />
            {downloading ? "Đang xuất..." : "Xuất CSV"}
          </Button>
        </div>
      </div>

      {/* 4 Chỉ số KPI cốt lõi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-border bg-surface-alt">
          <div className="flex items-center gap-1.5 text-caption text-text-muted">
            <DollarSign size={13} className="text-success shrink-0" />
            <span>Tổng Doanh Thu</span>
          </div>
          <div className="text-body-sm sm:text-title-sm font-black text-text mt-1 truncate">
            {formatVnd(report.totalRevenueVnd)}
          </div>
          <div className="text-caption text-text-muted mt-0.5">
            AOV: {formatVnd(report.averageOrderValueVnd)}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border bg-surface-alt">
          <div className="flex items-center gap-1.5 text-caption text-text-muted">
            <CheckCircle2 size={13} className="text-primary shrink-0" />
            <span>Tỷ Lệ Hoàn Tất</span>
          </div>
          <div className="text-body-sm sm:text-title-sm font-black text-primary mt-1">
            {report.fulfillmentRatePercent}%
          </div>
          <div className="text-caption text-text-muted mt-0.5">
            {report.completedOrders} xong · {report.cancelledOrders} huỷ
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border bg-surface-alt">
          <div className="flex items-center gap-1.5 text-caption text-text-muted">
            <ShoppingBag size={13} className="text-info shrink-0" />
            <span>Đơn Đang Xử Lý</span>
          </div>
          <div className="text-body-sm sm:text-title-sm font-black text-text mt-1">
            {report.totalOrders - report.completedOrders - report.cancelledOrders}
          </div>
          <div className="text-caption text-text-muted mt-0.5">
            {report.draftOrders} đơn nháp chờ chốt
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border bg-surface-alt">
          <div className="flex items-center gap-1.5 text-caption text-text-muted">
            <Sparkles size={13} className="text-warning shrink-0" />
            <span>Credit AI Tiêu Thụ</span>
          </div>
          <div className="text-body-sm sm:text-title-sm font-black text-text mt-1">
            {report.aiCreditUsed}
          </div>
          <div className="text-caption text-text-muted mt-0.5">
            Sinh ảnh, video &amp; trợ lý
          </div>
        </div>
      </div>

      {/* Top sản phẩm bán chạy nhất */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-body-sm font-bold text-text">
            <Award size={15} className="text-primary" />
            <span>Top Mẫu Hoa &amp; Sản Phẩm Doanh Thu Cao</span>
          </div>
          <span className="text-caption text-text-muted">Top 5 nổi bật</span>
        </div>

        {report.topSellingItems.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border text-center text-caption text-text-muted">
            Chưa có đủ dữ liệu đơn hàng để xếp hạng mẫu hoa bán chạy
          </div>
        ) : (
          <div className="space-y-2">
            {report.topSellingItems.map((item, idx) => (
              <div
                key={item.title}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-surface-raised transition hover:border-primary/40"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-caption font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-body-sm font-bold text-text truncate max-w-xs sm:max-w-md">
                      {item.title}
                    </div>
                    <div className="text-caption text-text-muted">
                      {item.orderCount} lượt đặt hàng
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-caption sm:text-body-sm text-text">
                    {formatVnd(item.totalRevenueVnd)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
