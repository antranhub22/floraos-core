"use client"

import React, { useState } from "react"
import { RefreshCw, Search, Sparkles, ShieldCheck, Flower2, Truck, CheckCircle2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApi } from "@/components/greeting-card/greeting-api"
import { TrackingOrderCard } from "./tracking-order-card"
import { TrackingInternalChatDrawer } from "./tracking-internal-chat-drawer"
import { TrackingReport } from "./tracking-report"
import type {
  TrackingPipelineItem,
  TrackingPipelineStepId,
} from "@/modules/greeting-card/domain/tracking-pipeline-types"

type FilterCategory = "ALL" | "BROWSING" | "PAYMENT_WAITING" | "ARRANGING" | "DELIVERING" | "COMPLETED"

export function BrochureOrderTrackingTab() {
  // SWR, tự làm mới mỗi 30 giây — bảng theo dõi nhiều người cùng xem
  const pipeline = useApi<{ data: TrackingPipelineItem[] }>("/api/v1/greeting-card/tracking-pipeline", {
    refreshInterval: 30_000,
  })
  const items = pipeline.data?.data ?? []
  const loading = pipeline.isLoading || pipeline.isValidating
  const loadPipeline = () => pipeline.mutate()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("ALL")
  const [selectedNoteItem, setSelectedNoteItem] = useState<{
    item: TrackingPipelineItem
    stepId?: TrackingPipelineStepId | "GENERAL" | undefined
  } | null>(null)

  // Filter items based on category and search query
  const filteredItems = items.filter((item) => {
    // 1. Category filter
    if (categoryFilter === "BROWSING") {
      if (
        item.currentStepId !== "STEP_1_OPENED" &&
        item.currentStepId !== "STEP_2_CHOOSING" &&
        item.currentStepId !== "STEP_3_FILLING_FORM"
      ) {
        return false
      }
    } else if (categoryFilter === "PAYMENT_WAITING") {
      if (item.currentStepId !== "STEP_4_PAYMENT_PENDING") return false
    } else if (categoryFilter === "ARRANGING") {
      if (
        item.currentStepId !== "STEP_5_PAYMENT_CONFIRMED" &&
        item.currentStepId !== "STEP_6_ARRANGING" &&
        item.currentStepId !== "STEP_7_READY_QC"
      ) {
        return false
      }
    } else if (categoryFilter === "DELIVERING") {
      if (item.currentStepId !== "STEP_8_DELIVERING") return false
    } else if (categoryFilter === "COMPLETED") {
      if (item.currentStepId !== "STEP_9_COMPLETED") return false
    }

    // 2. Search query filter
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      (item.orderCode && item.orderCode.toLowerCase().includes(q)) ||
      (item.sendCode && item.sendCode.toLowerCase().includes(q)) ||
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      (item.customerPhone && item.customerPhone.includes(q)) ||
      (item.productName && item.productName.toLowerCase().includes(q))
    )
  })

  // Counters
  const countBrowsing = items.filter(
    (i) =>
      i.currentStepId === "STEP_1_OPENED" ||
      i.currentStepId === "STEP_2_CHOOSING" ||
      i.currentStepId === "STEP_3_FILLING_FORM"
  ).length
  const countPayment = items.filter((i) => i.currentStepId === "STEP_4_PAYMENT_PENDING").length
  const countArranging = items.filter(
    (i) =>
      i.currentStepId === "STEP_5_PAYMENT_CONFIRMED" ||
      i.currentStepId === "STEP_6_ARRANGING" ||
      i.currentStepId === "STEP_7_READY_QC"
  ).length
  const countDelivering = items.filter((i) => i.currentStepId === "STEP_8_DELIVERING").length
  const countCompleted = items.filter((i) => i.currentStepId === "STEP_9_COMPLETED").length

  return (
    <div className="flex flex-col gap-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-title font-extrabold text-foreground flex items-center gap-2">
            <span>Theo Dõi Tiến Độ Toàn Bộ Đơn</span>
            <span className="text-caption px-2.5 py-0.5 rounded-full bg-selected text-primary font-bold">
              Liên vai trò (Admin • Sale • Điều phối)
            </span>
          </h2>
          <p className="text-body-sm text-text-muted mt-1">
            Hiển thị chu trình 9 bước từ lúc khách mở link đến khi giao tận tay, kèm tính năng ghi chú nội bộ theo bước
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadPipeline}
            className="gap-1.5 text-caption h-9"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* KPI Counters & Fast Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter("ALL")}
          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-colors ${
            categoryFilter === "ALL"
              ? "bg-selected text-primary border-primary shadow-xs"
              : "bg-surface border-border text-text-muted hover:text-foreground"
          }`}
        >
          <span className="text-body font-extrabold">{items.length}</span>
          <span className="text-caption font-bold mt-0.5">Tất cả đơn</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("BROWSING")}
          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-colors ${
            categoryFilter === "BROWSING"
              ? "bg-selected text-primary border-primary shadow-xs"
              : "bg-surface border-border text-text-muted hover:text-foreground"
          }`}
        >
          <span className="text-body font-extrabold flex items-center gap-1">
            <Eye size={14} />
            <span>{countBrowsing}</span>
          </span>
          <span className="text-caption font-bold mt-0.5">Khách đang xem</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("PAYMENT_WAITING")}
          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-colors ${
            categoryFilter === "PAYMENT_WAITING"
              ? "bg-warning-bg text-warning border-warning shadow-xs"
              : "bg-surface border-border text-text-muted hover:text-foreground"
          }`}
        >
          <span className="text-body font-extrabold flex items-center gap-1">
            <ShieldCheck size={14} />
            <span>{countPayment}</span>
          </span>
          <span className="text-caption font-bold mt-0.5">Chờ duyệt tiền</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("ARRANGING")}
          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-colors ${
            categoryFilter === "ARRANGING"
              ? "bg-selected text-primary border-primary shadow-xs"
              : "bg-surface border-border text-text-muted hover:text-foreground"
          }`}
        >
          <span className="text-body font-extrabold flex items-center gap-1">
            <Flower2 size={14} />
            <span>{countArranging}</span>
          </span>
          <span className="text-caption font-bold mt-0.5">Đang cắm hoa</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("DELIVERING")}
          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-colors ${
            categoryFilter === "DELIVERING"
              ? "bg-info-bg text-info border-info shadow-xs"
              : "bg-surface border-border text-text-muted hover:text-foreground"
          }`}
        >
          <span className="text-body font-extrabold flex items-center gap-1">
            <Truck size={14} />
            <span>{countDelivering}</span>
          </span>
          <span className="text-caption font-bold mt-0.5">Đang giao</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("COMPLETED")}
          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-colors ${
            categoryFilter === "COMPLETED"
              ? "bg-success-bg text-success border-success shadow-xs"
              : "bg-surface border-border text-text-muted hover:text-foreground"
          }`}
        >
          <span className="text-body font-extrabold flex items-center gap-1">
            <CheckCircle2 size={14} />
            <span>{countCompleted}</span>
          </span>
          <span className="text-caption font-bold mt-0.5">Đã hoàn thành</span>
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm theo mã đơn, mã link, tên khách, số điện thoại hoặc tên mẫu hoa..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-surface text-body-sm text-foreground placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-primary shadow-xs"
        />
      </div>

      <TrackingReport />

      {/* Main List of Cards */}
      {filteredItems.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center text-text-muted flex flex-col items-center">
          <Sparkles size={36} className="text-primary/40 mb-2" />
          <p className="text-body font-bold text-foreground">Không có đơn hàng nào khớp bộ lọc</p>
          <p className="text-caption text-text-muted mt-1">
            Khi khách tương tác với Thẻ chào hoặc đơn hàng mới phát sinh, dữ liệu sẽ tự động xuất hiện.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <TrackingOrderCard
              key={item.id}
              item={item}
              onOpenNotes={(itm, stepId) => setSelectedNoteItem({ item: itm, stepId: stepId ?? "GENERAL" })}
            />
          ))}
        </div>
      )}

      {/* Internal Chat Drawer */}
      {selectedNoteItem && (
        <TrackingInternalChatDrawer
          item={selectedNoteItem.item}
          initialStepId={selectedNoteItem.stepId}
          onClose={() => setSelectedNoteItem(null)}
          onNoteAdded={() => {
            void loadPipeline()
          }}
        />
      )}
    </div>
  )
}
