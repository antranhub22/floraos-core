"use client"

import React from "react"
import { Hourglass } from "lucide-react"
import { photoApprovalBlockerAt, type PhotoApprovalState } from "@/modules/greeting-card/domain/photo-approval"

export type { PhotoApprovalState }

/** Lý do chưa giao ship được vì đang chờ khách duyệt ảnh — cùng hàm với máy chủ, tính lại theo giờ máy. */
export function photoWaitBlocker(approval: PhotoApprovalState | null | undefined, now: number): string | null {
  return photoApprovalBlockerAt(approval, now)
}

/** Ghi chú chờ khách duyệt ảnh trên thẻ đơn để Điều phối biết vì sao chưa giao ship được (PO 15/10/2026, mục 4). */
export function PhotoApprovalNote({ approval, now }: { approval: PhotoApprovalState | null | undefined; now: number }) {
  const reason = photoApprovalBlockerAt(approval, now)
  if (reason === null) return null
  return (
    <p className="flex items-center gap-1.5 rounded-lg bg-warning-bg/50 px-2 py-1 text-caption font-semibold text-warning-text">
      <Hourglass size={12} aria-hidden="true" className="shrink-0" />
      {reason}
    </p>
  )
}
