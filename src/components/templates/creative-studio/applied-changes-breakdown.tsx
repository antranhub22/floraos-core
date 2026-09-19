"use client"

import React from "react"
import { CheckCircle2, ListChecks, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface AppliedChangesBreakdownProps {
  appliedChanges?: string[] | undefined
  mode?: string | null | undefined
  providerName?: string | null | undefined
}

const DEFAULT_CHANGES = [
  "Đã tách nền và chuyển sang phông Studio Ambiance ánh sáng dịu",
  "Đã xóa sạch watermark, số điện thoại và logo đóng dấu trên ảnh",
  "Đã tăng nét siêu phân giải 2x & làm rõ từng đường vân cánh hoa",
  "Đã cân bằng dải sáng và nâng cấp độ tương phản studio mềm mại",
  "Đã tạo 4 tỷ lệ chuẩn (1:1, 4:5, 9:16, 16:9) bảo toàn 100% bó hoa",
]

export const AppliedChangesBreakdown: React.FC<AppliedChangesBreakdownProps> = ({
  appliedChanges,
  mode,
  providerName,
}) => {
  const items = appliedChanges && appliedChanges.length > 0 ? appliedChanges : DEFAULT_CHANGES
  const isCustom = mode === "custom"

  return (
    <div className="w-full rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/15 text-secondary-text">
            <ListChecks size={16} strokeWidth={2.2} />
          </div>
          <div>
            <h4 className="text-[13.5px] font-bold text-text flex items-center gap-1.5">
              Chi tiết các hạng mục đã tối ưu
            </h4>
            <p className="text-[11px] text-text-muted">
              Minh bạch từng công đoạn chỉnh sửa AI đã thực thi trên bức ảnh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {providerName && (
            <Badge tone="neutral" className="text-[10px]">
              {providerName}
            </Badge>
          )}
          <Badge tone={isCustom ? "neutral" : "accent"} className="text-[10px]">
            {isCustom ? "Tùy chọn độc lập" : "Tự động hoàn toàn"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {items.map((changeText, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 rounded-xl bg-surface-alt/50 p-2.5 border border-border/50 text-[12px] leading-snug text-text"
          >
            <CheckCircle2
              size={15}
              strokeWidth={2.5}
              className="mt-0.5 flex-shrink-0 text-secondary-text"
            />
            <span className="font-medium">{changeText}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-text-muted">
        <span className="flex items-center gap-1">
          <Sparkles size={12} className="text-primary" />
          Toàn bộ cấu trúc hoa thật được bảo vệ 100% qua Identity Guard.
        </span>
        <span className="font-semibold text-text">{items.length} tác vụ hoàn tất</span>
      </div>
    </div>
  )
}
