"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import type { Route } from "next"
import {
  Users,
  UserPlus,
  ArrowLeft,
  UserCheck,
  Clock,
  Building,
  Search,
  Shield,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { useSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"
import { type RoleOption, type BranchOption } from "./_components/invite-member-dialog"
import { AddStaffDialog } from "./_components/add-staff-dialog"
import { ChangeRoleDialog } from "./_components/change-role-dialog"
import { MemberTable, type MemberListItem } from "./_components/member-table"

export default function QuanLyThanhVienPage() {
  const { can } = useSession()
  // PO 08/10/2026: Điều hành tạo tài khoản dùng được ngay (A3) thay cho lời mời chưa có bước nhận
  const canInvite = can("A3")
  const canRemove = can("F4")
  const canManageRole = can("F5")

  const [members, setMembers] = useState<MemberListItem[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [changeRoleTarget, setChangeRoleTarget] = useState<{
    id: string
    name: string | null
    email: string
    roleId: string | null
    roleName: string | null
  } | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [membersRes, rolesRes, branchesRes, meRes] = await Promise.all([
        fetch("/api/v1/members"),
        fetch("/api/v1/roles"),
        fetch("/api/v1/branches").catch(() => null),
        fetch("/api/v1/auth/me").catch(() => null),
      ])
      // Ẩn "Đặt lại mật khẩu / Tạm khoá" trên chính dòng của mình (máy chủ cũng chặn)
      if (meRes?.ok) setCurrentUserId(((await meRes.json()) as { user?: { id?: string } }).user?.id ?? null)

      if (!membersRes.ok) throw new Error("Không thể tải danh sách thành viên.")
      const membersData = await membersRes.json()
      setMembers(membersData.data || [])

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setRoles(rolesData.data || [])
      }

      if (branchesRes && branchesRes.ok) {
        const branchesData = await branchesRes.json()
        setBranches(branchesData.data || [])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const branchMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of branches) {
      map.set(b.id, b.name)
    }
    return map
  }, [branches])

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return members
    return members.filter(
      (m) =>
        m.user.email.toLowerCase().includes(q) ||
        (m.user.name && m.user.name.toLowerCase().includes(q)) ||
        (m.role && m.role.name.toLowerCase().includes(q))
    )
  }, [members, searchQuery])

  const activeCount = members.filter((m) => m.status === "ACTIVE").length
  const pendingCount = members.filter((m) => m.status === "INVITED").length

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      {/* 1. Header tác vụ chuẩn hóa */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={"/cai-dat" as Route}
            aria-label="Quay lại Cài đặt"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-title font-extrabold text-text flex items-center gap-2">
              <Users size={24} className="text-primary" />
              <span>Đội Ngũ & Phân Quyền</span>
            </h1>
            <p className="text-caption text-text-muted">
              Quản lý tài khoản nhân viên, phân bổ vai trò và chi nhánh hoạt động.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchData()}
            disabled={loading}
            aria-label="Tải lại danh sách"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </Button>

          {canInvite && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus size={16} />
              <span>Thêm nhân viên</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Hướng dẫn K1 */}
      <FeatureGuidanceCard
        badgeLabel="HƯỚNG DẪN QUẢN TRỊ NHÂN SỰ"
        badgeIcon={Shield}
        title="Nguyên Tắc Phân Quyền & Quản Lý Thành Viên Tiệm"
        titleIcon={Users}
        description="Điều hành tạo tài khoản cho từng nhân viên (mỗi người một tài khoản), gán vai trò, đặt lại mật khẩu hoặc tạm khoá khi cần."
        tips={[
          "⚡ Tài khoản mới dùng được ngay bằng mật khẩu tạm — nhắc nhân viên tự đổi mật khẩu sau lần vào đầu",
          "🔒 Quyền hạn được kiểm tra bảo mật ở cả giao diện lẫn máy chủ",
          "🏢 Với chuỗi tiệm, chọn chi nhánh để nhân viên chỉ thấy dữ liệu cửa hàng của họ",
        ]}
      />

      {/* 3. Thống kê */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-border bg-surface flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-caption text-text-muted">Tổng nhân sự</div>
            <div className="text-title-sm font-extrabold text-text">{members.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-success-bg text-primary flex items-center justify-center flex-shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <div className="text-caption text-text-muted">Đang hoạt động</div>
            <div className="text-title-sm font-extrabold text-text">{activeCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-warning-bg text-warning flex items-center justify-center flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-caption text-text-muted">Chờ kích hoạt</div>
            <div className="text-title-sm font-extrabold text-text">{pendingCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
            <Building size={20} />
          </div>
          <div>
            <div className="text-caption text-text-muted">Chi nhánh</div>
            <div className="text-title-sm font-extrabold text-text">{branches.length || 1}</div>
          </div>
        </div>
      </div>

      {/* 4. Bộ lọc */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            placeholder="Tìm theo tên, email, vai trò..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
      </div>

      {/* 5. Thông báo lỗi */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-caption bg-warning-bg text-warning border border-warning/30 rounded-xl">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 6. Danh sách thành viên */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <MemberTable
          members={filteredMembers}
          branchMap={branchMap}
          loading={loading}
          searchQuery={searchQuery}
          canManageRole={canManageRole}
          canResetPassword={can("A7")}
          canToggleActive={can("A5")}
          currentUserId={currentUserId}
          onChanged={() => void fetchData()}
          onSelectMember={setChangeRoleTarget}
        />
      </div>

      {/* Modals */}
      <AddStaffDialog open={inviteOpen} onOpenChange={setInviteOpen} roles={roles} onSuccess={() => void fetchData()} />

      <ChangeRoleDialog
        open={changeRoleTarget !== null}
        onOpenChange={(open) => !open && setChangeRoleTarget(null)}
        member={changeRoleTarget}
        roles={roles}
        canRemove={canRemove}
        onSuccess={() => void fetchData()}
      />
    </div>
  )
}
