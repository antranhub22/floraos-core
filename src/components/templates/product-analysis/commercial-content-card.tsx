"use client"

import React from "react"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResultCard, type ResultField, type ResultFieldItem, type JudgmentState } from "@/components/result/result-card"

export interface CommercialContentCardProps {
  fields: ResultField[]
  imageUrl?: string
  judgment?: JudgmentState
  qualityScore?: number
  qualityLabel?: string
  isSaved?: boolean
  disabled?: boolean
  onBackToLibrary?: () => void
  onSaveDraft?: () => void
  onReject?: () => void
  onApprove?: () => void
  onFieldChange?: (key: string, value: string | number | string[]) => void
  onFieldAdd?: (key: string, item: ResultFieldItem) => void
  onFieldRemove?: (key: string, itemId: string) => void
  onItemChange?: (key: string, itemId: string, item: ResultFieldItem) => void
}

/**
 * CommercialContentCard (Thẻ nội dung bán hàng M01b)
 *
 * Chuẩn hóa template hiển thị và tinh chỉnh dữ liệu thương mại AI sinh ra:
 * - Tên thương mại gợi ý
 * - Câu chuyện sản phẩm & mô tả cảm xúc
 * - Dịp tặng hoa phù hợp (sinh nhật, khai trương, kỷ niệm...)
 * - Phân khúc giá & thẻ tìm kiếm SEO
 * - Tác vụ đẩy vào Product Master chính thức
 */
export function CommercialContentCard({
  fields,
  imageUrl,
  judgment = "safe",
  qualityScore = 89,
  qualityLabel = "Nội dung phù hợp giọng thương hiệu",
  isSaved = false,
  disabled = false,
  onBackToLibrary,
  onSaveDraft,
  onReject,
  onApprove,
  onFieldChange,
  onFieldAdd,
  onFieldRemove,
  onItemChange,
}: CommercialContentCardProps) {
  const images = imageUrl ? [{ src: imageUrl, alt: "Ảnh sản phẩm" }] : []

  return (
    <div className="w-full max-w-3xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToLibrary && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToLibrary}
              className="flex items-center gap-1.5 text-text-muted hover:text-text"
            >
              <ArrowLeft size={14} />
              Kho đã duyệt
            </Button>
          )}
          <div>
            <div className="text-xs text-text-muted">M01b — Dữ liệu bán hàng</div>
            <div className="text-[17px] font-extrabold text-text">Nội dung bán hàng</div>
          </div>
        </div>
        <Badge
          tone={
            isSaved
              ? "success"
              : judgment === "blocked"
              ? "danger"
              : judgment === "warning"
              ? "warning"
              : "neutral"
          }
        >
          {isSaved
            ? "Đã lưu nháp"
            : judgment === "blocked"
            ? "Bị chặn"
            : judgment === "warning"
            ? "Cảnh báo"
            : "An toàn"}
        </Badge>
      </div>

      <ResultCard
        images={images}
        fields={fields}
        judgment={judgment}
        quality={{ score: qualityScore, label: qualityLabel, status: judgment }}
        onSaveDraft={onSaveDraft}
        onReject={onReject}
        onApprove={onApprove}
        onFieldChange={onFieldChange}
        onFieldAdd={onFieldAdd}
        onFieldRemove={onFieldRemove}
        onItemChange={onItemChange}
        disabled={disabled}
      />

      {isSaved && (
        <div className="rounded-lg bg-success-bg px-4 py-2 text-[12.5px] font-medium text-secondary">
          Đã lưu nháp nội dung bán hàng.
        </div>
      )}
    </div>
  )
}
