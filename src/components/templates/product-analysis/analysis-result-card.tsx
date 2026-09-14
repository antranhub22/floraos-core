"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { ResultCard, type ResultField, type ResultFieldItem, type JudgmentState } from "@/components/result/result-card"

export interface AnalysisResultCardProps {
  fields: ResultField[]
  imageUrl?: string
  judgment?: JudgmentState
  confidence?: number | null
  qualityLabel?: string
  isSaved?: boolean
  disabled?: boolean
  stepNumber?: string
  headerTitle?: string
  onSaveDraft?: () => void
  onReject?: () => void
  onApprove?: () => void
  onFieldChange?: (key: string, value: string | number | string[]) => void
  onFieldAdd?: (key: string, item: ResultFieldItem) => void
  onFieldRemove?: (key: string, itemId: string) => void
  onItemChange?: (key: string, itemId: string, item: ResultFieldItem) => void
}

/**
 * AnalysisResultCard (Thẻ kết quả phân tích cấu phần hoa M01a)
 *
 * Chuẩn hóa template hiển thị kết quả phân tích thị giác AI cho mẫu hoa:
 * - Định lượng cành & chủng loại hoa nguyên tử
 * - Màu sắc chủ đạo & phong cách bó/cắm
 * - Điểm tin cậy thị giác (AI Confidence)
 * - Tác vụ duyệt/từ chối/lưu nháp phân định rõ ràng
 */
export function AnalysisResultCard({
  fields,
  imageUrl,
  judgment = "safe",
  confidence = 94,
  qualityLabel = "Độ tin cậy cao — mọi cấu phần đạt ngưỡng",
  isSaved = false,
  disabled = false,
  stepNumber = "④ Thẻ kết quả 1",
  headerTitle = "Đặc điểm nhận diện",
  onSaveDraft,
  onReject,
  onApprove,
  onFieldChange,
  onFieldAdd,
  onFieldRemove,
  onItemChange,
}: AnalysisResultCardProps) {
  const images = imageUrl ? [{ src: imageUrl, alt: "Ảnh sản phẩm nhận diện" }] : []

  return (
    <div className="w-full max-w-3xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">{stepNumber}</div>
          <div className="text-[17px] font-extrabold text-text">{headerTitle}</div>
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
        quality={{
          score: typeof confidence === "number" ? confidence : 94,
          label: qualityLabel,
          status: judgment,
        }}
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
          Đã lưu nháp — quay lại trang này để tiếp tục chỉnh sửa.
        </div>
      )}
    </div>
  )
}
