"use client"

// Tổng quan console vận hành (P25a, chỉ đọc). Ba thẻ số liệu tính từ ba
// route N1/N5 đã có — KHÔNG có "yêu cầu nâng cấp đang chờ" vì đọc số đó
// thuộc N2 (P25b, chưa xây); dùng "tổng số tổ chức" thay cho thẻ đó.

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Building2, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"

type PlatformOrganizationSummary = {
  id: string
  name: string
  slug: string
  type: string
  creditBalance: number
  createdAt: string
  memberCount: number
}

type PlatformSystemHealth = {
  jobCountsByStatus: Record<string, number>
  stuckJobs: Array<{ id: string; organizationId: string; feature: string; startedAt: string | null }>
}

async function layJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  return (await res.json()) as T
}

function moiTrong7Ngay(orgs: PlatformOrganizationSummary[]): number {
  const nguong = Date.now() - 7 * 24 * 60 * 60 * 1000
  return orgs.filter((o) => new Date(o.createdAt).getTime() >= nguong).length
}

export default function VanHanhTongQuanPage() {
  const [orgs, setOrgs] = useState<PlatformOrganizationSummary[] | null>(null)
  const [health, setHealth] = useState<PlatformSystemHealth | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const [orgsRes, healthRes] = await Promise.all([
        layJson<{ data: PlatformOrganizationSummary[] }>("/api/v1/platform/organizations"),
        layJson<{ data: PlatformSystemHealth }>("/api/v1/platform/health"),
      ])
      if (!orgsRes || !healthRes) {
        setLoi("Không tải được số liệu tổng quan.")
        return
      }
      setOrgs(orgsRes.data)
      setHealth(healthRes.data)
    })()
  }, [])

  if (loi) return <p className="text-sm text-danger">{loi}</p>
  if (!orgs || !health) return <p className="text-sm text-text-muted">Đang tải…</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-2xl font-bold">{orgs.length}</p>
            <p className="text-[13px] text-text-muted">Tổ chức</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="text-2xl font-bold">{moiTrong7Ngay(orgs)}</p>
            <p className="text-[13px] text-text-muted">Tổ chức mới (7 ngày qua)</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <p className="text-2xl font-bold">{health.stuckJobs.length}</p>
            <p className="text-[13px] text-text-muted">Job treo</p>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold">Tổ chức gần đây</p>
        <div className="flex flex-col divide-y divide-border">
          {orgs.slice(0, 8).map((org) => (
            <Link
              key={org.id}
              href={`/van-hanh/to-chuc/${org.id}` as never}
              className="flex items-center justify-between py-2 text-[13px] hover:bg-surface-alt"
            >
              <span className="font-medium">{org.name}</span>
              <span className="text-text-muted">{org.type} · {org.memberCount} thành viên</span>
            </Link>
          ))}
          {orgs.length === 0 && <p className="py-2 text-[13px] text-text-muted">Chưa có tổ chức nào.</p>}
        </div>
      </Card>
    </div>
  )
}
