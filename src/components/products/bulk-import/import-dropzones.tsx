"use client"

import React, { useRef } from "react"
import { Check, Download, FileCheck, FileSpreadsheet, FolderUp, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Props = {
  excelFile: File | null
  excelFileName: string
  imageCount: number
  isImporting: boolean
  onDownloadTemplate: () => void
  onExcelChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/** Hai ô chọn: file Excel sản phẩm và thư mục ảnh. */
export function ImportDropzones({ excelFile, excelFileName, imageCount, isImporting, onDownloadTemplate, onExcelChange, onImagesChange }: Props) {
  const excelInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Vùng 1: Upload Excel */}
      <Card className="p-5 flex flex-col justify-between border-dashed border-2 hover:border-primary/50 transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-title-sm font-bold text-text">
              <FileSpreadsheet size={20} className="text-success" />
              <span>1. File Excel sản phẩm</span>
            </div>
            {excelFile && (
              <span className="text-caption font-semibold text-success flex items-center gap-1 bg-success-bg px-2 py-0.5 rounded-full">
                <Check size={12} /> Đã chọn
              </span>
            )}
          </div>
          <p className="mt-1 text-body-sm text-text-muted">
            Hỗ trợ định dạng .xlsx, .xls, .csv chứa mã SKU, tên hoa, giá, công thức...
          </p>
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Download size={12} />
            Tải file Excel mẫu về
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-caption font-medium text-text truncate max-w-[200px]">
            {excelFile ? excelFile.name : excelFileName ? `${excelFileName} (đã lưu)` : "Chưa chọn file"}
          </span>
          <Button
            size="sm"
            variant={excelFile ? "secondary" : "primary"}
            onClick={() => excelInputRef.current?.click()}
            disabled={isImporting}
          >
            {excelFile ? "Đổi file Excel" : "Chọn file Excel"}
          </Button>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={onExcelChange}
            className="hidden"
          />
        </div>
      </Card>

      {/* Vùng 2: Upload Folder Ảnh */}
      <Card className="p-5 flex flex-col justify-between border-dashed border-2 hover:border-primary/50 transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-title-sm font-bold text-text">
              <FolderUp size={20} className="text-primary" />
              <span>2. Thư mục ảnh sản phẩm</span>
            </div>
            {imageCount > 0 && (
              <span className="text-caption font-semibold text-primary flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                <FileCheck size={12} /> {imageCount} ảnh sẵn sàng
              </span>
            )}
          </div>
          <p className="mt-1 text-body-sm text-text-muted">
            Chọn cả folder hoặc nhiều ảnh cùng lúc. Tên ảnh đặt trùng mã sản phẩm (vd: <code>FL-1001.jpg</code>).
          </p>
          {/* Security tip */}
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-success-bg border border-success/30 px-3 py-2">
            <ShieldCheck size={14} className="text-success mt-0.5 shrink-0" />
            <p className="text-caption text-success font-medium leading-relaxed">
              <span className="font-bold">Bảo mật tốt hơn link Google Drive:</span> Ảnh được lưu vào kho riêng của tiệm và bảo vệ bằng Signed URL tự hết hạn sau 24h — không ai truy cập được nếu không đăng nhập FloraOS.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-caption font-medium text-text">
            {imageCount > 0 ? `Đã nạp ${imageCount} ảnh` : "Chưa chọn thư mục"}
          </span>
          <Button
            size="sm"
            variant={imageCount > 0 ? "secondary" : "outline"}
            onClick={() => folderInputRef.current?.click()}
            disabled={isImporting}
          >
            {imageCount > 0 ? "Chọn lại ảnh" : "Chọn thư mục ảnh"}
          </Button>
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-expect-error webkitdirectory is standard for folder picker
            webkitdirectory=""
            directory=""
            accept="image/*"
            onChange={onImagesChange}
            className="hidden"
          />
        </div>
      </Card>
    </div>
  )
}
