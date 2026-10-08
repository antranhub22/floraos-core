"use client"

import React from "react"
import Link from "next/link"
import type { Route } from "next"
import { AlertTriangle } from "lucide-react"
import { useApi } from "@/components/greeting-card/greeting-api"
import { useSession } from "@/lib/session"
import { shopProfileGap } from "@/modules/greeting-card/domain/shop-contact"

/**
 * Nhắc hoàn tất Hồ sơ tiệm trước khi bán (PO 08/10/2026): khách thấy tên, số điện thoại, Zalo lấy từ
 * Hồ sơ tiệm. Hồ sơ còn là dữ liệu mẫu thì máy chủ chặn gửi link; thiếu số điện thoại thì chỉ nhắc.
 */
export function ShopProfileReadiness() {
  const { can } = useSession()
  const profile = useApi<{ display_name?: string | null; phone?: string | null } | null>("/api/v1/business-profile")
  if (profile.isLoading || profile.error) return null
  const gap = shopProfileGap(profile.data ? { name: profile.data.display_name ?? null, phone: profile.data.phone ?? null } : null)
  if (!gap) return null
  return (
    <div role="status" className="flex flex-col gap-2 rounded-xl border border-warning-border bg-warning-bg p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-body-sm text-warning">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>{gap}</span>
      </p>
      {can("F2") ? (
        <Link href={"/ho-so" as Route} className="shrink-0 rounded-lg border border-warning-border bg-surface px-3 py-2 text-body-sm font-bold text-warning hover:bg-surface-alt">
          Mở Hồ sơ tiệm
        </Link>
      ) : (
        <span className="shrink-0 text-caption text-text-muted">Báo Điều hành cập nhật Hồ sơ tiệm</span>
      )}
    </div>
  )
}
