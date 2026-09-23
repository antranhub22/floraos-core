"use client"

import React, { useState, useRef, useCallback } from "react"
import {
  UploadCloud,
  FolderCheck,
  CheckCircle2,
  ShieldCheck,
  Image as ImageIcon,
  Sparkles,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type PipelineRoute = "route-a" | "route-b"

export interface PrestructuredAsset {
  id: string
  title: string
  imageUrl: string
  status?: string | undefined
  category?: string | undefined
  hasIdentityApproval?: boolean | undefined
}

export interface InlineSourcePickerProps {
  currentRoute?: PipelineRoute | undefined
  onRouteChange?: ((route: PipelineRoute) => void) | undefined
  onRawSelect?: ((file: File, previewUrl: string) => void) | undefined
  onAssetSelect?: ((asset: PrestructuredAsset) => void) | undefined
  assets?: PrestructuredAsset[] | undefined
  selectedAssetId?: string | undefined
  disabled?: boolean | undefined
  className?: string | undefined
  title?: string | undefined
  description?: string | undefined
  acceptedFileTypes?: string | undefined
}

/**
 * InlineSourcePicker — Chuẩn hoá Dual-Phase Inline Pipeline (Route A vs Route B)
 *
 * Cho phép chuyển đổi linh hoạt tại chỗ:
 * - Route A (Raw Input): Tải ảnh trực tiếp -> Chạy tiền xử lý AI Vision/NLP -> Cổng Identity Guard
 * - Route B (Pre-structured): Chọn tài sản đã kiểm duyệt trong Kho -> Bỏ qua tiền xử lý
 */
export function InlineSourcePicker({
  currentRoute = "route-a",
  onRouteChange,
  onRawSelect,
  onAssetSelect,
  assets = [],
  selectedAssetId,
  disabled = false,
  className,
  title = "Chọn Nguồn Dữ Liệu Đầu Vào",
  description = "Tải ảnh trực tiếp từ xưởng hoa hoặc chọn từ Kho tài sản đã qua kiểm định",
  acceptedFileTypes = "image/*",
}: InlineSourcePickerProps) {
  const [route, setRoute] = useState<PipelineRoute>(currentRoute)
  const [searchQuery, setSearchQuery] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [rawPreview, setRawPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleRouteSwitch = useCallback(
    (newRoute: PipelineRoute) => {
      setRoute(newRoute)
      onRouteChange?.(newRoute)
    },
    [onRouteChange]
  )

  const handleFileProcess = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file)
      setRawPreview(url)
      onRawSelect?.(file, url)
    },
    [onRawSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (disabled) return
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileProcess(e.dataTransfer.files[0])
      }
    },
    [disabled, handleFileProcess]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const filteredAssets = assets.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={cn("w-full rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs", className)}>
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h3 className="text-sm font-extrabold text-text flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            {title}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        </div>

        <div className="inline-flex rounded-xl bg-surface-alt p-1 border border-border shrink-0">
          <button
            type="button"
            onClick={() => handleRouteSwitch("route-a")}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
              route === "route-a"
                ? "bg-primary text-white shadow-xs"
                : "text-text-muted hover:text-text"
            )}
          >
            <UploadCloud size={14} />
            <span>Route A: Ảnh thô</span>
          </button>

          <button
            type="button"
            onClick={() => handleRouteSwitch("route-b")}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
              route === "route-b"
                ? "bg-primary text-white shadow-xs"
                : "text-text-muted hover:text-text"
            )}
          >
            <FolderCheck size={14} />
            <span>Route B: Kho Master</span>
          </button>
        </div>
      </div>

      {/* Body Route A: Raw Input */}
      {route === "route-a" && (
        <div className="pt-4 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center",
              dragActive
                ? "border-primary bg-red-50/50"
                : "border-border hover:border-primary/50 hover:bg-surface-alt/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes}
              disabled={disabled}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0])
                }
              }}
            />

            {rawPreview ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-28 w-28 rounded-lg overflow-hidden border border-border shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={rawPreview} alt="Xem trước ảnh thô" className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center gap-1 text-xs text-primary font-bold">
                  <CheckCircle2 size={13} />
                  <span>Đã nạp ảnh thô — Sẵn sàng chạy tiền xử lý</span>
                </div>
                <span className="text-[11px] text-text-muted">Nhấp hoặc kéo thả ảnh khác để thay đổi</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-primary">
                  <UploadCloud size={24} />
                </div>
                <div className="text-xs font-bold text-text">
                  Kéo thả ảnh chụp vào đây, hoặc <span className="text-primary underline">chọn từ thiết bị</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-text-muted">
                  <span>Hỗ trợ JPG, PNG, WEBP</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-emerald-700">
                    <ShieldCheck size={12} />
                    Tự động kiểm tra Identity Guard
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body Route B: Pre-structured Master Assets */}
      {route === "route-b" && (
        <div className="pt-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-text-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm tài sản trong Kho Master..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-surface-alt focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {filteredAssets.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted border border-dashed rounded-xl">
              {assets.length === 0
                ? "Chưa có tài sản Master nào trong Kho dữ liệu."
                : "Không tìm thấy tài sản phù hợp với từ khóa."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAssetId === asset.id
                return (
                  <div
                    key={asset.id}
                    onClick={() => !disabled && onAssetSelect?.(asset)}
                    className={cn(
                      "group relative flex flex-col rounded-xl border p-2 cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-red-50/40 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-surface-alt"
                    )}
                  >
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset.imageUrl} alt={asset.title} className="h-full w-full object-cover" />
                      {isSelected && (
                        <div className="absolute top-1 right-1 rounded-full bg-primary text-white p-0.5 shadow-xs">
                          <CheckCircle2 size={12} />
                        </div>
                      )}
                    </div>
                    <div className="text-[11.5px] font-bold text-text truncate">{asset.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-text-muted mt-0.5">
                      <span className="truncate">{asset.category || "Master"}</span>
                      {asset.hasIdentityApproval && (
                        <Badge tone="success" className="text-[9px] px-1.5 py-0 h-4 border border-emerald-300">
                          Đã duyệt
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
