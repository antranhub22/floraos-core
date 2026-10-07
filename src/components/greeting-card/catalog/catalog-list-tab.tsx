"use client"

import React, { useState } from "react"
import {
  BookOpen, Plus, Edit2, Trash2, Eye, Package,
  RefreshCw, ChevronRight, Check, Loader2, Copy, Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrochurePreviewModal } from "@/components/greeting-card/customer/brochure-preview-modal"
import { readApiError } from "@/components/greeting-card/api-error"
import { CATALOG_CHANNELS } from "@/modules/greeting-card/domain/catalog-channel"
import { copyFromServer, createShareUrl } from "@/components/greeting-card/share/tracked-copy"
import { useApi } from "@/components/greeting-card/greeting-api"
import { CatalogCreateModal } from "./catalog-create-modal"

import { useSession } from "@/lib/session"
import { Archive, RotateCcw, Filter, User } from "lucide-react"

type CatalogItem = {
  id: string
  code: string
  name: string
  type: "STANDARD" | "CLIENT"
  description: string | null
  is_active: boolean
  created_by: string
  created_at: string
  _count: { items: number; sessions: number }
}

type Props = {
  onSelectCatalog: (catalog: CatalogItem) => void
}

export function CatalogListTab({ onSelectCatalog }: Props) {
  const { can, userInitials } = useSession()
  const me = useApi<{ user: { id: string; name: string | null } }>("/api/v1/auth/me")
  const currentUserId = me.data?.user.id ?? null
  const isOperator = can("F2") || can("R6") || can("R10")

  // Bộ lọc cho Điều hành và nhân sự
  const [staffFilter, setStaffFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<"active" | "archived">("active")
  const [daysFilter, setDaysFilter] = useState<"3" | "all">("all")

  // URL query
  const queryParams = new URLSearchParams()
  if (statusFilter === "archived") queryParams.set("status", "archived")
  if (staffFilter) queryParams.set("created_by", staffFilter)
  if (daysFilter === "3") queryParams.set("days", "3")
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""

  const list = useApi<{ data: CatalogItem[] }>(`/api/v1/greeting-card/catalogs${queryString}`)
  const catalogs = list.data?.data ?? []
  const loading = list.isLoading || list.isValidating
  const loadCatalogs = () => list.mutate()

  // Danh sách nhân sự để Điều hành chọn lọc theo từng người
  const staffApi = useApi<{ data: { members: Array<{ userId: string; name: string }> } }>(
    isOperator ? "/api/v1/greeting-card/messages/recipients" : null
  )
  const staffList = staffApi.data?.data.members ?? []

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [copiedCatalogId, setCopiedCatalogId] = useState<string | null>(null)
  const [shareChannel, setShareChannel] = useState("")
  // Slug tổ chức để dựng URL thân thiện; chưa có → dùng link /g/{id}
  const org = useApi<{ slug?: string }>("/api/v1/organizations/current")
  const orgSlug = org.data?.slug ?? null

  function buildPublicUrl(catalog: CatalogItem) {
    if (orgSlug && catalog.code) {
      return `${window.location.origin}/bst/${orgSlug}/${catalog.code}`
    }
    return `${window.location.origin}/g/${catalog.id}`
  }

  // Mỗi lần sao chép = một link mang tên người bấm (theo dõi từ lúc khách mở tới khi xong đơn)
  async function copyPublicLink(catalog: CatalogItem) {
    setActionError(null)
    try {
      await copyFromServer(() => createShareUrl(catalog.id, shareChannel))
      setCopiedCatalogId(catalog.id)
      setTimeout(() => setCopiedCatalogId(null), 2000)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Không sao chép được link")
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Xóa (ẩn) bộ sưu tập này? Các link đã gửi vẫn còn hoạt động và Điều hành có thể khôi phục trong vòng 3 ngày.")) return
    setDeletingId(id)
    setActionError(null)
    try {
      const res = await fetch(`/api/v1/greeting-card/catalogs/${id}`, { method: "DELETE" })
      if (!res.ok) setActionError(await readApiError(res, "Không xóa được bộ sưu tập"))
      await loadCatalogs()
    } finally {
      setDeletingId(null)
    }
  }

  async function handleRestore(id: string) {
    setRestoringId(id)
    setActionError(null)
    try {
      const res = await fetch(`/api/v1/greeting-card/catalogs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      })
      if (!res.ok) setActionError(await readApiError(res, "Không khôi phục được bộ sưu tập"))
      await loadCatalogs()
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {actionError && (
        <div role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-body-sm font-medium">
          {actionError}
        </div>
      )}
      <label className="flex flex-wrap items-center gap-2 text-body-sm text-text-muted">
        Link sao chép dùng cho kênh
        <select
          value={shareChannel}
          onChange={(e) => setShareChannel(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface px-2 text-body-sm text-foreground"
        >
          <option value="">Không ghi kênh</option>
          {CATALOG_CHANNELS.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        <span className="text-caption">— link sao chép luôn mang tên bạn; khách mở link được tính cho bạn.</span>
      </label>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-title font-extrabold text-foreground flex items-center gap-2">
            <BookOpen size={20} />
            <span>Quản lý Bộ sưu tập Thẻ Chào</span>
          </h2>
          <p className="text-body-sm text-text-muted mt-1">
            Tạo và chỉnh sửa các bộ sưu tập mẫu hoa để gửi cho khách hàng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadCatalogs()}
            className="gap-1.5 text-caption h-9"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white font-bold gap-1.5 text-body-sm h-9 shadow-sm"
          >
            <Plus size={16} />
            <span>Tạo Bộ Sưu Tập</span>
          </Button>
        </div>
      </div>

      {/* Thanh bộ lọc Quản lý: Lọc trạng thái Đang dùng / Đã xóa (lưu 3 ngày) & Lọc theo từng nhân sự */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-muted/40 p-3.5 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-sm font-semibold text-foreground flex items-center gap-1.5">
            <Filter size={15} className="text-primary" />
            <span>Xem:</span>
          </span>
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 text-caption font-bold rounded-md transition-colors ${
                statusFilter === "active" ? "bg-primary text-white shadow-xs" : "text-text-muted hover:text-foreground"
              }`}
            >
              Đang hoạt động
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("archived")}
              className={`px-3 py-1 text-caption font-bold rounded-md transition-colors flex items-center gap-1 ${
                statusFilter === "archived" ? "bg-danger-bg text-danger shadow-xs" : "text-text-muted hover:text-foreground"
              }`}
            >
              <Archive size={12} />
              <span>Đã xóa (Lưu 3 ngày)</span>
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 ml-1">
            <button
              type="button"
              onClick={() => setDaysFilter("all")}
              className={`px-2.5 py-1 text-caption font-semibold rounded-md transition-colors ${
                daysFilter === "all" ? "bg-surface-muted text-foreground font-bold" : "text-text-muted hover:text-foreground"
              }`}
            >
              Tất cả thời gian
            </button>
            <button
              type="button"
              onClick={() => setDaysFilter("3")}
              className={`px-2.5 py-1 text-caption font-semibold rounded-md transition-colors ${
                daysFilter === "3" ? "bg-surface-muted text-foreground font-bold" : "text-text-muted hover:text-foreground"
              }`}
            >
              Trong 3 ngày qua
            </button>
          </div>
        </div>

        {/* Lọc theo từng nhân sự dành cho Điều hành */}
        {isOperator && staffList.length > 0 && (
          <div className="flex items-center gap-2 text-body-sm text-text-muted ml-auto">
            <User size={14} className="text-text-muted" />
            <span>Nhân sự:</span>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="h-8 rounded-lg border border-border bg-surface px-2.5 text-body-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Tất cả nhân sự</option>
              {staffList.map((s) => (
                <option key={s.userId} value={s.userId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CatalogCreateModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false)
            void loadCatalogs()
          }}
        />
      )}

      {/* Catalog Grid */}
      {loading && catalogs.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 size={24} className="animate-spin mr-2" />
          <span className="text-body-sm">Đang tải danh sách...</span>
        </div>
      ) : catalogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
            <BookOpen size={28} className="text-text-muted" />
          </div>
          <div className="text-center">
            <p className="text-title-sm font-bold text-foreground">Chưa có bộ sưu tập nào</p>
            <p className="text-body-sm text-text-muted mt-1">
              Tạo bộ sưu tập đầu tiên để bắt đầu gửi Thẻ Chào cho khách
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 mt-2"
          >
            <Plus size={16} />
            Tạo Bộ Sưu Tập Đầu Tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogs.map((catalog) => {
            const canDelete = isOperator || (Boolean(currentUserId) && catalog.created_by === currentUserId)
            const canRestore = isOperator || (Boolean(currentUserId) && catalog.created_by === currentUserId)

            return (
              <div
                key={catalog.id}
                className="bg-surface rounded-2xl border border-border p-5 flex flex-col gap-4 hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-caption font-bold uppercase">
                      {catalog.type === "STANDARD" ? "Tiêu chuẩn" : "Riêng khách"}
                    </span>
                    {!catalog.is_active && (
                      <span className="px-2 py-0.5 rounded-full bg-danger-bg text-danger text-caption font-bold">
                        Đã ẩn
                      </span>
                    )}
                  </div>
                  <h3 className="text-body font-extrabold text-foreground truncate">{catalog.name}</h3>
                  <p className="text-caption text-text-muted font-mono mt-0.5">
                    <span>{catalog.code}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-caption text-text-muted">
                  <Package size={13} />
                  <span>
                    <strong className="text-foreground">{catalog._count.items}</strong> mẫu hoa
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-caption text-text-muted">
                  <Eye size={13} />
                  <span>
                    <strong className="text-foreground">{catalog._count.sessions}</strong> link đã gửi
                  </span>
                </div>
              </div>

              {catalog.description && (
                <p className="text-caption text-text-muted line-clamp-2 border-t border-border pt-3">
                  {catalog.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectCatalog(catalog)}
                  className="flex-1 text-caption gap-1.5 h-8"
                >
                  <Edit2 size={12} />
                  <span>Quản lý mẫu hoa</span>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    const url = buildPublicUrl(catalog)
                    setPreviewUrl(url)
                    setPreviewTitle(`Xem trước: ${catalog.name} (${orgSlug}/${catalog.code})`)
                  }}
                  title="Xem trước giao diện thẻ chào khách hàng"
                  aria-label={`Xem trước link công khai của ${catalog.name}`}
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-muted transition-colors text-text-muted hover:text-foreground inline-flex items-center"
                >
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => void copyPublicLink(catalog)}
                  title="Sao chép link mang tên bạn — khách mở link này được tính cho bạn"
                  aria-label={`Sao chép link bộ sưu tập ${catalog.name} mang tên bạn`}
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-muted transition-colors text-text-muted hover:text-foreground"
                >
                  {copiedCatalogId === catalog.id ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </button>
                <a
                  href={`/api/v1/greeting-card/catalogs/${catalog.id}/collage`}
                  download
                  title="Tải ảnh catalog để đăng lên Zalo/Facebook"
                  aria-label={`Tải ảnh catalog ${catalog.name}`}
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-muted transition-colors text-text-muted hover:text-foreground inline-flex items-center"
                >
                  <Download size={14} />
                </a>
                {catalog.is_active ? (
                  canDelete && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(catalog.id)}
                      disabled={deletingId === catalog.id}
                      aria-label={`Xóa bộ sưu tập ${catalog.name}`}
                      title="Xóa bộ sưu tập (Lưu trữ 3 ngày)"
                      className="p-1.5 rounded-lg border border-border hover:bg-danger-bg hover:border-danger/40 hover:text-danger transition-colors text-text-muted"
                    >
                      {deletingId === catalog.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  )
                ) : (
                  canRestore && (
                    <button
                      type="button"
                      onClick={() => void handleRestore(catalog.id)}
                      disabled={restoringId === catalog.id}
                      aria-label={`Khôi phục bộ sưu tập ${catalog.name}`}
                      title="Khôi phục bộ sưu tập này"
                      className="p-1.5 rounded-lg border border-success/40 bg-success-bg text-success hover:bg-success hover:text-white transition-colors"
                    >
                      {restoringId === catalog.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RotateCcw size={14} />
                      )}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => onSelectCatalog(catalog)}
                  aria-label={`Mở chi tiết catalog ${catalog.name}`}
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-muted transition-colors text-text-muted"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Live Preview Modal */}
      {previewUrl && (
        <BrochurePreviewModal
          url={previewUrl}
          title={previewTitle}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </div>
  )
}
