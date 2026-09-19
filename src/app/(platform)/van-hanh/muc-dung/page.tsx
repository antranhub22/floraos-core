"use client"

// Usage & chi phí gộp toàn hệ thống (`N4`, P25a). Xem đặc tả 06 mục 21.

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

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

  useEffect(() => {
    void (async () => {
      const res = await layJson<{ data: PlatformUsageRow[] }>("/api/v1/platform/usage")
      if (!res) {
        setLoi("Không tải được mức dùng.")
        return
      }
      setRows(res.data)
    })()
  }, [])

  if (loi) return <p className="text-sm text-danger">{loi}</p>
  if (!rows) return <p className="text-sm text-text-muted">Đang tải…</p>

  return (
    <Card className="overflow-x-auto p-4">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-border text-text-muted">
            <th className="py-2 pr-3">Tổ chức</th>
            <th className="py-2 pr-3">Tính năng</th>
            <th className="py-2 pr-3">Số lượt</th>
            <th className="py-2 pr-3">Credit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={`${row.organizationId}-${row.feature}-${i}`} className="hover:bg-surface-alt">
              <td className="py-2 pr-3 font-medium">{row.organizationName}</td>
              <td className="py-2 pr-3">{row.feature}</td>
              <td className="py-2 pr-3">{row.quantity}</td>
              <td className="py-2 pr-3">{row.costCredit}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-text-muted">
                Chưa có dữ liệu mức dùng.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  )
}
