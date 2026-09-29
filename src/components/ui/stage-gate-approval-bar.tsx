"use client"

import * as React from "react"
import { Check, CheckCircle2, ArrowRight, ShieldCheck, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface StageGateApprovalBarProps {
  /** Số thứ tự hoặc mã chặng, ví dụ: "03. DISCOVER", "07. PACKAGE" */
  stageCode: string
  /** Tiêu đề của cổng phê duyệt */
  title: string
  /** Mô tả ngắn kết quả cần user xác nhận */
  description: string
  /** Đã được phê duyệt chưa */
  isApproved: boolean
  /** Nhãn nút phê duyệt */
  approveLabel?: string
  /** Callback khi user bấm phê duyệt */
  onApprove: () => void
  /** Trạng thái đang xử lý (loading) */
  isLoading?: boolean
  /** Callback tùy chọn khi user muốn chỉnh sửa lại */
  onEdit?: () => void
  /** Thống kê nhanh kết quả (badges/metrics) */
  metrics?: Array<{ label: string; value: string | number }>
  className?: string
}

export function StageGateApprovalBar({
  stageCode,
  title,
  description,
  isApproved,
  approveLabel = "Phê duyệt kết quả & Tiếp tục",
  onApprove,
  isLoading = false,
  onEdit,
  metrics,
  className,
}: StageGateApprovalBarProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border transition-all p-4 sm:p-5 shadow-xs",
        isApproved
          ? "border-success/30 bg-gradient-to-r from-success-bg via-surface to-success-bg/40"
          : "border-primary/20 bg-gradient-to-r from-primary/5 via-surface to-primary/3",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-extrabold uppercase tracking-wider",
                isApproved
                  ? "bg-success/15 text-success border border-success/30"
                  : "bg-primary/10 text-primary border border-primary/20"
              )}
            >
              <ShieldCheck size={12} />
              {stageCode}
            </span>
            {isApproved ? (
              <span className="inline-flex items-center gap-1 text-caption font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                <CheckCircle2 size={13} className="text-success" />
                Đã được Chủ shop phê duyệt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-caption font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                Chờ Chủ shop xác nhận kết quả
              </span>
            )}
          </div>

          <h4 className="text-body sm:text-title-sm font-bold text-text">
            {title}
          </h4>
          <p className="text-meta text-text-muted leading-relaxed max-w-2xl">
            {description}
          </p>

          {metrics && metrics.length > 0 && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-alt text-text text-caption font-medium"
                >
                  <span className="text-text-muted">{m.label}:</span>
                  <span className="font-bold text-text">{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          {onEdit && isApproved && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="text-text-muted hover:text-text text-xs font-semibold gap-1"
            >
              <Edit3 size={13} />
              Chỉnh sửa lại
            </Button>
          )}

          {!isApproved ? (
            <Button
              type="button"
              onClick={onApprove}
              disabled={isLoading}
              className="bg-success hover:bg-success/90 text-white text-xs font-bold px-4 py-2 gap-1.5 shadow-sm transition-all"
            >
              <Check size={14} />
              {approveLabel}
              <ArrowRight size={14} />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onApprove}
              className="border-success/30 bg-surface text-success hover:bg-success/10 text-xs font-bold px-3 py-1.5 gap-1.5"
            >
              <CheckCircle2 size={14} className="text-success" />
              Đã duyệt (Tiếp tục)
              <ArrowRight size={13} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
