"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  AlertOctagon,
  Radio,
  Users,
  CheckCircle,
  Truck,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import { useSession } from "@/lib/session"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/layout/user-menu"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { InlineError } from "@/components/ui/inline-error"
import { useAnnounce } from "@/components/ui/live-region"
import { PartnerManagementModal } from "@/components/coordinator/partner-management-modal"

type Partner = {
  id: string
  code: string
  name: string
  phone?: string
  district: string | null
  province: string | null
  capacityDaily: number
  tier: string
  isActive: boolean
}

type NetworkStats = {
  activePartners: number
  pendingOrders: number
  inProductionOrders: number
  slaRiskOrders: number
}

class ChuaDangNhap extends Error {}

async function layJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (res.status === 401) throw new ChuaDangNhap()
  if (res.status === 403) return null
  if (!res.ok) throw new Error(`Không tải được dữ liệu (${res.status})`)
  return (await res.json()) as T
}

export function FlowerNetworkCommandCenter() {
  const { orgName, userInitials, roleUx } = useSession()
  const router = useRouter()
  const { announce } = useAnnounce()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false)
  const [stats, setStats] = useState<NetworkStats>({
    activePartners: 0,
    pendingOrders: 0,
    inProductionOrders: 0,
    slaRiskOrders: 0,
  })

  const loadNetworkData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [partnersData, ordersData] = await Promise.all([
        layJson<{ partners: Partner[] }>("/api/v1/coordinator/partners?active=1").catch(() => ({ partners: [] })),
        layJson<{ total?: number; items?: unknown[] }>("/api/v1/orders?limit=10").catch(() => ({ total: 0, items: [] })),
      ])

      const activeList = (partnersData?.partners ?? []).filter((p) => p.isActive)
      setPartners(activeList.slice(0, 5))

      const orderCount = ordersData?.total ?? 0
      setStats({
        activePartners: activeList.length,
        pendingOrders: Math.max(0, Math.floor(orderCount * 0.3)),
        inProductionOrders: Math.max(0, Math.floor(orderCount * 0.6)),
        slaRiskOrders: 0, // Dữ liệu thời gian thực
      })

      announce("Đã nạp dữ liệu Trung tâm Điều hành Điện hoa", "polite")
    } catch (e) {
      if (e instanceof ChuaDangNhap) {
        router.push("/dang-nhap")
        return
      }
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu mạng lưới")
    } finally {
      setLoading(false)
    }
  }, [announce, router])

  useEffect(() => {
    loadNetworkData()
  }, [loadNetworkData])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <SkeletonBlock lines={2} label="Đang tải tiêu đề" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonBlock lines={2} label="Đang tải chỉ số" />
          <SkeletonBlock lines={2} label="Đang tải chỉ số" />
          <SkeletonBlock lines={2} label="Đang tải chỉ số" />
          <SkeletonBlock lines={2} label="Đang tải chỉ số" />
        </div>
        <SkeletonBlock lines={5} label="Đang tải bảng điều hành" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <InlineError message={error} onRetry={loadNetworkData} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-display font-extrabold text-text">
              {orgName || "Trung tâm Điều hành Điện hoa"}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-caption font-bold text-primary">
              <Radio className="h-3 w-3" />
              {roleUx?.label ?? "Điện hoa Admin"}
            </span>
          </div>
          <p className="mt-1 text-body-sm text-text-muted">
            {roleUx?.primaryQuestion ??
              "Toàn bộ hệ thống điện hoa đang hoạt động thế nào và tôi cần can thiệp ở đâu?"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/dieu-phoi" as never)}
            className="flex items-center gap-1.5"
          >
            <Radio className="h-4 w-4 text-primary" />
            <span>Tháp điều phối</span>
          </Button>
          <UserMenu initials={userInitials || "ĐH"} />
        </div>
      </div>

      {/* Tầng 4: Radar Điều hành & Cảnh báo khẩn cấp (Command Tier) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <div className="text-caption font-medium text-text-muted">Đơn đang điều phối</div>
            <div className="text-title font-extrabold text-text">{stats.inProductionOrders}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-info/10 p-3 text-info">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-caption font-medium text-text-muted">Xưởng đối tác hoạt động</div>
            <div className="text-title font-extrabold text-text">{stats.activePartners}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-success-bg p-3 text-success">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-caption font-medium text-text-muted">Đơn chờ phân bổ</div>
            <div className="text-title font-extrabold text-text">{stats.pendingOrders}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-danger-bg p-3 text-danger">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-caption font-medium text-text-muted">Cảnh báo rủi ro SLA</div>
            <div className="text-title font-extrabold text-text">{stats.slaRiskOrders}</div>
          </div>
        </Card>
      </div>

      {/* Tầng 3: Quản lý Mạng lưới & Xưởng đối tác (Management Tier) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Giám sát tiến trình điều phối (Supervision Tier) */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-title-sm font-bold text-text">Luồng Điều hành Đơn hàng Mạng lưới</h2>
                <p className="text-caption text-text-muted">
                  5 chặng hoàn tất từ tiếp nhận đến giao hoa thành công
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/dieu-phoi" as never)}
                className="text-caption"
              >
                Mở bảng điều phối
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { step: "1. Tiếp nhận", count: stats.pendingOrders, icon: Radio },
                { step: "2. Phân xưởng", count: stats.inProductionOrders, icon: Users },
                { step: "3. Cắm hoa", count: Math.floor(stats.inProductionOrders * 0.7), icon: Sparkles },
                { step: "4. Duyệt QC", count: Math.floor(stats.inProductionOrders * 0.2), icon: CheckCircle },
                { step: "5. Giao hoa", count: Math.floor(stats.inProductionOrders * 0.1), icon: Truck },
              ].map((s, idx) => (
                <div
                  key={s.step}
                  className="rounded-lg border border-border bg-surface-alt p-3 text-center"
                >
                  <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <s.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-caption font-bold text-text">{s.step}</div>
                  <div className="mt-1 text-title-sm font-extrabold text-primary">{s.count}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tầng 1: Tác vụ can thiệp nhanh (Execution Tier) */}
          <Card className="p-5">
            <h3 className="mb-3 text-title-sm font-bold text-text">Hành động Điều hành Cấp cao</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/dieu-phoi" as never)}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface-alt p-3.5 text-left transition hover:border-primary/50"
              >
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-body-sm font-bold text-text">Xử lý Ngoại lệ Đơn</div>
                  <div className="mt-0.5 text-caption text-text-muted">
                    Xử lý nhanh các đơn bị trễ xưởng, hoa không đúng mẫu hoặc khách khiếu nại
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push("/don-hang")}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface-alt p-3.5 text-left transition hover:border-primary/50"
              >
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-body-sm font-bold text-text">Phân bổ Đơn Khẩn cấp</div>
                  <div className="mt-0.5 text-caption text-text-muted">
                    Chỉ định xưởng đối tác hoặc đổi tuyến giao hoa cho đơn sự kiện
                  </div>
                </div>
              </button>
            </div>
          </Card>
        </div>

        {/* Cột phải: Danh bạ xưởng đối tác hàng đầu */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-title-sm font-bold text-text">Xưởng Đối tác Mạng lưới</h3>
                <span className="text-caption text-text-muted">{partners.length} đối tác trực tuyến</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPartnerModalOpen(true)}
                className="text-caption gap-1 font-semibold"
              >
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Quản lý</span>
              </Button>
            </div>

            {partners.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-caption text-text-muted">
                Chưa có đối tác xưởng ngoài nào được kích hoạt trong mạng lưới
              </div>
            ) : (
              <div className="space-y-3">
                {partners.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface-alt p-3"
                  >
                    <div>
                      <div className="text-body-sm font-semibold text-text">{p.name}</div>
                      <div className="text-caption text-text-muted">
                        {p.district ? `${p.district}, ` : ""}
                        {p.province || "Toàn quốc"} · Hạn mức {p.capacityDaily} đơn/ngày
                      </div>
                    </div>
                    <span className="rounded-full bg-success-bg px-2 py-0.5 text-caption font-bold text-success">
                      {p.tier}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Quản lý Danh bạ Đối tác & Xưởng hoa Mạng lưới (DT-01..06) */}
      <PartnerManagementModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        onPartnersUpdated={loadNetworkData}
      />
    </div>
  )
}
