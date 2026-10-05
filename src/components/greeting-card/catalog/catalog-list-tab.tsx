"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  BookOpen, Plus, Edit2, Trash2, Eye, Package,
  RefreshCw, ChevronRight, Check, X, Loader2, Copy, ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrochurePreviewModal } from "@/components/greeting-card/customer/brochure-preview-modal"
import { readApiError } from "@/components/greeting-card/api-error"

type CatalogItem = {
  id: string
  code: string
  name: string
  type: "STANDARD" | "CLIENT"
  description: string | null
  is_active: boolean
  created_at: string
  _count: { items: number; sessions: number }
}

type Props = {
  onSelectCatalog: (catalog: CatalogItem) => void
}

export function CatalogListTab({ onSelectCatalog }: Props) {
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>("")
  const [createForm, setCreateForm] = useState({
    code: "",
    name: "",
    type: "STANDARD" as "STANDARD" | "CLIENT",
    description: "",
  })
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [copiedCatalogId, setCopiedCatalogId] = useState<string | null>(null)
  const [orgSlug, setOrgSlug] = useState<string | null>(null)

  // Lấy slug tổ chức để xây dựng URL thân thiện
  useEffect(() => {
    fetch("/api/v1/organizations/current")
      .then((r) => r.json())
      .then((res: { slug?: string }) => {
        if (res.slug) setOrgSlug(res.slug)
      })
      .catch(() => {})
  }, [])

  function buildPublicUrl(catalog: CatalogItem) {
    if (orgSlug && catalog.code) {
      return `${window.location.origin}/bst/${orgSlug}/${catalog.code}`
    }
    return `${window.location.origin}/g/${catalog.id}`
  }

  function copyPublicLink(catalog: CatalogItem) {
    const url = buildPublicUrl(catalog)
    void navigator.clipboard.writeText(url)
    setCopiedCatalogId(catalog.id)
    setTimeout(() => setCopiedCatalogId(null), 2000)
  }

  const loadCatalogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/greeting-card/catalogs")
      if (!res.ok) return
      const json = await res.json() as { data: CatalogItem[] }
      setCatalogs(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadCatalogs() }, [loadCatalogs])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.code.trim() || !createForm.name.trim()) return
    setCreating(true)
    setActionError(null)
    try {
      const res = await fetch("/api/v1/greeting-card/catalogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: createForm.code.trim(),
          name: createForm.name.trim(),
          type: createForm.type,
          description: createForm.description.trim() || null,
        }),
      })
      if (res.ok) {
        setIsCreateOpen(false)
        setCreateForm({ code: "", name: "", type: "STANDARD", description: "" })
        await loadCatalogs()
      } else {
        setActionError(await readApiError(res, "Không tạo được bộ sưu tập"))
      }
    } catch {
      setActionError("Mất kết nối mạng, vui lòng thử lại")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Ẩn catalog này? Các link đã gửi vẫn còn hoạt động.")) return
    setDeletingId(id)
    setActionError(null)
    try {
      const res = await fetch(`/api/v1/greeting-card/catalogs/${id}`, { method: "DELETE" })
      if (!res.ok) setActionError(await readApiError(res, "Không ẩn được bộ sưu tập"))
      await loadCatalogs()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {actionError && (
        <div role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-body-sm font-medium">
          {actionError}
        </div>
      )}
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
            onClick={loadCatalogs}
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

      {/* Create Form Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-title-sm font-extrabold text-foreground">Tạo Bộ Sưu Tập Mới</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Đóng form tạo bộ sưu tập"
                className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-caption font-bold text-foreground mb-1">Mã nhận dạng *</label>
                <input
                  type="text"
                  placeholder="VD: 20-10-basic, valentine-2027"
                  value={createForm.code}
                  onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-caption font-bold text-foreground mb-1">Tên bộ sưu tập *</label>
                <input
                  type="text"
                  placeholder="VD: Bộ Hoa 20/10 Phổ Thông"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-caption font-bold text-foreground mb-1">Loại</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as "STANDARD" | "CLIENT" }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground"
                >
                  <option value="STANDARD">Tiêu chuẩn (dùng chung)</option>
                  <option value="CLIENT">Riêng theo khách</option>
                </select>
              </div>
              <div>
                <label className="block text-caption font-bold text-foreground mb-1">Mô tả (không bắt buộc)</label>
                <textarea
                  placeholder="Ghi chú nội bộ về bộ sưu tập này..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-body text-foreground resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="h-10">
                  Hủy
                </Button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-dark text-white font-bold h-10 px-5 gap-1.5 text-body-sm shadow-sm transition-colors disabled:opacity-50"
                >
                  {creating ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {creating ? "Đang tạo..." : "Tạo ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
          {catalogs.map((catalog) => (
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
                    {orgSlug ? (
                      <span className="text-primary">/bst/{orgSlug}/{catalog.code}</span>
                    ) : (
                      <span>{catalog.code}</span>
                    )}
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
                  onClick={() => copyPublicLink(catalog)}
                  title={`Sao chép: ${buildPublicUrl(catalog)}`}
                  aria-label={`Sao chép link công khai của ${catalog.name}`}
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-muted transition-colors text-text-muted hover:text-foreground"
                >
                  {copiedCatalogId === catalog.id ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </button>
                <a
                  href={buildPublicUrl(catalog)}
                  target="_blank"
                  rel="noreferrer"
                  title="Mở trong tab mới"
                  aria-label={`Mở link công khai của ${catalog.name}`}
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-muted transition-colors text-text-muted hover:text-foreground inline-flex items-center"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => void handleDelete(catalog.id)}
                  disabled={deletingId === catalog.id}
                  aria-label={`Ẩn catalog ${catalog.name}`}
                  className="p-1.5 rounded-lg border border-border hover:bg-danger-bg hover:border-danger/40 hover:text-danger transition-colors text-text-muted"
                >
                  {deletingId === catalog.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Trash2 size={14} />}
                </button>
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
          ))}
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
