"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Cpu, Bell, AlertTriangle, Clock } from "lucide-react"
import { useSession } from "@/lib/session"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FlowerPlaceholder } from "@/components/ui/flower-placeholder"
import { UserMenu } from "@/components/layout/user-menu"

// Đã nối backend thật cho 3/4 khối (Job, Sản phẩm, Mức dùng — GET /jobs,
// GET /products, GET /usage/summary đều có sẵn). Khối "Hàng chờ duyệt" nay
// nối GET /vision/analyses + GET /media/optimizations (nợ #48 đã trả một
// phần — xem list-pending-analyses.ts/list-pending-optimizations.ts), hiện
// số lượng chờ duyệt thay vì chỉ báo "Sắp có".

type Job = {
  id: string
  feature: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"
  stage: string | null
  error: string | null
  product_id: string | null
}

type Product = {
  id: string
  name: string
  code: string
  category: string | null
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
}

const NHAN_TRANG_THAI_SAN_PHAM: Record<Product["status"], string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang bán",
  ARCHIVED: "Lưu trữ",
}

type UsageSummary = {
  by_feature: { feature: string; quantity: number; cost_credit: number }[]
  credit_used: number
  credit_balance: number
}

const NHAN_TINH_NANG: Record<string, string> = {
  "vision.analyze": "Phân tích ảnh",
  "media.optimize": "Tối ưu ảnh",
  "catalog.generate": "Tạo danh mục",
}

function tenTinhNang(feature: string): string {
  return NHAN_TINH_NANG[feature] ?? feature
}

async function layJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (res.status === 401) return null
  // 403 nghĩa là tổ chức không có năng lực đó (ví dụ H3/I2) — không phải
  // lỗi để hiện banner đỏ, chỉ là khối "Hàng chờ duyệt" rỗng với người này.
  if (res.status === 403) return null
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return (await res.json()) as T
}

export function AdminDashboard() {
  const router = useRouter()
  const { orgName, userInitials } = useSession()

  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [soChoDuyet, setSoChoDuyet] = useState<number | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [dangChayLai, setDangChayLai] = useState<string | null>(null)

  async function napLai() {
    try {
      const [jobsRes, productsRes, usageRes, analysesRes, optimizationsRes] = await Promise.all([
        layJson<{ data: Job[] }>("/api/v1/jobs?limit=10"),
        layJson<{ data: Product[] }>("/api/v1/products?limit=5"),
        layJson<UsageSummary>("/api/v1/usage/summary"),
        layJson<{ data: unknown[] }>("/api/v1/vision/analyses?limit=1"),
        layJson<{ data: unknown[] }>("/api/v1/media/optimizations?limit=1"),
      ])
      if (jobsRes === null || productsRes === null || usageRes === null) {
        router.push("/dang-nhap")
        return
      }
      setJobs(jobsRes.data)
      setProducts(productsRes.data)
      setUsage(usageRes)
      // Cả hai endpoint chỉ gọi để lấy SỐ LƯỢNG, không cần danh sách đầy đủ
      // ở đây — màn "Duyệt" mới là nơi hiện danh sách. Người không có H3 lẫn
      // I2 sẽ nhận 403 ở cả hai (đã lọc thành null ở `layJson`), khối này ẩn.
      if (analysesRes !== null || optimizationsRes !== null) {
        setSoChoDuyet((analysesRes?.data.length ?? 0) + (optimizationsRes?.data.length ?? 0))
      }
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không tải được dữ liệu")
    }
  }

  useEffect(() => {
    // Nợ #47 (TECHNICAL_DEBT.md) — component đầu tiên gọi API thật phía
    // client, repo chưa có SWR/TanStack Query để theo khuôn khuyến nghị.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    napLai()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function chayLai(jobId: string) {
    setDangChayLai(jobId)
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/retry`, { method: "POST" })
      if (!res.ok) throw new Error(`Chạy lại thất bại (${res.status})`)
      await napLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chạy lại thất bại")
    } finally {
      setDangChayLai(null)
    }
  }

  const dangChay = (jobs ?? []).filter((j) => j.status === "PROCESSING" || j.status === "PENDING")
  const loiJobs = (jobs ?? []).filter((j) => j.status === "FAILED")

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">Điều hành</div>
          <div className="text-[17px] font-extrabold text-primary">{orgName}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt text-text">
            <Bell size={18} strokeWidth={1.8} />
          </button>
          <UserMenu initials={userInitials} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
        {loi && (
          <div className="rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
            {loi}
          </div>
        )}

        {soChoDuyet !== null && (
          <Card
            className="flex cursor-pointer items-center justify-between gap-2 p-[18px] hover:shadow-md"
            onClick={() => router.push("/duyet")}
          >
            <div className="flex items-center gap-2 text-text-muted">
              <Clock size={16} strokeWidth={1.8} />
              <div className="text-[13.5px] font-semibold text-text">Hàng chờ duyệt</div>
            </div>
            <div className="text-[13px] font-bold text-primary">
              {soChoDuyet === 0 ? "Không có mục nào" : `${soChoDuyet} mục →`}
            </div>
          </Card>
        )}

        <Card
          className="flex cursor-pointer items-center justify-between gap-2 p-[18px] hover:shadow-md"
          onClick={() => router.push("/bo-may")}
        >
          <div className="flex items-center gap-2 text-text-muted">
            <Cpu size={16} strokeWidth={1.8} />
            <div className="text-[13.5px] font-semibold text-text">Bộ máy phân tích ảnh</div>
          </div>
          <div className="text-[13px] font-bold text-primary">Xem và đổi →</div>
        </Card>

        <Card className="flex flex-col gap-3.5 p-[18px]">
          <div className="text-[14.5px] font-bold">Job đang chạy và job lỗi</div>

          {jobs === null ? (
            <div className="py-2 text-center text-[13px] text-text-muted">Đang tải…</div>
          ) : dangChay.length === 0 && loiJobs.length === 0 ? (
            <div className="py-2 text-center text-[13px] text-text-muted">
              Không có job nào đang chạy hoặc bị lỗi.
            </div>
          ) : (
            <>
              {dangChay.map((job) => (
                <div key={job.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[13.5px] font-semibold">{tenTinhNang(job.feature)}</div>
                    <div className="text-xs font-bold text-secondary-text">
                      {job.status === "PROCESSING" ? "Đang chạy" : "Đang chờ"}
                    </div>
                  </div>
                  {job.stage && <div className="text-xs text-text-muted">{job.stage}</div>}
                </div>
              ))}

              {dangChay.length > 0 && loiJobs.length > 0 && <div className="h-px bg-border" />}

              {loiJobs.map((job) => (
                <div key={job.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-danger-bg">
                    <AlertTriangle size={17} strokeWidth={2} className="text-danger" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-semibold">{tenTinhNang(job.feature)}</div>
                    <div className="text-xs text-danger">{job.error ?? "Job thất bại"}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-surface-alt"
                    disabled={dangChayLai === job.id}
                    onClick={() => chayLai(job.id)}
                  >
                    {dangChayLai === job.id ? "Đang chạy…" : "Chạy lại"}
                  </Button>
                </div>
              ))}
            </>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-[18px]">
          <div className="text-[14.5px] font-bold">Sản phẩm mới và thay đổi gần đây</div>
          {products === null ? (
            <div className="py-2 text-center text-[13px] text-text-muted">Đang tải…</div>
          ) : products.length === 0 ? (
            <div className="py-2 text-center text-[13px] text-text-muted">Chưa có sản phẩm nào.</div>
          ) : (
            products.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-surface-alt">
                  <FlowerPlaceholder size={20} color="#5F9670" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold">{p.name}</div>
                  <div className="truncate text-xs text-text-muted">
                    {p.code}
                    {p.category ? ` · ${p.category}` : ""} · {NHAN_TRANG_THAI_SAN_PHAM[p.status]}
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-[18px]">
          <div className="text-[14.5px] font-bold">Mức dùng và hạn mức</div>
          {usage === null ? (
            <div className="py-2 text-center text-[13px] text-text-muted">Đang tải…</div>
          ) : (
            <>
              <div>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="text-text-muted">Đã dùng</span>
                  <span className="font-bold">
                    {usage.credit_used} credit · còn {usage.credit_balance} credit
                  </span>
                </div>
                <Progress
                  value={
                    usage.credit_used + usage.credit_balance > 0
                      ? (usage.credit_used / (usage.credit_used + usage.credit_balance)) * 100
                      : 0
                  }
                />
              </div>
              {usage.by_feature.length > 0 && (
                <div className="flex flex-wrap gap-5">
                  {usage.by_feature.map((f) => (
                    <div key={f.feature}>
                      <div className="text-xs text-text-muted">{tenTinhNang(f.feature)}</div>
                      <div className="text-sm font-bold">{f.cost_credit} credit</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
