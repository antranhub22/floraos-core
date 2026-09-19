"use client"

// Sức khoẻ hệ thống (`N5`, P25a) — CHỈ ĐỌC + cảnh báo (D-N5, chốt 18/09).
// Không có nút hành động: không huỷ job, không khởi động lại worker.
// Job treo thật sự bị đánh dấu FAILED bởi `scripts/scan-stuck-jobs.ts`,
// chạy ngoài request HTTP. Xem đặc tả 06 mục 21.

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"

type PlatformSystemHealth = {
  jobCountsByStatus: Record<string, number>
  stuckJobs: Array<{ id: string; organizationId: string; feature: string; startedAt: string | null }>
}

async function layJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  return (await res.json()) as T
}

export default function SucKhoeHeThongPage() {
  const [health, setHealth] = useState<PlatformSystemHealth | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await layJson<{ data: PlatformSystemHealth }>("/api/v1/platform/health")
      if (!res) {
        setLoi("Không tải được sức khoẻ hệ thống.")
        return
      }
      setHealth(res.data)
    })()
  }, [])

  if (loi) return <p className="text-sm text-danger">{loi}</p>
  if (!health) return <p className="text-sm text-text-muted">Đang tải…</p>

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold">Job theo trạng thái</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(health.jobCountsByStatus).map(([status, count]) => (
            <div key={status} className="rounded-xl border border-border px-3 py-2 text-[13px]">
              <span className="font-semibold">{count}</span> <span className="text-text-muted">{status}</span>
            </div>
          ))}
          {Object.keys(health.jobCountsByStatus).length === 0 && (
            <p className="text-[13px] text-text-muted">Chưa có job nào.</p>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-warning" /> Job treo (chỉ đọc)
        </p>
        <div className="flex flex-col divide-y divide-border">
          {health.stuckJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between py-2 text-[13px]">
              <span>{job.feature} · tổ chức {job.organizationId}</span>
              <span className="text-text-muted">
                {job.startedAt ? new Date(job.startedAt).toLocaleString("vi-VN") : "—"}
              </span>
            </div>
          ))}
          {health.stuckJobs.length === 0 && (
            <p className="py-2 text-[13px] text-text-muted">Không có job treo.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
