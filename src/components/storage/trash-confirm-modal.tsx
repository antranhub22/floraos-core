"use client"

import React, { useState } from "react"
import { AlertTriangle, Trash2, X, Clock, ShieldCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface TrashConfirmTarget {
  id: string
  type: "RAW_ASSET" | "APPROVED_ANALYSIS" | "PRODUCT"
  name: string
  code?: string | null | undefined
  imageUrl?: string | null | undefined
}

interface TrashConfirmModalProps {
  target: TrashConfirmTarget | null
  onClose: () => void
  onConfirm: (target: TrashConfirmTarget) => Promise<void>
}

export function TrashConfirmModal({ target, onClose, onConfirm }: TrashConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  if (!target) return null

  const typeLabel =
    target.type === "PRODUCT"
      ? "Sản phẩm mẫu hoa"
      : target.type === "RAW_ASSET"
      ? "Ảnh gốc"
      : "Ảnh phân tích"

  async function handleConfirm() {
    if (!target || submitting) return
    setSubmitting(true)
    setErrorMsg("")
    try {
      await onConfirm(target)
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi chuyển vào thùng rác")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface rounded-3xl border border-border p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-danger-bg text-danger flex items-center justify-center shrink-0">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-body font-black text-foreground">
                Xác Nhận Chuyển Vào Thùng Rác
              </h3>
              <span className="text-caption text-text-muted font-bold">
                Quyền Điều Hành • Lưu trữ 30 ngày
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-1 rounded-xl text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target preview card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface border border-border">
          {target.imageUrl ? (
            <img
              src={target.imageUrl}
              alt={target.name}
              className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-surface-alt border border-border flex items-center justify-center text-text-muted shrink-0">
              <Trash2 size={20} className="opacity-40" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-caption px-2 py-0.5 rounded-md bg-surface-alt text-text-muted font-bold">
              {typeLabel}
            </span>
            <p className="text-body-sm font-extrabold text-foreground truncate mt-1" title={target.name}>
              {target.name}
            </p>
            {target.code && (
              <span className="text-caption text-text-muted font-mono">#{target.code}</span>
            )}
          </div>
        </div>

        {/* Policy Notice Box */}
        <div className="p-3.5 rounded-2xl bg-warning-bg border border-warning/30 text-caption text-foreground space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-warning">
            <Clock size={14} />
            <span>Chính sách lưu trữ an toàn 30 ngày</span>
          </div>
          <p className="text-body-sm leading-relaxed text-text-muted">
            Mục này sẽ được ẩn khỏi kho và chuyển vào <strong>Thùng rác</strong> trong <strong>30 ngày</strong>. Trong thời gian này, tài khoản Điều hành có thể <strong>Khôi phục</strong> lại bất kỳ lúc nào trước khi bị xóa vĩnh viễn.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-danger-bg text-danger text-caption font-bold">
            {errorMsg}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="h-10 px-4 text-body-sm font-bold"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="h-10 px-5 text-body-sm font-bold bg-danger text-white hover:bg-danger/90 gap-1.5 shadow-xs"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Xác nhận xóa</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
