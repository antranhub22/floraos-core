"use client"

import React, { useState } from "react"
import {
  X,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Upload,
  Eye,
  Trash2,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ProductionUpdateModalProps {
  isOpen: boolean
  orderCode: string
  recipeTitle: string
  currentProgressPercent: number
  sampleImageUrl?: string | undefined
  onClose: () => void
  onSubmitUpdate: (params: {
    progressPercent: number
    action: "UPDATE_PROGRESS" | "REPORT_MATERIAL_ISSUE" | "MARK_READY"
    finishedImageUrl?: string | undefined
    issueNote?: string | undefined
  }) => void
}

export function ProductionUpdateModal({
  isOpen,
  orderCode,
  recipeTitle,
  currentProgressPercent,
  sampleImageUrl,
  onClose,
  onSubmitUpdate,
}: ProductionUpdateModalProps) {
  const [progress, setProgress] = useState<number>(currentProgressPercent)
  const [isReportingIssue, setIsReportingIssue] = useState(false)
  const [issueNote, setIssueNote] = useState("")
  const [finishedImageUrl, setFinishedImageUrl] = useState<string>(
    sampleImageUrl || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80"
  )
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFinishedImageUrl(reader.result)
        setProgress(100)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    onSubmitUpdate({
      progressPercent: progress,
      action: isReportingIssue
        ? "REPORT_MATERIAL_ISSUE"
        : progress === 100
        ? "MARK_READY"
        : "UPDATE_PROGRESS",
      finishedImageUrl: progress === 100 ? finishedImageUrl : undefined,
      issueNote: isReportingIssue ? issueNote : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase border border-zinc-200">
                  CHẶNG P4 • GIA CÔNG
                </span>
                <h3 className="text-base font-extrabold text-text">
                  Tiến Độ & Ảnh Thành Phẩm (T08/T10)
                </h3>
              </div>
              <p className="text-[11px] text-text-muted">
                Đơn #{orderCode}: {recipeTitle}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Thanh trượt tiến độ */}
          <div className="p-4 rounded-xl border border-border bg-surface-alt flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-text">Tiến độ hoàn thiện mẫu cắm:</label>
              <span className="font-extrabold text-red-700 text-base">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer h-2 bg-surface rounded-lg"
            />
            <div className="flex justify-between text-[10.5px] font-semibold text-text-muted mt-1">
              <button
                type="button"
                onClick={() => setProgress(25)}
                className="hover:text-text cursor-pointer"
              >
                25% Lên cốt
              </button>
              <button
                type="button"
                onClick={() => setProgress(50)}
                className="hover:text-text cursor-pointer"
              >
                50% Cắm hoa chính
              </button>
              <button
                type="button"
                onClick={() => setProgress(75)}
                className="hover:text-text cursor-pointer"
              >
                75% Điểm lá & nơ
              </button>
              <button
                type="button"
                onClick={() => setProgress(100)}
                className="text-red-700 font-bold hover:underline cursor-pointer"
              >
                100% Cắm xong ➔
              </button>
            </div>
          </div>

          {/* Khối tải ảnh thành phẩm cắm xong thực tế khi progress >= 80% */}
          {progress >= 80 && (
            <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                  <Camera size={14} className="text-emerald-700" />
                  Ảnh Hoa Thành Phẩm Thực Tế (Bắt buộc cho Chặng P5 AI QC):
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Thợ cắm gửi về
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-24 h-24 rounded-xl border border-emerald-300 bg-surface overflow-hidden shrink-0 shadow-xs group">
                  {finishedImageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={finishedImageUrl}
                        alt="Ảnh hoa thành phẩm"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => window.open(finishedImageUrl, "_blank")}
                          className="p-1 rounded bg-surface text-text hover:bg-white text-xs shadow"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinishedImageUrl("")}
                          className="p-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs shadow"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5">
                        Thành phẩm
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-text-muted p-1">
                      <Camera size={20} className="text-emerald-500 mb-0.5" />
                      <span className="text-[9.5px]">Chưa có ảnh</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Dán link ảnh hoa thợ gửi qua Zalo..."
                    value={finishedImageUrl}
                    onChange={(e) => setFinishedImageUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs h-7 gap-1 border-emerald-300 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 font-bold"
                    >
                      <Upload size={12} />
                      <span>Tải ảnh hoa thợ cắm lên</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Báo cáo sự cố nguyên liệu nếu có */}
          <div className="p-3 rounded-xl border border-border bg-surface-alt flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" />
                Báo cáo sự cố hoa / nguyên liệu (P8):
              </span>
              <input
                type="checkbox"
                checked={isReportingIssue}
                onChange={(e) => setIsReportingIssue(e.target.checked)}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
              />
            </div>

            {isReportingIssue && (
              <textarea
                rows={2}
                placeholder="Mô tả sự cố (ví dụ: Thiếu 3 cành Hồng Ohara kem, xin đổi sang Hồng Juliet cùng tone màu...)"
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-amber-200 bg-surface text-text text-xs focus:outline-none focus:border-red-500 mt-1"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-2.5 sticky bottom-0 bg-surface">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>

          {progress === 100 ? (
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm"
            >
              <CheckCircle2 size={14} />
              <span>Cắm Xong ➔ Gửi Kiểm Định AI QC (P5)</span>
              <ArrowRight size={14} />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 shadow-sm"
            >
              <CheckCircle2 size={14} />
              <span>Lưu Cập Nhật Tiến Trình</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
