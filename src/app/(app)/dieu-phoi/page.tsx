"use client"

import React from "react"
import { Radio, RefreshCw, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ControlTowerDashboard } from "@/components/coordinator/control-tower-dashboard"
import { UserMenu } from "@/components/layout/user-menu"
import { useSession } from "@/lib/session"

export default function DieuPhoiPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  // Vai Điều phối vào thẳng tuyến này từ "/" (đặc tả 03b §4.4) → màn cần có
  // menu tài khoản (vai trò, đăng xuất) như trang chủ các vai khác.
  const { userInitials } = useSession()

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header with Standardized Tab Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-danger/15 text-danger flex items-center justify-center shrink-0">
            <Radio size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-text">Điều Phối Đơn Hàng</h1>
              <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning text-caption font-bold">
                Đang triển khai
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Tháp Vận Hành Control Tower · Kết nối Đối tác Xưởng Ngoài & AI Vision QC
            </p>
          </div>
        </div>

        {/* Standardized Top-Right Action Header */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw size={13} />
            <span>Làm mới</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white text-xs gap-1.5 h-9 font-bold shadow-sm"
          >
            <Plus size={14} />
            <span>Tiếp nhận đơn mới</span>
          </Button>
          <UserMenu initials={userInitials} />
        </div>
      </div>

      {/* Main Control Tower Dashboard */}
      <ControlTowerDashboard
        isCreateModalOpen={isCreateOpen}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onCloseCreateModal={() => setIsCreateOpen(false)}
      />
    </div>
  )
}
