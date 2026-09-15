"use client"

import React from "react"
import { AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface AutoApprovePanelProps {
  autoApprove: boolean
  onToggle: () => void
}

export function AutoApprovePanel({ autoApprove, onToggle }: AutoApprovePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[17px] font-extrabold text-text">Tự duyệt theo thời hạn</div>
        <div className="text-[12.5px] text-text-muted mt-0.5">
          Cơ chế tự động phê duyệt bài viết chờ đăng nếu không có can thiệp thủ công
        </div>
      </div>

      <Card className="p-5 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-bold text-text">Công tắc tự duyệt xuất bản</div>
            <div className="mt-1 text-[12px] text-text-muted">
              Tắt theo mặc định — chỉ ai có quyền Điều hành mới thấy và cấu hình được.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoApprove}
            onClick={onToggle}
            className={`relative h-7 w-12 rounded-full transition-colors cursor-pointer ${
              autoApprove ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-transform shadow-xs ${
                autoApprove ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      </Card>

      {autoApprove && (
        <div className="rounded-xl bg-warning-bg border border-warning/40 p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-warning" />
            <div className="text-[12.5px] leading-relaxed text-warning">
              Bài chờ quá 24 giờ sẽ tự đăng. Đổi giá, khuyến mại, hoặc thông tin có tính pháp lý/y tế
              không bao giờ tự đăng dù bật công tắc này (tuân thủ luật an toàn Aegis & SSOT).
            </div>
          </div>
        </div>
      )}
      <div className="text-[11.5px] text-text-muted italic">
        Mỗi lần bật/tắt công tắc đều được ghi vào nhật ký kiểm toán (Audit Log).
      </div>
    </div>
  )
}
