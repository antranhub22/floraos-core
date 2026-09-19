// TemplatePreviewModal — 18/09, hạ tầng cho yêu cầu "bấm vào template phải
// hiện popup mẫu thật của template đó" (anh Tony phát hiện trang Kho
// Templates trước đó chỉ mô tả bằng chữ, chưa render trực quan). Modal này
// KHÔNG dùng thư viện Dialog nào — theo đúng quy ước hiện có của dự án
// (`connect-account-modal.tsx`, `schedule-confirm-modal.tsx` đều tự dựng
// `fixed inset-0 z-50` + backdrop, không có primitive Dialog dùng chung
// trong `components/ui/`), giữ nhất quán thay vì thêm một cách làm modal
// mới.

"use client"

import React from "react"
import { X, Info } from "lucide-react"

export interface TemplatePreviewModalProps {
  open: boolean
  onClose: () => void
  fileName: string
  fileType: string
  purpose: string
  wide?: boolean
  children: React.ReactNode
}

export function TemplatePreviewModal({
  open,
  onClose,
  fileName,
  fileType,
  purpose,
  wide = false,
  children,
}: TemplatePreviewModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <code className="truncate text-[12.5px] font-bold text-text">{fileName}</code>
              <span className="shrink-0 rounded-full bg-surface-alt px-2 py-0.5 text-[9.5px] font-bold tracking-wide text-text-muted uppercase">
                {fileType}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-text-muted">{purpose}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-alt hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-surface-alt/40 p-5">
          <div className="mx-auto flex max-w-md flex-col gap-3 sm:max-w-none">{children}</div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 border-t border-border px-5 py-2.5 text-[10.5px] text-text-muted">
          <Info size={12} className="shrink-0" />
          Dữ liệu minh hoạ để xem giao diện — không phải dữ liệu thật trong hệ thống.
        </div>
      </div>
    </div>
  )
}
