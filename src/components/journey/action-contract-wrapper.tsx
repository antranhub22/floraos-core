"use client"

import React from "react"
import { ArrowLeft, Loader2, AlertCircle, ArrowRight, RefreshCw } from "lucide-react"
import { NextActions, type NextActionItem } from "./next-actions"

interface ActionContractWrapperProps {
  title: string
  description?: string
  currentPhase: "INPUT" | "CONFIRM" | "PROCESSING" | "RESULT"
  onBack?: () => void
  inputNode?: React.ReactNode
  confirmNode?: React.ReactNode
  onConfirm?: () => void
  onProceedToConfirm?: () => void
  processingMessage?: string
  resultNode?: React.ReactNode
  nextActions?: NextActionItem[]
  errorMessage?: string | null
  onRetry?: () => void
}

export function ActionContractWrapper({
  title,
  description,
  currentPhase,
  onBack,
  inputNode,
  confirmNode,
  onConfirm,
  onProceedToConfirm,
  processingMessage = "Hệ thống đang xử lý tác vụ, vui lòng chờ giây lát...",
  resultNode,
  nextActions,
  errorMessage,
  onRetry,
}: ActionContractWrapperProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border bg-surface px-4 py-3 rounded-xl">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface hover:bg-surface-alt text-text transition-colors cursor-pointer"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <div>
            <h2 className="text-title font-bold text-text">
              {title}
            </h2>
            {description && (
              <p className="text-meta text-text-muted mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Phase Indicator Badge */}
        <span className="text-caption font-semibold px-2.5 py-1 rounded-md bg-selected text-primary border border-border">
          {currentPhase === "INPUT" && "Bước 1: Nhập thông tin"}
          {currentPhase === "CONFIRM" && "Bước 2: Xác nhận"}
          {currentPhase === "PROCESSING" && "Bước 3: Đang xử lý"}
          {currentPhase === "RESULT" && "Bước 4: Hoàn thành"}
        </span>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-danger-bg border border-danger flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="text-body-sm font-bold text-danger">
                Đã xảy ra lỗi khi thực hiện tác vụ
              </h3>
              <p className="text-body-sm text-text mt-0.5">
                {errorMessage}
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-danger text-body-sm font-bold text-danger hover:bg-danger-bg transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Thử lại</span>
            </button>
          )}
        </div>
      )}

      {/* Body Content based on Phase */}
      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs min-h-[300px]">
        {currentPhase === "INPUT" && (
          <div className="space-y-6">
            <div>{inputNode}</div>
            {onProceedToConfirm && (
              <div className="flex justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={onProceedToConfirm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-surface text-body-sm font-bold hover:bg-primary-dark transition-colors cursor-pointer"
                >
                  <span>Tiếp tục xác nhận</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}

        {currentPhase === "CONFIRM" && (
          <div className="space-y-6">
            <div>{confirmNode}</div>
            {onConfirm && (
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 rounded-lg border border-border text-body-sm font-medium text-text hover:bg-surface-alt transition-colors cursor-pointer"
                  >
                    Chỉnh sửa lại
                  </button>
                )}
                <button
                  type="button"
                  onClick={onConfirm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-surface text-body-sm font-bold hover:bg-primary-dark transition-colors cursor-pointer"
                >
                  <span>Tiến hành ngay</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}

        {currentPhase === "PROCESSING" && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" aria-hidden="true" />
            <div>
              <h3 className="text-title-sm font-bold text-text">
                Đang xử lý dữ liệu
              </h3>
              <p className="text-body-sm text-text-muted mt-1 max-w-md">
                {processingMessage}
              </p>
            </div>
          </div>
        )}

        {currentPhase === "RESULT" && (
          <div className="space-y-6">
            <div>{resultNode}</div>
            {nextActions && nextActions.length > 0 && (
              <div className="pt-6 border-t border-border">
                <NextActions actions={nextActions} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
