"use client"

import React from "react"
import Link from "next/link"
import { Building2, Clock, AlertTriangle, ArrowRight } from "lucide-react"

export interface PlatformOrganizationSummary {
  id: string
  name: string
  slug: string
  type: string
  creditBalance: number
  createdAt: string
  memberCount: number
}

export interface PlatformSystemHealth {
  jobCountsByStatus: Record<string, number>
  stuckJobs: Array<{ id: string; organizationId: string; feature: string; startedAt: string | null }>
}

interface PlatformOverviewMetricsProps {
  orgs: PlatformOrganizationSummary[]
  health: PlatformSystemHealth
}

function moiTrong7Ngay(orgs: PlatformOrganizationSummary[]): number {
  const nguong = Date.now() - 7 * 24 * 60 * 60 * 1000
  return orgs.filter((o) => new Date(o.createdAt).getTime() >= nguong).length
}

export function PlatformOverviewMetrics({
  orgs,
  health,
}: PlatformOverviewMetricsProps) {
  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-selected text-primary">
            <Building2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-display font-extrabold text-text">{orgs.length}</p>
            <p className="text-body-sm text-text-muted mt-0.5">Tổng số tổ chức</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-selected text-primary">
            <Clock className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-display font-extrabold text-text">{moiTrong7Ngay(orgs)}</p>
            <p className="text-body-sm text-text-muted mt-0.5">Tổ chức mới (7 ngày qua)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning-bg text-warning-text">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-display font-extrabold text-text">{health.stuckJobs.length}</p>
            <p className="text-body-sm text-text-muted mt-0.5">Tác vụ tồn đọng (Job treo)</p>
          </div>
        </div>
      </div>

      {/* Danh sách tổ chức gần đây */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-title-sm font-bold text-text">
              Tổ chức hoạt động gần đây
            </h3>
            <p className="text-caption text-text-muted mt-0.5">
              Các đơn vị đăng ký và sử dụng hệ thống mới nhất
            </p>
          </div>
          <Link
            href={"/van-hanh/to-chuc" as never}
            className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:underline"
          >
            <span>Xem tất cả tổ chức</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="divide-y divide-border">
          {orgs.slice(0, 8).map((org) => (
            <Link
              key={org.id}
              href={`/van-hanh/to-chuc/${org.id}` as never}
              className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-surface-alt transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                <span className="text-body-sm font-semibold text-text group-hover:text-primary transition-colors">
                  {org.name}
                </span>
              </div>
              <span className="text-caption text-text-muted">
                {org.type} · {org.memberCount} thành viên
              </span>
            </Link>
          ))}
          {orgs.length === 0 && (
            <p className="py-6 text-center text-body-sm text-text-muted">
              Chưa có tổ chức nào trong hệ thống.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
