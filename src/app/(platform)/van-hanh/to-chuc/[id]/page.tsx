"use client"

// Chi tiết một tổ chức bất kỳ (`N1`, P25a) — không lọc theo tổ chức của
// người gọi. Xem đặc tả 06 mục 21.

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"

type PlatformOrganizationDetail = {
  id: string
  name: string
  slug: string
  type: string
  creditBalance: number
  createdAt: string
  memberCount: number
  branchCount: number
  workspaceKinds: string[]
}

async function layJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  return (await res.json()) as T
}

function Dong({ nhan, giaTri }: { nhan: string; giaTri: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-[13px] last:border-0">
      <span className="text-text-muted">{nhan}</span>
      <span className="font-medium">{giaTri}</span>
    </div>
  )
}

export default function ChiTietToChucPage() {
  const params = useParams<{ id: string }>()
  const [org, setOrg] = useState<PlatformOrganizationDetail | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await layJson<{ data: PlatformOrganizationDetail }>(`/api/v1/platform/organizations/${params.id}`)
      if (!res) {
        setLoi("Không tìm thấy tổ chức, hoặc không tải được.")
        return
      }
      setOrg(res.data)
    })()
  }, [params.id])

  if (loi) return <p className="text-sm text-danger">{loi}</p>
  if (!org) return <p className="text-sm text-text-muted">Đang tải…</p>

  return (
    <Card className="max-w-xl p-4">
      <p className="mb-3 text-lg font-semibold">{org.name}</p>
      <Dong nhan="Slug" giaTri={org.slug} />
      <Dong nhan="Loại tổ chức" giaTri={org.type} />
      <Dong nhan="Số dư credit" giaTri={org.creditBalance} />
      <Dong nhan="Thành viên" giaTri={org.memberCount} />
      <Dong nhan="Chi nhánh" giaTri={org.branchCount} />
      <Dong nhan="Workspace" giaTri={org.workspaceKinds.join(", ") || "—"} />
      <Dong nhan="Tạo lúc" giaTri={new Date(org.createdAt).toLocaleString("vi-VN")} />
    </Card>
  )
}
