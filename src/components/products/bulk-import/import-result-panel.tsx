"use client"

import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ImportResult } from "./types"

type Props = { result: ImportResult; onBack: () => void; onReset: () => void }

export function ImportResultPanel({ result, onBack, onReset }: Props) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        result.success
          ? "border-success/30 bg-success-bg/40 text-success-dark"
          : "border-danger/30 bg-danger-bg/40 text-danger"
      }`}
    >
      <div className="flex items-center gap-2 text-title-sm font-bold">
        {result.success ? <CheckCircle2 size={20} className="text-success" /> : <AlertTriangle size={20} className="text-danger" />}
        <span>{result.success ? "Nạp sản phẩm hoàn tất!" : "Nạp chưa xong — một phần sản phẩm chưa được lưu"}</span>
      </div>
      <div className="mt-2 text-body-sm flex flex-wrap gap-4 font-medium">
        <div>✅ Đã tạo mới: <b>{result.createdCount}</b> sản phẩm</div>
        <div>⏩ Bỏ qua (trùng mã): <b>{result.skippedCount}</b></div>
        {result.imagesAttachedCount > 0 && (
          <div>🖼️ Bổ sung ảnh cho sản phẩm đã có: <b>{result.imagesAttachedCount}</b></div>
        )}
        {result.failedCount > 0 && (
          <div className="text-danger">❌ Lỗi: <b>{result.failedCount}</b></div>
        )}
      </div>
      {result.failedItems.length > 0 && (
        <ul className="mt-3 max-h-40 overflow-y-auto text-caption space-y-0.5">
          {result.failedItems.slice(0, 50).map((f, i) => (
            <li key={`${f.code}-${i}`}><b>{f.code}</b>: {f.error}</li>
          ))}
          {result.failedItems.length > 50 && <li>… và {result.failedItems.length - 50} mã khác</li>}
        </ul>
      )}
      <div className="mt-4 flex gap-3">
        <Button
          size="sm"
          onClick={onBack}
        >
          Về danh sách kho sản phẩm
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
        >
          Nhập đợt khác
        </Button>
      </div>
    </div>
  )
}
