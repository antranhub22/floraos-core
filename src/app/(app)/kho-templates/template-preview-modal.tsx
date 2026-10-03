"use client"

import React from "react"
import { Info } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"

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
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      size={wide ? "lg" : "md"}
      title={
        <div className="flex flex-wrap items-center gap-2">
          <code className="truncate text-body-sm font-bold text-text">{fileName}</code>
          <span className="shrink-0 rounded-full bg-surface-alt px-2 py-0.5 text-caption font-bold tracking-wide text-text-muted uppercase">
            {fileType}
          </span>
        </div>
      }
      description={purpose}
      footer={
        <div className="flex shrink-0 items-center gap-1.5 text-caption text-text-muted w-full">
          <Info size={13} className="shrink-0 text-primary" />
          <span>Dữ liệu minh hoạ để xem giao diện — không phải dữ liệu thật trong hệ thống.</span>
        </div>
      }
      className={wide ? "max-w-3xl" : "max-w-xl"}
    >
      <div className="mx-auto flex max-w-md flex-col gap-3 sm:max-w-none">
        {children}
      </div>
    </Dialog>
  )
}

