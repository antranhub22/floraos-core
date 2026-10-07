"use client"

import { ArrowLeft, CheckCircle2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  restoredCount: number
  validCount: number
  isImporting: boolean
  onBack: () => void
  onClearRestored: () => void
  onDownloadTemplate: () => void
  onImport: () => void
}

export function BulkImportHeader({ restoredCount, validCount, isImporting, onBack, onClearRestored, onDownloadTemplate, onImport }: Props) {
  return (
    <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay lại kho sản phẩm"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="text-caption text-text-muted">Kho sản phẩm cửa hàng</div>
          <h1 className="text-title font-extrabold text-primary">Nhập sản phẩm hàng loạt (Excel + Ảnh)</h1>
          {restoredCount > 0 && (
            <div className="mt-0.5 flex items-center gap-1.5 text-caption font-semibold text-success">
              <CheckCircle2 size={12} />
              <span>Đã khôi phục {restoredCount} sản phẩm từ phiên trước</span>
              <button
                type="button"
                onClick={onClearRestored}
                className="ml-1 text-danger hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="Xóa dữ liệu đã khôi phục"
              >
                (Xóa)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDownloadTemplate}
          className="flex items-center gap-1.5"
        >
          <Download size={14} />
          <span>Tải file Excel mẫu</span>
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onImport}
          disabled={isImporting || validCount === 0}
          className="flex items-center gap-1.5"
        >
          <CheckCircle2 size={15} strokeWidth={2.2} />
          <span>{isImporting ? "Đang xử lý..." : `Bắt đầu nạp (${validCount} mẫu)`}</span>
        </Button>
      </div>
    </header>
  )
}
