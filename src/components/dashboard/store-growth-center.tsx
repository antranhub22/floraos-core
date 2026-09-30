"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Cpu, TrendingUp, Sparkles, ShoppingBag, ArrowRight } from "lucide-react"
import { useSession } from "@/lib/session"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { UserMenu } from "@/components/layout/user-menu"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { InlineError } from "@/components/ui/inline-error"
import { useAnnounce } from "@/components/ui/live-region"
import { tenTinhNang } from "@/lib/feature-labels"
import { StoreManagerActionItemsCard, type DraftOrder } from "./store-manager-action-items-card"

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

class ChuaDangNhap extends Error {}

async function layJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (res.status === 401) throw new ChuaDangNhap()
  if (res.status === 403) return null
  if (!res.ok) throw new Error(`Không tải được dữ liệu (${res.status})`)
  return (await res.json()) as T
}

export function StoreGrowthCenter() {
  const { orgName, userInitials, roleUx } = useSession()
  const router = useRouter()
  const { announce } = useAnnounce()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [actionCount, setActionCount] = useState<number | null>(null)
  const [failedJobs, setFailedJobs] = useState<Job[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<number>(0)
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dsJobs, dsSanPham, mucDung, dsDonHang] = await Promise.all([
        layJson<Job[]>("/api/v1/jobs").catch(() => [] as Job[]),
        layJson<Product[]>("/api/v1/products?limit=5").catch(() => [] as Product[]),
        layJson<UsageSummary>("/api/v1/usage/summary").catch(() => null),
        layJson<{ items: DraftOrder[] }>("/api/v1/orders?status=DRAFT&limit=5").catch(() => ({ items: [] })),
      ])

      const validJobs = dsJobs ?? []
      setJobs(validJobs)
      setProducts(dsSanPham ?? [])
      setUsage(mucDung)

      const fJobs = validJobs.filter((j) => j.status === "FAILED")
      setFailedJobs(fJobs)

      const pApprovals = validJobs.filter(
        (j) => j.status === "COMPLETED" && j.stage === "NEEDS_APPROVAL"
      ).length
      setPendingApprovals(pApprovals)

      const dOrders = dsDonHang?.items ?? []
      setDraftOrders(dOrders)

      const totalActions = fJobs.length + pApprovals + dOrders.length
      setActionCount(totalActions)

      if (totalActions > 0) {
        announce(`Cửa hàng có ${totalActions} mục cần can thiệp để thúc đẩy tăng trưởng`, "polite")
      }
    } catch (e) {
      if (e instanceof ChuaDangNhap) {
        router.push("/dang-nhap")
        return
      }
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu vận hành")
    } finally {
      setLoading(false)
    }
  }, [announce, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <SkeletonBlock lines={2} label="Đang tải tiêu đề" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SkeletonBlock lines={4} label="Đang tải can thiệp" />
          </div>
          <div className="space-y-6">
            <SkeletonBlock lines={3} label="Đang tải sản phẩm" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <InlineError message={error} onRetry={loadData} />
      </div>
    )
  }

  const runningJobs = jobs.filter((j) => j.status === "PROCESSING" || j.status === "PENDING")
  const tongCredit = (usage?.credit_used ?? 0) + (usage?.credit_balance ?? 0)
  const phanTramCredit = tongCredit > 0 ? Math.round(((usage?.credit_used ?? 0) / tongCredit) * 100) : 0

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-display font-extrabold text-text">
              {orgName || "Trung tâm Tăng trưởng Cửa hàng"}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-caption font-bold text-primary">
              <Sparkles className="h-3 w-3" />
              {roleUx?.label ?? "Quản trị cửa hàng"}
            </span>
          </div>
          <p className="mt-1 text-body-sm text-text-muted">
            {roleUx?.primaryQuestion ?? "Hôm nay tôi cần làm gì để cửa hàng phát triển?"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/market-intelligence" as never)}
            className="flex items-center gap-1.5"
          >
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>Xu hướng thị trường</span>
          </Button>
          <UserMenu initials={userInitials || "CH"} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cột trái: Tác vụ can thiệp & Đòn bẩy Tăng trưởng */}
        <div className="space-y-6 lg:col-span-2">
          {/* Khối P0: Việc cần can thiệp */}
          <StoreManagerActionItemsCard
            daTai={!loading}
            tongCanThiep={actionCount ?? 0}
            loiJobsCount={failedJobs.length}
            soChoDuyet={pendingApprovals}
            soDonNhap={draftOrders.length}
            draftOrders={draftOrders}
            onScrollToJobs={() => {}}
          />

          {/* Khối Lối tắt Tăng trưởng nhanh */}
          <Card className="p-5">
            <h2 className="mb-4 text-title-sm font-bold text-text">Đòn bẩy Tăng trưởng Doanh số</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/market-intelligence" as never)}
                className="flex items-start gap-3.5 rounded-lg border border-border bg-surface-alt p-4 text-left transition hover:border-primary/50"
              >
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-body-sm font-bold text-text">Nghiên cứu Thị trường</div>
                  <div className="mt-0.5 text-caption text-text-muted">
                    Bắt trend hoa hot, cơ hội nội dung & mẫu video tuần này
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push("/creative-studio" as never)}
                className="flex items-start gap-3.5 rounded-lg border border-border bg-surface-alt p-4 text-left transition hover:border-primary/50"
              >
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-body-sm font-bold text-text">Creative Studio AI</div>
                  <div className="mt-0.5 text-caption text-text-muted">
                    Biến ảnh thô thành bộ ảnh marketing & video triệu view
                  </div>
                </div>
              </button>
            </div>
          </Card>

          {/* Tiến độ Job nền */}
          {runningJobs.length > 0 && (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-body-sm font-bold text-text">Tiến trình AI đang thực hiện</h3>
                <span className="text-caption text-text-muted">{runningJobs.length} tiến trình</span>
              </div>
              <div className="space-y-2">
                {runningJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface-alt px-3 py-2 text-caption"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="font-semibold text-text">{tenTinhNang(job.feature)}</span>
                    </div>
                    <span className="text-text-muted">{job.stage || "Đang xử lý..."}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Cột phải: Sản phẩm & Hạn mức Credit */}
        <div className="space-y-6">
          {/* Sản phẩm mới */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-title-sm font-bold text-text">Sản phẩm Cửa hàng</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/san-pham" as never)}
                className="text-caption"
              >
                Xem tất cả
              </Button>
            </div>

            {products.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Chưa có sản phẩm"
                reason="Tải ảnh mẫu hoa đầu tiên để bắt đầu bán hàng"
                action={{
                  label: "Tải ảnh ngay",
                  onClick: () => router.push("/tai-anh" as never),
                }}
              />
            ) : (
              <div className="space-y-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface-alt p-2.5"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="truncate text-body-sm font-semibold text-text">{p.name}</div>
                      <div className="text-caption text-text-muted">{p.code}</div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-caption font-medium ${
                        p.status === "ACTIVE"
                          ? "bg-success-bg text-success"
                          : "bg-surface text-text-muted"
                      }`}
                    >
                      {NHAN_TRANG_THAI_SAN_PHAM[p.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Hạn mức Credit AI */}
          {usage && (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-title-sm font-bold text-text">Hạn mức AI Tiệm</h3>
                <span className="text-caption text-text-muted">
                  {usage.credit_used} / {tongCredit} Credit
                </span>
              </div>
              <Progress value={phanTramCredit} className="h-2" />
              <div className="mt-4 space-y-2 text-caption">
                {usage.by_feature.slice(0, 3).map((f) => (
                  <div key={f.feature} className="flex justify-between text-text-muted">
                    <span>{tenTinhNang(f.feature)}</span>
                    <span className="font-medium text-text">{f.cost_credit} cr</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

/** Hỗ trợ tương thích ngược với import cũ */
export const StoreManagerDashboard = StoreGrowthCenter
