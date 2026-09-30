"use client"

import React, { useState } from "react"
import {
  X,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Download,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  SAMPLE_FLOWER_AD_CAMPAIGNS,
  generateAdPerformanceSummary,
  computeCampaignMetrics,
  exportAdPerformanceCSV,
  type AdChannel,
} from "@/modules/content-engine/domain/ad-performance-analytics"

interface AdPerformanceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdPerformanceModal({ isOpen, onClose }: AdPerformanceModalProps) {
  const [selectedChannel, setSelectedChannel] = useState<AdChannel | "ALL">("ALL")
  const summary = generateAdPerformanceSummary(SAMPLE_FLOWER_AD_CAMPAIGNS)
  const allCampaigns = computeCampaignMetrics(SAMPLE_FLOWER_AD_CAMPAIGNS)

  if (!isOpen) return null

  const filteredCampaigns =
    selectedChannel === "ALL"
      ? allCampaigns
      : allCampaigns.filter((c) => c.channel === selectedChannel)

  function handleDownloadCSV() {
    const csvContent = exportAdPerformanceCSV(filteredCampaigns)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Bao_cao_hieu_qua_quang_cao_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-title-sm font-bold text-text">
                Báo Cáo Hiệu Quả Quảng Cáo Đa Kênh (MK-10)
              </h3>
              <p className="text-caption text-text-muted">
                Theo dõi ROAS, CPA, tỷ lệ chuyển đổi đơn hàng từ Facebook, TikTok, Google & Zalo Ads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 text-caption font-semibold"
            >
              <Download className="h-3.5 w-3.5" /> Xuất CSV UTF-8
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="rounded-lg p-1.5 text-text-muted hover:bg-muted hover:text-text transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="rounded-xl border border-border bg-background p-3.5 space-y-1">
              <div className="text-caption font-medium text-text-muted flex items-center justify-between">
                <span>Tổng chi phí Ads</span>
                <DollarSign className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="text-title-sm font-extrabold text-text">
                {summary.totalSpendVnd.toLocaleString("vi-VN")} đ
              </div>
              <div className="text-caption text-text-muted">Đã đầu tư đa kênh</div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3.5 space-y-1">
              <div className="text-caption font-medium text-text-muted flex items-center justify-between">
                <span>Doanh thu quy đổi</span>
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              </div>
              <div className="text-title-sm font-extrabold text-success">
                {summary.totalRevenueVnd.toLocaleString("vi-VN")} đ
              </div>
              <div className="text-caption text-success font-medium">
                Lợi nhuận: +{summary.totalProfitVnd.toLocaleString("vi-VN")} đ
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3.5 space-y-1">
              <div className="text-caption font-medium text-text-muted flex items-center justify-between">
                <span>ROAS Toàn Mạng</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="text-title font-extrabold text-primary">
                {summary.overallRoas}x
              </div>
              <div className="text-caption text-text-muted">1đ vốn thu {summary.overallRoas}đ</div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3.5 space-y-1">
              <div className="text-caption font-medium text-text-muted flex items-center justify-between">
                <span>Chi phí / Đơn (CPA)</span>
                <ShoppingCart className="h-3.5 w-3.5 text-text-muted" />
              </div>
              <div className="text-title-sm font-extrabold text-text">
                {summary.overallCpa.toLocaleString("vi-VN")} đ
              </div>
              <div className="text-caption text-text-muted">{summary.totalOrders} đơn chốt từ Ads</div>
            </div>
          </div>

          {/* AI Khuyến nghị tối ưu ngân sách */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-body-sm font-bold text-text">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Đề xuất Phân bổ Ngân sách Thông minh (FloraOS AI Insights)</span>
            </div>
            <ul className="space-y-1.5 pl-5 list-disc text-caption text-text">
              {summary.aiRecommendations.map((rec, i) => (
                <li key={i} className="leading-relaxed">{rec}</li>
              ))}
            </ul>
          </div>

          {/* So sánh đa kênh */}
          <div className="space-y-2">
            <h4 className="text-body-sm font-bold text-text">Hiệu Quả Theo Từng Kênh Quảng Cáo</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {summary.channelAggregates.map((ch) => (
                <button
                  type="button"
                  key={ch.channel}
                  onClick={() => setSelectedChannel(ch.channel)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedChannel === ch.channel
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="font-bold text-body-sm text-text">{ch.channelName}</div>
                  <div className="text-caption text-text-muted mt-1">
                    Chi phí: <span className="font-semibold text-text">{ch.totalSpendVnd.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="text-caption text-text-muted">
                    Doanh thu: <span className="font-semibold text-success">{ch.totalRevenueVnd.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-caption">
                    <span className="text-text-muted">ROAS:</span>
                    <span className="font-extrabold text-primary">{ch.avgRoas}x</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bảng chi tiết chiến dịch */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-body-sm font-bold text-text">
                Chi Tiết Chiến Dịch ({filteredCampaigns.length})
              </h4>
              {selectedChannel !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedChannel("ALL")}
                  className="text-caption font-semibold text-primary hover:underline"
                >
                  Xem tất cả kênh →
                </button>
              )}
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-background">
              <table className="w-full text-left border-collapse text-caption">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-text-muted font-medium">
                    <th className="p-3">Chiến dịch</th>
                    <th className="p-3 text-right">Chi phí</th>
                    <th className="p-3 text-right">Clicks / CTR</th>
                    <th className="p-3 text-right">Đơn hàng</th>
                    <th className="p-3 text-right">Doanh thu</th>
                    <th className="p-3 text-right">ROAS</th>
                    <th className="p-3 text-center">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-text">{c.campaignName}</div>
                        <div className="text-text-muted font-mono">{c.id}</div>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {c.spendVnd.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="p-3 text-right">
                        <div>{c.clicks.toLocaleString("vi-VN")}</div>
                        <div className="text-text-muted font-mono">{c.ctr}%</div>
                      </td>
                      <td className="p-3 text-right font-bold">
                        {c.conversions}
                      </td>
                      <td className="p-3 text-right font-bold text-success">
                        {c.revenueVnd.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="p-3 text-right font-extrabold text-primary">
                        {c.roas}x
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          tone={
                            c.rating === "EXCELLENT" || c.rating === "GOOD"
                              ? "success"
                              : c.rating === "AVERAGE"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {c.rating === "EXCELLENT"
                            ? "Xuất sắc"
                            : c.rating === "GOOD"
                            ? "Tốt"
                            : c.rating === "AVERAGE"
                            ? "Hòa vốn"
                            : "Cần tối ưu"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3.5 bg-muted/20 flex items-center justify-end">
          <Button type="button" variant="primary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
