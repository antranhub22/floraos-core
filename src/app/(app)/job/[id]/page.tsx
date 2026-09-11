"use client"

// Chi tiết job — trước đây là màn "Sắp có"; nay nối GET /jobs/:id (`G4`),
// cộng hai thao tác đã có API sẵn: huỷ (`POST /jobs/:id/cancel`, job còn
// PENDING) và chạy lại (`POST /jobs/:id/retry`, job đã FAILED).

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type JobDetail = {
  id: string
  feature: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"
  stage: string | null
  result: string | null
  error: string | null
  product_id: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

const NHAN_TINH_NANG: Record<string, string> = {
  "vision.analyze": "Phân tích ảnh",
  "media.optimize": "Tối ưu ảnh",
  "catalog.generate": "Tạo danh mục",
}

const TRANG_THAI_NHAN: Record<JobDetail["status"], string> = {
  PENDING: "Đang chờ",
  PROCESSING: "Đang chạy",
  COMPLETED: "Hoàn tất",
  FAILED: "Lỗi",
  CANCELLED: "Đã huỷ",
}

function dinhDangGio(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("vi-VN")
}

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const jobId = params.id

  const [job, setJob] = useState<JobDetail | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [dangXuLy, setDangXuLy] = useState(false)

  async function napLai() {
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}`)
      if (res.status === 401) {
        router.push("/dang-nhap")
        return
      }
      if (!res.ok) throw new Error(`Không tải được job (${res.status})`)
      const data = (await res.json()) as { job: JobDetail }
      setJob(data.job)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không tải được job")
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    napLai()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  async function huy() {
    setDangXuLy(true)
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/cancel`, { method: "POST" })
      if (!res.ok) throw new Error(`Huỷ thất bại (${res.status})`)
      await napLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Huỷ thất bại")
    } finally {
      setDangXuLy(false)
    }
  }

  async function chayLai() {
    setDangXuLy(true)
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/retry`, { method: "POST" })
      if (!res.ok) throw new Error(`Chạy lại thất bại (${res.status})`)
      await napLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chạy lại thất bại")
    } finally {
      setDangXuLy(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-border bg-surface px-[14px] py-4">
        <button
          type="button"
          onClick={() => router.push("/job")}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-alt"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <div className="text-[16px] font-extrabold text-primary">
          {job ? NHAN_TINH_NANG[job.feature] ?? job.feature : "Chi tiết job"}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
        {loi && (
          <div className="rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
            {loi}
          </div>
        )}

        {job === null ? (
          <div className="py-8 text-center text-[13px] text-text-muted">Đang tải…</div>
        ) : (
          <>
            <Card className="flex flex-col gap-2.5 p-[18px]">
              <div className="flex justify-between text-[13px]">
                <span className="text-text-muted">Trạng thái</span>
                <span className="font-bold">{TRANG_THAI_NHAN[job.status]}</span>
              </div>
              {job.stage && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-muted">Giai đoạn</span>
                  <span className="font-bold">{job.stage}</span>
                </div>
              )}
              {job.result && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-muted">Kết quả</span>
                  <span className="font-bold">{job.result}</span>
                </div>
              )}
              {job.error && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-muted">Lỗi</span>
                  <span className="font-bold text-danger">{job.error}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <span className="text-text-muted">Tạo lúc</span>
                <span className="font-bold">{dinhDangGio(job.created_at)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-text-muted">Bắt đầu chạy</span>
                <span className="font-bold">{dinhDangGio(job.started_at)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-text-muted">Hoàn tất</span>
                <span className="font-bold">{dinhDangGio(job.completed_at)}</span>
              </div>
            </Card>

            {job.status === "PENDING" && (
              <Button variant="secondary" disabled={dangXuLy} onClick={huy}>
                {dangXuLy ? "Đang huỷ…" : "Huỷ job"}
              </Button>
            )}
            {job.status === "FAILED" && (
              <Button disabled={dangXuLy} onClick={chayLai}>
                {dangXuLy ? "Đang chạy lại…" : "Chạy lại"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
