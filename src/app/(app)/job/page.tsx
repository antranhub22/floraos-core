"use client"

// Danh sách job của tôi — trước đây là màn "Sắp có"; nay nối GET /jobs
// (`G4`, đặc tả 06 mục 7), cùng khuôn fetch với AdminDashboard.

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

type Job = {
  id: string
  feature: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"
  stage: string | null
  result: string | null
  error: string | null
}

const NHAN_TINH_NANG: Record<string, string> = {
  "vision.analyze": "Phân tích ảnh",
  "media.optimize": "Tối ưu ảnh",
  "catalog.generate": "Tạo danh mục",
}

const TRANG_THAI_ICON: Record<Job["status"], typeof Clock> = {
  PENDING: Clock,
  PROCESSING: Loader2,
  COMPLETED: CheckCircle2,
  FAILED: AlertTriangle,
  CANCELLED: XCircle,
}

const TRANG_THAI_NHAN: Record<Job["status"], string> = {
  PENDING: "Đang chờ",
  PROCESSING: "Đang chạy",
  COMPLETED: "Hoàn tất",
  FAILED: "Lỗi",
  CANCELLED: "Đã huỷ",
}

const TRANG_THAI_MAU: Record<Job["status"], string> = {
  PENDING: "text-text-muted",
  PROCESSING: "text-primary",
  COMPLETED: "text-secondary-text",
  FAILED: "text-danger",
  CANCELLED: "text-text-muted",
}

export default function JobListPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    let huy = false
    async function napLai() {
      try {
        const res = await fetch("/api/v1/jobs?limit=50")
        if (res.status === 401) {
          router.push("/dang-nhap")
          return
        }
        if (!res.ok) throw new Error(`Không tải được danh sách job (${res.status})`)
        const data = (await res.json()) as { data: Job[] }
        if (!huy) setJobs(data.data)
      } catch (e) {
        if (!huy) setLoi(e instanceof Error ? e.message : "Không tải được danh sách job")
      }
    }
    napLai()
    return () => {
      huy = true
    }
  }, [router])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center border-b border-border bg-surface px-[18px] py-4">
        <div className="text-[17px] font-extrabold text-primary">Job của tôi</div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {loi && (
          <div className="rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
            {loi}
          </div>
        )}

        {jobs === null ? (
          <div className="py-8 text-center text-[13px] text-text-muted">Đang tải…</div>
        ) : jobs.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <div className="text-[13.5px] font-semibold">Chưa có job nào</div>
            <div className="text-xs text-text-muted">Job xuất hiện ở đây sau khi bạn chạy một thao tác AI.</div>
          </Card>
        ) : (
          jobs.map((job) => {
            const Icon = TRANG_THAI_ICON[job.status]
            return (
              <Card
                key={job.id}
                className="flex cursor-pointer items-center gap-3 p-3.5 hover:shadow-md"
                onClick={() => router.push(`/job/${job.id}`)}
              >
                <Icon
                  size={18}
                  strokeWidth={1.9}
                  className={`flex-shrink-0 ${TRANG_THAI_MAU[job.status]} ${job.status === "PROCESSING" ? "animate-spin" : ""}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold">{NHAN_TINH_NANG[job.feature] ?? job.feature}</div>
                  <div className="truncate text-xs text-text-muted">
                    {TRANG_THAI_NHAN[job.status]}
                    {job.error ? ` · ${job.error}` : ""}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
