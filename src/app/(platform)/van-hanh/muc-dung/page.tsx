"use client"

// AI Quota & Mức Dùng Toàn Hệ Thống (TN-08, AI-05, P25a).
// Giám sát trần hạn mức chi phí AI, cảnh báo tiêu thụ và phân tích mức dùng từng tổ chức.

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  Sparkles,
  Coins,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  CheckCircle2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

type PlatformUsageRow = {
  organizationId: string
  organizationName: string
  feature: string
  quantity: number
  costCredit: number
}

async function layJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  return (await res.json()) as T
}

export default function MucDungPage() {
  const [rows, setRows] = useState<PlatformUsageRow[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<string>("ALL")
  const [searchOrg, setSearchOrg] = useState<string>("")

  useEffect(() => {
    void (async () => {
      const res = await layJson<{ data: PlatformUsageRow[] }>("/api/v1/platform/usage")
      if (!res) {
        setLoi("Không tải được dữ liệu mức dùng.")
        return
      }
      setRows(res.data)
    })()
  }, [])

  // Danh sách tính năng độc nhất cho bộ lọc
  const featuresList = useMemo(() => {
    if (!rows) return []
    const set = new Set(rows.map((r) => r.feature))
    return Array.from(set)
  }, [rows])

  // Thống kê tổng hợp (KPIs)
  const metrics = useMemo(() => {
    if (!rows) return { totalCredits: 0, totalCalls: 0, activeOrgs: 0, topConsumers: [] }
    const totalCredits = rows.reduce((sum, r) => sum + (r.costCredit || 0), 0)
    const totalCalls = rows.reduce((sum, r) => sum + (r.quantity || 0), 0)
    const orgMap = new Map<string, { id: string; name: string; credits: number; calls: number }>()

    for (const r of rows) {
      const cur = orgMap.get(r.organizationId) || { id: r.organizationId, name: r.organizationName, credits: 0, calls: 0 }
      cur.credits += r.costCredit || 0
      cur.calls += r.quantity || 0
      orgMap.set(r.organizationId, cur)
    }

    const orgsList = Array.from(orgMap.values()).sort((a, b) => b.credits - a.credits)
    return {
      totalCredits,
      totalCalls,
      activeOrgs: orgMap.size,
      topConsumers: orgsList.slice(0, 3),
    }
  }, [rows])

  // Dữ liệu sau lọc
  const filteredRows = useMemo(() => {
    if (!rows) return []
    return rows.filter((r) => {
      const matchesFeature = selectedFeature === "ALL" || r.feature === selectedFeature
      const matchesSearch = !searchOrg.trim() || r.organizationName.toLowerCase().includes(searchOrg.toLowerCase().trim())
      return matchesFeature && matchesSearch
    })
  }, [rows, selectedFeature, searchOrg])

  if (loi) return <p className="text-body-sm text-danger">{loi}</p>
  if (!rows) return <div className="py-4"><SkeletonBlock lines={6} /></div>

  return (
    <div className="space-y-6">
      {/* 1. Header & Giới thiệu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-selected text-primary text-caption font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>QUẢN TRỊ TÀI NGUYÊN & HẠN MỨC AI</span>
          </div>
          <h1 className="text-title font-extrabold text-text tracking-tight">Mức Dùng &amp; Quota Toàn Hệ Thống</h1>
          <p className="text-caption text-text-muted mt-0.5">
            Theo dõi lưu lượng gọi mô hình AI, lượng Credit tiêu thụ và kiểm soát trần hạn mức các tổ chức.
          </p>
        </div>
        <span className="self-start sm:self-auto rounded-lg bg-surface-alt px-3 py-1 text-caption font-semibold text-text-muted border border-border">
          Phạm vi: SuperAdmin Nền tảng
        </span>
      </div>

      {/* 2. Thẻ KPI Tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-xl border border-border bg-surface flex items-center gap-3.5 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Coins size={22} />
          </div>
          <div>
            <div className="text-caption font-medium text-text-muted">Tổng Credit Tiêu Thụ</div>
            <div className="text-title font-extrabold text-text mt-0.5">
              {metrics.totalCredits.toLocaleString("vi-VN")}
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border border-border bg-surface flex items-center gap-3.5 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-info-bg text-info shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="text-caption font-medium text-text-muted">Tổng Lượt Gọi AI</div>
            <div className="text-title font-extrabold text-text mt-0.5">
              {metrics.totalCalls.toLocaleString("vi-VN")}
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border border-border bg-surface flex items-center gap-3.5 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success shrink-0">
            <Building2 size={22} />
          </div>
          <div>
            <div className="text-caption font-medium text-text-muted">Tổ Chức Hoạt Động</div>
            <div className="text-title font-extrabold text-text mt-0.5">
              {metrics.activeOrgs}
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Cảnh báo trần hạn mức Quota (AI-05) */}
      {metrics.topConsumers.length > 0 && (
        <Card className="p-4 rounded-xl border border-warning/30 bg-warning-bg/50 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-body-sm font-bold text-text">Theo dõi tiêu thụ Credit cao nhất</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {metrics.topConsumers.map((org, idx) => (
              <div key={org.id} className="rounded-lg bg-surface p-3 border border-border flex items-center justify-between">
                <div>
                  <div className="text-caption font-bold text-text truncate max-w-[160px]">{org.name}</div>
                  <div className="text-caption text-text-muted">{org.calls} lượt gọi AI</div>
                </div>
                <div className="text-right">
                  <div className="text-body-sm font-extrabold text-primary">{org.credits}</div>
                  <Link href={`/van-hanh/to-chuc/${org.id}` as never} className="text-caption font-semibold text-primary hover:underline inline-flex items-center gap-0.5">
                    Chi tiết <ArrowUpRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. Bộ lọc & Bảng chi tiết */}
      <Card className="p-4 rounded-2xl border border-border bg-surface shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-text-muted" />
            <span className="text-body-sm font-bold text-text">Chi tiết mức dùng theo tính năng</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Tìm theo tên tổ chức..."
              value={searchOrg}
              onChange={(e) => setSearchOrg(e.target.value)}
              className="rounded-lg border border-border bg-surface-alt px-3 py-1.5 text-body-sm text-text placeholder:text-text-muted outline-none focus:border-primary"
            />
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="rounded-lg border border-border bg-surface-alt px-3 py-1.5 text-body-sm text-text outline-none focus:border-primary"
            >
              <option value="ALL">Tất cả tính năng ({featuresList.length})</option>
              {featuresList.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-caption">
                <th className="py-2.5 pr-4 font-semibold">Tổ chức</th>
                <th className="py-2.5 pr-4 font-semibold">Tính năng</th>
                <th className="py-2.5 pr-4 font-semibold text-center">Số lượt</th>
                <th className="py-2.5 pr-4 font-semibold text-right">Credit tiêu thụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.map((row, i) => (
                <tr key={`${row.organizationId}-${row.feature}-${i}`} className="hover:bg-surface-alt transition-colors">
                  <td className="py-3 pr-4">
                    <Link href={`/van-hanh/to-chuc/${row.organizationId}` as never} className="font-semibold text-text hover:text-primary transition-colors">
                      {row.organizationName}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-caption font-medium text-text">
                      {row.feature}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-center font-medium text-text">{row.quantity}</td>
                  <td className="py-3 pr-4 text-right font-bold text-primary">{row.costCredit}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-text-muted">
                    Không tìm thấy dữ liệu mức dùng phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
