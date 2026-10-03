"use client"

import React from "react"
import { Sparkles, SlidersHorizontal, Zap, ArrowRight } from "lucide-react"

export type CatalogExecutionMode = "autonomous" | "guided"

interface CatalogJourneyEntryProps {
  onSelectMode: (mode: CatalogExecutionMode) => void
}

export function CatalogJourneyEntry({ onSelectMode }: CatalogJourneyEntryProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 max-w-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-muted text-primary text-caption font-bold uppercase tracking-wider mb-2">
          <Zap className="h-3.5 w-3.5" />
          <span>Tạo Catalog Số trực tuyến</span>
        </div>
        <h2 className="text-display font-extrabold text-text">
          Bạn muốn FloraOS thực hiện như thế nào?
        </h2>
        <p className="text-body-sm text-text-muted leading-relaxed">
          Tạo catalog hoa online để khách xem và đặt hàng dễ dàng.
          AI tự chọn sản phẩm và tạo layout — hoặc bạn tự tùy chỉnh từng bước.
        </p>
      </div>

      {/* 2 Mode Cards — cân bằng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {/* Card ⚡ Autonomous */}
        <button
          type="button"
          onClick={() => onSelectMode("autonomous")}
          className="group flex flex-col gap-4 p-6 rounded-2xl border-2 border-primary bg-primary-muted/10 text-left transition-all hover:bg-primary-muted/25 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-surface shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="space-y-1.5">
            <div className="text-title font-extrabold text-text">⚡ AI làm cho tôi</div>
            <p className="text-body-sm text-text-muted leading-relaxed">
              Gõ một dòng ghi chú — ví dụ "hoa 20/10 dưới 1 triệu".
              AI tự lọc, nhóm sản phẩm, chọn phong cách và tạo catalog hoàn chỉnh.
            </p>
          </div>

          <div className="border-t border-primary-border pt-3 space-y-1">
            <div className="text-caption font-semibold text-primary flex items-center gap-1.5">
              <span>✓</span>
              <span>Xong trong vài chục giây</span>
            </div>
            <div className="text-caption font-semibold text-primary flex items-center gap-1.5">
              <span>✓</span>
              <span>Bạn kiểm tra và chỉnh trước khi chia sẻ</span>
            </div>
          </div>

          <div className="w-full py-2.5 rounded-lg bg-primary text-surface text-body-sm font-semibold text-center group-hover:bg-primary-dark transition-colors">
            Chọn chế độ này
          </div>
        </button>

        {/* Card 🛠️ Guided */}
        <button
          type="button"
          onClick={() => onSelectMode("guided")}
          className="group flex flex-col gap-4 p-6 rounded-2xl border-2 border-border bg-surface text-left transition-all hover:border-border-hover hover:bg-surface-alt/60 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-xl bg-surface-alt flex items-center justify-center text-text shrink-0">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="space-y-1.5">
            <div className="text-title font-extrabold text-text">🛠️ Tôi muốn tự chọn từng bước</div>
            <p className="text-body-sm text-text-muted leading-relaxed">
              Tự chọn sản phẩm từ kho, lọc theo dịp và giá, tự chọn phong cách
              layout và viết lời giới thiệu theo ý muốn.
            </p>
          </div>

          <div className="border-t border-border pt-3 space-y-1">
            <div className="text-caption font-semibold text-text-muted flex items-center gap-1.5">
              <span>✓</span>
              <span>Kiểm soát hoàn toàn danh sách sản phẩm</span>
            </div>
            <div className="text-caption font-semibold text-text-muted flex items-center gap-1.5">
              <span>✓</span>
              <span>Phù hợp cho catalog có cấu trúc đặc biệt</span>
            </div>
          </div>

          <div className="w-full py-2.5 rounded-lg border border-border bg-surface text-text text-body-sm font-semibold text-center group-hover:bg-surface-alt transition-colors">
            Chọn chế độ này
          </div>
        </button>
      </div>

      <p className="text-caption text-text-muted text-center">
        Bạn có thể đổi chế độ bất kỳ lúc nào trong quá trình thiết lập.
      </p>
    </div>
  )
}
