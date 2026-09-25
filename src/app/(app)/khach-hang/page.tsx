"use client"

import React, { useState, useEffect } from "react"
import { Users, UserPlus, Sparkles, Search, Filter, Phone, Calendar, ArrowRight, ShieldCheck, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FeatureGuidanceCard } from "@/components/ui/feature-guidance-card"
import { CreateCustomerModal } from "@/components/crm/create-customer-modal"
import { CustomerDetailModal } from "@/components/crm/customer-detail-modal"
import type { CustomerMasterIndex, OccasionReminder } from "@/modules/crm/domain/customer-master-index"

export default function CRMPage() {
  const [customers, setCustomers] = useState<CustomerMasterIndex[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState<string>("")

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  // Reminders drawer
  const [reminders, setReminders] = useState<OccasionReminder[]>([])
  const [showReminders, setShowReminders] = useState(false)
  const [scanningReminders, setScanningReminders] = useState(false)

  function loadCustomers() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search.trim()) params.set("search", search.trim())
    if (tierFilter) params.set("tier", tierFilter)

    fetch(`/api/v1/crm/customers?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        setCustomers(res.items ?? [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu từ API khi mount/đổi tham số; setState nằm trong hàm tải (nợ #149)
    loadCustomers()
  }, [tierFilter])

  async function handleScanReminders() {
    setScanningReminders(true)
    try {
      const res = await fetch("/api/v1/crm/reminders/upcoming?days=14").then((r) => r.json())
      setReminders(res.items ?? [])
      setShowReminders(true)
    } finally {
      setScanningReminders(false)
    }
  }

  const tierColors: Record<string, "danger" | "warning" | "neutral" | "success" | "accent"> = {
    VIP: "danger",
    GOLD: "warning",
    SILVER: "accent",
    BRONZE: "neutral",
    NEW: "neutral",
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. Header chuẩn có Top-Right Action Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-bold text-primary">
              M09 CRM
            </span>
            <h1 className="text-xl font-extrabold text-foreground">CRM & Quản Lý Khách Hàng Ngành Hoa</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hồ sơ khách hàng hợp nhất (Customer Master Index) · Phân tầng RFM tự động · Nhắc hẹn ngày kỷ niệm
          </p>
        </div>

        {/* Top-Right Action Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanReminders}
            disabled={scanningReminders}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Sparkles className="mr-1.5 h-4 w-4 text-red-600" />
            {scanningReminders ? "Đang quét..." : "⚡ Quét dịp sắp tới (14 ngày)"}
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            <UserPlus className="mr-1.5 h-4 w-4" /> Thêm khách hàng
          </Button>
        </div>
      </header>

      {/* 2. Main content */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Khối hướng dẫn SSOT FeatureGuidanceCard */}
        <FeatureGuidanceCard
          badgeLabel="HƯỚNG DẪN CRM & KHÁCH HÀNG M09"
          badgeIcon={Users}
          title="Quy trình Quản lý Khách hàng & Tiếp thị Chăm sóc Chuẩn SSOT"
          description="Lưu trữ hồ sơ khách hàng toàn diện từ lịch sử đơn hàng M10, tự động phân hạng RFM (VIP/Vàng/Bạc/Đồng) và bảo vệ tuyệt đối quyền riêng tư khi gửi tin tiếp thị (Consent Engine)."
          tips={[
            { icon: "💎", text: "Phân tầng tự động: Dựa trên tổng chi tiêu và số đơn hàng thật từ M10" },
            { icon: "🎂", text: "Lưu ngày kỷ niệm: Nhắc trước 7-14 ngày để tư vấn mẫu hoa và lời nhắn thiệp" },
            { icon: "🛡️", text: "Bảo vệ Consent: Chỉ gửi tin nhắn qua Zalo/SMS khi khách đã đồng ý" },
            { icon: "⚡", text: "Master Index: Đồng bộ gu màu và hoa ưa thích từ M01 Vision sang màn hình bán hàng" },
          ]}
        />

        {/* Reminders Banner (nếu mở) */}
        {showReminders && (
          <div className="rounded-xl border border-red-300 bg-red-50/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-red-950 flex items-center gap-2">
                <Gift className="h-4 w-4 text-red-600" />
                Danh sách {reminders.length} dịp kỷ niệm sắp tới (trong 14 ngày tới)
              </span>
              <button
                onClick={() => setShowReminders(false)}
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                Đóng danh sách
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reminders.map((r, idx) => (
                <div key={idx} className="rounded-lg border border-red-200 bg-white p-3 space-y-1 text-xs shadow-xs">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>{r.customerName}</span>
                    <span className="text-red-600 font-extrabold">{r.daysLeft === 0 ? "Hôm nay!" : `Còn ${r.daysLeft} ngày`}</span>
                  </div>
                  <div className="text-text-muted">Dịp: <span className="font-semibold text-text-main">{r.occasionName}</span> ({r.targetDate})</div>
                  <div className="text-text-muted">Gợi ý hoa: <span className="font-semibold text-red-700">{r.suggestedFlower}</span></div>
                  <div className="text-text-muted">SĐT: {r.customerPhone}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thanh công cụ tìm kiếm & lọc */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              loadCustomers()
            }}
            className="flex items-center gap-2 flex-1 max-w-md"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm theo tên, số điện thoại hoặc mã KH..."
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Tìm kiếm
            </Button>
          </form>

          {/* Bộ lọc phân tầng RFM */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-muted-foreground mr-1">Phân tầng:</span>
            {["", "VIP", "GOLD", "SILVER", "BRONZE", "NEW"].map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  tierFilter === t
                    ? "bg-red-600 text-white font-bold"
                    : "bg-surface-raised border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "" ? "Tất cả" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Bảng danh sách khách hàng */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-raised font-bold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Mã KH</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Phân hạng</th>
                <th className="px-4 py-3">Tổng chi tiêu</th>
                <th className="px-4 py-3">Số đơn</th>
                <th className="px-4 py-3">Dịp kỷ niệm</th>
                <th className="px-4 py-3">Gu hoa ưa thích</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Đang tải dữ liệu khách hàng...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Chưa có khách hàng nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{c.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tierColors[c.metrics?.tier] ?? "neutral"} className="font-bold">
                        {c.metrics?.tier}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600">
                      {Number(c.metrics?.totalSpentVnd ?? 0).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{c.metrics?.orderCount ?? 0} đơn</td>
                    <td className="px-4 py-3">
                      {c.occasions?.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-primary font-medium">
                          <Calendar className="h-3 w-3" /> {c.occasions[0]?.name} ({c.occasions[0]?.date})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.preferences?.preferredFlowers?.slice(0, 2).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCustomerId(c.id)}
                        className="text-xs font-semibold"
                      >
                        Hồ sơ Master <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modals */}
      <CreateCustomerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadCustomers}
      />

      <CustomerDetailModal
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        onUpdated={loadCustomers}
      />
    </div>
  )
}
