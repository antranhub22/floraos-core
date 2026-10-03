"use client"

import React from "react"
import { Sparkles, SlidersHorizontal, Zap, ArrowRight } from "lucide-react"

export type LandingExecutionMode = "autonomous" | "guided"

interface LandingJourneyEntryProps {
  onSelectMode: (mode: LandingExecutionMode) => void
}

export function LandingJourneyEntry({ onSelectMode }: LandingJourneyEntryProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 max-w-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-muted text-primary text-caption font-bold uppercase tracking-wider mb-2">
          <Zap className="h-3.5 w-3.5" />
          <span>Tạo Landing Page chiến dịch</span>
        </div>
        <h2 className="text-display font-extrabold text-text">
          Bạn muốn FloraOS thực hiện như thế nào?
        </h2>
        <p className="text-body-sm text-text-muted leading-relaxed">
          Đưa những gì bạn đang có — ảnh hoa, video, ghi chú — FloraOS sẽ lo phần còn lại.
          Hoặc bạn tự chọn từng bước theo ý muốn.
        </p>
      </div>

      {/* 2 Mode Cards — cân bằng, rõ ràng */}
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
              Bạn chỉ cần đưa ảnh hoa, link video hoặc ghi chú ngắn.
              FloraOS phân tích, tạo tiêu đề, chọn sản phẩm và xuất bản toàn bộ.
            </p>
          </div>

          <div className="border-t border-primary-border pt-3 space-y-1">
            <div className="text-caption font-semibold text-primary flex items-center gap-1.5">
              <span>✓</span>
              <span>Nhanh nhất — phù hợp khi cần ra ngay</span>
            </div>
            <div className="text-caption font-semibold text-primary flex items-center gap-1.5">
              <span>✓</span>
              <span>Bạn vẫn kiểm tra kết quả trước khi đăng</span>
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
              Bạn tự chọn dịp lễ, lọc sản phẩm, tự viết tiêu đề và cấu hình
              từng section theo ý thích cá nhân.
            </p>
          </div>

          <div className="border-t border-border pt-3 space-y-1">
            <div className="text-caption font-semibold text-text-muted flex items-center gap-1.5">
              <span>✓</span>
              <span>Kiểm soát hoàn toàn từng chi tiết</span>
            </div>
            <div className="text-caption font-semibold text-text-muted flex items-center gap-1.5">
              <span>✓</span>
              <span>Phù hợp cho chiến dịch có nội dung đặc biệt</span>
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
