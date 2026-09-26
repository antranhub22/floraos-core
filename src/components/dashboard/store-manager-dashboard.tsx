"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, ChevronRight, Clock, Cpu, ShoppingBag, TrendingUp } from "lucide-react"
import { useSession } from "@/lib/session"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FlowerPlaceholder } from "@/components/ui/flower-placeholder"
import { UserMenu } from "@/components/layout/user-menu"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { InlineError } from "@/components/ui/inline-error"
import { useAnnounce } from "@/components/ui/live-region"
import { tenTinhNang } from "@/lib/feature-labels"

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

type DraftOrder = {
  id: string
  code?: string
  order_number?: string
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

class ChuaDangNhap extends Error {}

async function layJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (res.status === 401) throw new ChuaDangNhap()
  if (res.status === 403) return null
  if (!res.ok) throw new Error(`Không tải được dữ liệu (${res.status})`)
  return (await res.json()) as T
}

function DongCanThiep({
  icon: Icon,
  nhan,
  giaTri,
  onClick,
  nguyCap,
}: {
  icon: typeof Clock
  nhan: string
  giaTri: string
  onClick: () => void
  nguyCap?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-1 text-left hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span className="flex items-center gap-2.5">
        <Icon size={17} strokeWidth={1.9} className={nguyCap ? "text-danger" : "text-text-muted"} />
        <span className="text-body font-semibold text-text">{nhan}</span>
      </span>
      <span className="flex items-center gap-1 text-body-sm font-bold text-primary">
        {giaTri}
        <ChevronRight size={15} aria-hidden="true" />
      </span>
    </button>
  )
}

export function StoreManagerDashboard() {
  const router = useRouter()
  const { orgName, userInitials, roleUx } = useSession()
  const { announce } = useAnnounce()

  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [soChoDuyet, setSoChoDuyet] = useState<number | null>(null)
  const [soDonNhap, setSoDonNhap] = useState<number | null>(null)
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([])
  const [daTai, setDaTai] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [dangChayLai, setDangChayLai] = useState<string | null>(null)

  async function napLai() {
    setLoi(null)
    try {
      const [jobsRes, productsRes, usageRes, analysesRes, optimizationsRes, draftOrdersRes] =
        await Promise.all([
          layJson<{ data: Job[] }>("/api/v1/jobs?limit=10"),
          layJson<{ data: Product[] }>("/api/v1/products?limit=5"),
          layJson<UsageSummary>("/api/v1/usage/summary"),
          layJson<{ data: unknown[] }>("/api/v1/vision/analyses?limit=1"),
          layJson<{ data: unknown[] }>("/api/v1/media/optimizations?limit=1"),
          layJson<{ orders: DraftOrder[]; total: number }>("/api/v1/orders?status=DRAFT&limit=10"),
        ])
      setJobs(jobsRes?.data ?? null)
      setProducts(productsRes?.data ?? null)
      setUsage(usageRes)
      setSoChoDuyet(
        analysesRes !== null || optimizationsRes !== null
          ? (analysesRes?.data.length ?? 0) + (optimizationsRes?.data.length ?? 0)
          : null
      )
      setSoDonNhap(draftOrdersRes ? draftOrdersRes.total : null)
      setDraftOrders(draftOrdersRes?.orders ?? [])
    } catch (e) {
      if (e instanceof ChuaDangNhap) {
        router.push("/dang-nhap" as never)
        return
      }
      setLoi(e instanceof Error ? e.message : "Không tải được dữ liệu")
    } finally {
      setDaTai(true)
    }
  }

  useEffect(() => {
    napLai()
  }, [])

  async function chayLai(jobId: string) {
    setDangChayLai(jobId)
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/retry`, { method: "POST" })
      if (!res.ok) throw new Error(`Chưa chạy lại được job (${res.status}). Thử lại sau ít phút.`)
      announce("Đã gửi chạy lại job")
      await napLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa chạy lại được job")
    } finally {
      setDangChayLai(null)
    }
  }

  function scrollToJobCard() {
    const el = document.getElementById("khoi-job")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
      el.focus()
    }
  }

  const dangChay = (jobs ?? []).filter((j) => j.status === "PROCESSING" || j.status === "PENDING")
  const loiJobs = (jobs ?? []).filter((j) => j.status === "FAILED")
  const tongCanThiep = loiJobs.length + (soChoDuyet ?? 0) + (soDonNhap ?? 0)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-4">
        <div>
          <div className="text-xs text-text-muted">{roleUx?.label ?? "Điều hành"}</div>
          <h1 className="text-title font-extrabold text-primary">{orgName}</h1>
        </div>
        <UserMenu initials={userInitials} />
      </header>

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:grid lg:grid-cols-3 lg:items-start lg:gap-5">
        {loi && (
          <div className="lg:col-span-3">
            <InlineError message={loi} onRetry={napLai} />
          </div>
        )}

        {/* Cột chính bên trái: P0 & Khối Vận hành (chiếm 2/3 trên 1280px) */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* P0 — Cần can thiệp */}
          <Card className="flex flex-col gap-2 p-4">
            <h2 className="text-title-sm font-bold">
              {daTai && tongCanThiep === 0 ? "Không có việc cần can thiệp" : "Cần can thiệp"}
            </h2>
            {!daTai ? (
              <SkeletonBlock lines={3} />
            ) : (
              <>
                {loiJobs.length > 0 && (
                  <DongCanThiep
                    icon={AlertTriangle}
                    nhan="Job lỗi"
                    giaTri={`${loiJobs.length}`}
                    nguyCap
                    onClick={scrollToJobCard}
                  />
                )}
                {soChoDuyet !== null && soChoDuyet > 0 && (
                  <DongCanThiep icon={Clock} nhan="Kết quả chờ duyệt" giaTri={`${soChoDuyet}`} onClick={() => router.push("/duyet" as never)} />
                )}
                {soDonNhap !== null && soDonNhap > 0 && (
                  <div className="space-y-1.5">
                    <DongCanThiep icon={ShoppingBag} nhan="Đơn nháp chưa chốt" giaTri={`${soDonNhap}`} onClick={() => router.push("/don-hang" as never)} />
                    {draftOrders.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-7 pb-1">
                        {draftOrders.slice(0, 3).map((d) => (
                          <span key={d.id} className="rounded-md bg-surface-alt px-2 py-0.5 text-caption font-semibold text-text-muted">
                            #{d.order_number ?? d.code ?? d.id.slice(0, 8)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {tongCanThiep === 0 && (
                  <p className="text-body-sm text-text-muted">Job, hàng chờ duyệt và đơn nháp đều đã được xử lý.</p>
                )}
              </>
            )}
          </Card>

          {/* P1 — Job đang chạy và job lỗi */}
          <Card id="khoi-job" tabIndex={-1} className="flex flex-col gap-3.5 p-4 focus:outline-none focus:ring-2 focus:ring-primary/40">
            <h2 className="text-title-sm font-bold">Job đang chạy và job lỗi</h2>
            {!daTai ? (
              <SkeletonBlock lines={2} />
            ) : jobs === null ? (
              <p className="text-body-sm text-text-muted">Bạn không có quyền xem job.</p>
            ) : dangChay.length === 0 && loiJobs.length === 0 ? (
              <p className="text-body-sm text-text-muted">Không có job nào đang chạy hoặc bị lỗi.</p>
            ) : (
              <>
                {loiJobs.map((job) => (
                  <div key={job.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-danger-bg">
                      <AlertTriangle size={17} strokeWidth={2} className="text-danger" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-body font-semibold">{tenTinhNang(job.feature)}</div>
                      <div className="truncate text-xs text-danger">{job.error ?? "Job thất bại"}</div>
                    </div>
                    <Button size="sm" disabled={dangChayLai === job.id} onClick={() => chayLai(job.id)}>
                      {dangChayLai === job.id ? "Đang chạy lại…" : "Chạy lại job"}
                    </Button>
                  </div>
                ))}

                {dangChay.length > 0 && loiJobs.length > 0 && <div className="h-px bg-border" />}

                {dangChay.map((job) => (
                  <div key={job.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="text-body font-semibold">{tenTinhNang(job.feature)}</div>
                      <div className="text-xs font-bold text-secondary-text">
                        {job.status === "PROCESSING" ? "Đang chạy" : "Đang chờ"}
                      </div>
                    </div>
                    {job.stage && <div className="text-xs text-text-muted">{job.stage}</div>}
                  </div>
                ))}
              </>
            )}
          </Card>

          {/* P2 — Lối tắt */}
          <nav aria-label="Lối tắt" className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/market-intelligence" as never)}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-body-sm font-semibold hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-primary"
            >
              <TrendingUp size={16} className="text-text-muted" aria-hidden="true" />
              Nghiên cứu thị trường
            </button>
            <button
              type="button"
              onClick={() => router.push("/bo-may" as never)}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-body-sm font-semibold hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Cpu size={16} className="text-text-muted" aria-hidden="true" />
              Bộ máy phân tích ảnh
            </button>
          </nav>
        </div>

        {/* Cột phụ bên phải: Sản phẩm & Mức dùng (1/3 trên 1280px) */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* P1 — Sản phẩm */}
          {(!daTai || products !== null) && (
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-title-sm font-bold">Sản phẩm mới</h2>
                <button
                  type="button"
                  onClick={() => router.push("/san-pham" as never)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Xem tất cả →
                </button>
              </div>
              {!daTai || products === null ? (
                <SkeletonBlock lines={3} />
              ) : products.length === 0 ? (
                <EmptyState
                  title="Chưa có sản phẩm nào"
                  reason="Thêm sản phẩm đầu tiên để bắt đầu quản lý danh mục và giá."
                  action={{ label: "Thêm sản phẩm", onClick: () => router.push("/them" as never) }}
                />
              ) : (
                products.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-surface-alt">
                      <FlowerPlaceholder size={20} className="text-secondary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body font-semibold">{p.name}</div>
                      <div className="truncate text-xs text-text-muted">
                        {p.code}
                        {p.category ? ` · ${p.category}` : ""} · {NHAN_TRANG_THAI_SAN_PHAM[p.status]}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Card>
          )}

          {/* P1 — Mức dùng */}
          {(!daTai || usage !== null) && (
            <Card className="flex flex-col gap-3 p-4">
              <h2 className="text-title-sm font-bold">Mức dùng và hạn mức</h2>
              {!daTai || usage === null ? (
                <SkeletonBlock lines={2} />
              ) : (
                <>
                  <div>
                    <div className="mb-1.5 flex justify-between text-body-sm">
                      <span className="text-text-muted">Đã dùng</span>
                      <span className="font-bold">
                        {usage.credit_used} · còn {usage.credit_balance} credit
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
                    <div className="flex flex-wrap gap-4">
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
          )}
        </div>
      </main>
    </div>
  )
}
