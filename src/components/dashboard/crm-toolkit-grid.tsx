"use client"

import { useRouter } from "next/navigation"
import type { Route } from "next"
import { Users, MessageSquare, ShoppingBag, Gift } from "lucide-react"
import { Card } from "@/components/ui/card"

export function CrmToolkitGrid() {
  const router = useRouter()

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-title-sm font-bold">Bộ công cụ quan hệ khách hàng</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => router.push("/khach-hang" as Route)}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-body font-bold text-foreground">Hồ sơ khách hàng</div>
            <div className="text-xs text-text-muted">Quản lý danh bạ & phân tầng RFM</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/hoi-thoai" as Route)}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <MessageSquare size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-body font-bold text-foreground">Hội thoại tư vấn</div>
            <div className="text-xs text-text-muted">Chat đa kênh & hỗ trợ thông minh</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/don-hang" as Route)}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-bg text-warning">
            <ShoppingBag size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-body font-bold text-foreground">Lịch sử đơn hàng</div>
            <div className="text-xs text-text-muted">Theo dõi giá trị mua & vòng đời</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/khach-hang" as Route)}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-bg text-success">
            <Gift size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-body font-bold text-foreground">Dịp kỷ niệm & Voucher</div>
            <div className="text-xs text-text-muted">Tri ân & khuyến mãi thân thiết</div>
          </div>
        </button>
      </div>
    </Card>
  )
}
