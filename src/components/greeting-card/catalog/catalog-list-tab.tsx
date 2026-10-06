"use client"

import React, { useState } from "react"
import {
  BookOpen, Plus, Edit2, Trash2, Eye, Package,
  RefreshCw, ChevronRight, Check, Loader2, Copy, ExternalLink, Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrochurePreviewModal } from "@/components/greeting-card/customer/brochure-preview-modal"
import { readApiError } from "@/components/greeting-card/api-error"
import { CATALOG_CHANNELS, withChannel } from "@/modules/greeting-card/domain/catalog-channel"
import { useApi } from "@/components/greeting-card/greeting-api"
import { CatalogCreateModal } from "./catalog-create-modal"

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
  const list = useApi<{ data: CatalogItem[] }>("/api/v1/greeting-card/catalogs")
  const catalogs = list.data?.data ?? []
  const loading = list.isLoading || list.isValidating
  const loadCatalogs = () => list.mutate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  function copyPublicLink(catalog: CatalogItem) {
    const url = withChannel(buildPublicUrl(catalog), shareChannel)
    void navigator.clipboard.writeText(url)
    setCopiedCatalogId(catalog.id)
    setTimeout(() => setCopiedCatalogId(null), 2000)
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
        <span className="text-caption">— để biết khách đến từ đâu trong mục Hiệu quả theo kênh.</span>
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
                  title={`Sao chép: ${withChannel(buildPublicUrl(catalog), shareChannel)}`}
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
                <a
                  href={`/api/v1/greeting-card/catalogs/${catalog.id}/collage`}
                  download
                  title="Tải ảnh catalog để đăng lên Zalo/Facebook"
                  aria-label={`Tải ảnh catalog ${catalog.name}`}
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-muted transition-colors text-text-muted hover:text-foreground inline-flex items-center"
                >
                  <Download size={14} />
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
