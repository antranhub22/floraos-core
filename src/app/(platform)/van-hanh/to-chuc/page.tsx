"use client"

// Danh sách mọi tổ chức (`N1`, P25a). Xem đặc tả 06 mục 21.

import { useEffect, useState } from "react"
import Link from "next/link"
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

async function layJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  return (await res.json()) as T
}

export default function DanhSachToChucPage() {
  const [orgs, setOrgs] = useState<PlatformOrganizationSummary[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await layJson<{ data: PlatformOrganizationSummary[] }>("/api/v1/platform/organizations")
      if (!res) {
        setLoi("Không tải được danh sách tổ chức.")
        return
      }
      setOrgs(res.data)
    })()
  }, [])

  if (loi) return <p className="text-sm text-danger">{loi}</p>
  if (!orgs) return <p className="text-sm text-text-muted">Đang tải…</p>

  return (
    <Card className="overflow-x-auto p-4">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-border text-text-muted">
            <th className="py-2 pr-3">Tổ chức</th>
            <th className="py-2 pr-3">Loại</th>
            <th className="py-2 pr-3">Thành viên</th>
            <th className="py-2 pr-3">Credit</th>
            <th className="py-2 pr-3">Tạo lúc</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orgs.map((org) => (
            <tr key={org.id} className="hover:bg-surface-alt">
              <td className="py-2 pr-3">
                <Link href={`/van-hanh/to-chuc/${org.id}` as never} className="font-medium text-primary">
                  {org.name}
                </Link>
                <span className="ml-1 text-text-muted">({org.slug})</span>
              </td>
              <td className="py-2 pr-3">{org.type}</td>
              <td className="py-2 pr-3">{org.memberCount}</td>
              <td className="py-2 pr-3">{org.creditBalance}</td>
              <td className="py-2 pr-3">{new Date(org.createdAt).toLocaleDateString("vi-VN")}</td>
            </tr>
          ))}
          {orgs.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-text-muted">
                Chưa có tổ chức nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  )
}
