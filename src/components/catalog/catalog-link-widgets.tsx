"use client"

import React, { useState } from "react"
import {
  QrCode,
  ExternalLink,
  Copy,
  Check,
  Ban,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { generateQRCodeDataUrl, triggerDownload } from "@/core/media/qr-engine"
import { ShareCatalogModal } from "./share-catalog-modal"

export interface CatalogLinkItem {
  slug: string
  name: string
  description: string | null
  filters: Record<string, unknown> | null
  is_revoked?: boolean
  revoked_at: string | null
  created_at: string
}

interface PublishedCatalogLinksProps {
  catalogLinks: CatalogLinkItem[]
  onRefresh: () => void
}

export function PublishedCatalogLinks({ catalogLinks, onRefresh }: PublishedCatalogLinksProps) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [downloadingQR, setDownloadingQR] = useState<string | null>(null)
  const [sharingLink, setSharingLink] = useState<CatalogLinkItem | null>(null)

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const handleDownloadQR = async (slug: string) => {
    setDownloadingQR(slug)
    try {
      const url = `${window.location.origin}/c/${slug}`
      const dataUrl = await generateQRCodeDataUrl(url, { width: 500, margin: 3 })
      triggerDownload(dataUrl, `QR-Catalog-${slug}.png`)
    } catch (err) {
      console.error("Lỗi sinh QR:", err)
    } finally {
      setDownloadingQR(null)
    }
  }

  const handleRevoke = async (slug: string) => {
    if (!confirm(`Thu hồi link catalog "${slug}"? Khách hàng sẽ không thể xem danh mục này nữa.`)) return
    try {
      const res = await fetch(`/api/v1/catalog-links/${slug}/revoke`, { method: "POST" })
      if (!res.ok) throw new Error("Thu hồi thất bại")
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi khi thu hồi link")
    }
  }

  return (
    <div className="border-t border-border pt-6">
      <h3 className="text-sm font-bold text-text mb-3">
        Danh sách Catalog đã xuất bản ({catalogLinks.length})
      </h3>
      {catalogLinks.length === 0 ? (
        <div className="p-8 text-center bg-surface rounded-2xl border border-dashed text-text-muted text-xs">
          Chưa có catalog nào được xuất bản. Hãy chọn mẫu hoa và bấm &quot;Xuất bản Catalog mới&quot; ở trên.
        </div>
      ) : (
        <div className="space-y-2.5">
          {catalogLinks.map((link) => {
            const isRevoked = Boolean(link.is_revoked || link.revoked_at)
            return (
              <div
                key={link.slug}
                className="p-4 rounded-2xl bg-white border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text truncate">{link.name}</span>
                    {isRevoked ? (
                      <Badge tone="danger">Đã thu hồi</Badge>
                    ) : (
                      <Badge tone="success">Đang mở</Badge>
                    )}
                  </div>
                  <div className="text-xs text-text-muted mt-1 flex flex-wrap items-center gap-2">
                    <span>Đường dẫn: <code>/c/{link.slug}</code></span>
                    <span>· Tạo: {new Date(link.created_at).toLocaleDateString("vi-VN")}</span>
                    {link.description && <span>· {link.description}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isRevoked && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/c/${link.slug}`, "_blank")} className="h-8 gap-1 text-xs">
                        <ExternalLink size={13} /> Xem trước
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSharingLink(link)} className="h-8 gap-1 text-xs text-rose-600 font-bold hover:bg-rose-50">
                        <Share2 size={13} /> Chia sẻ MXH
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleCopyLink(link.slug)} className="h-8 gap-1 text-xs">
                        {copiedSlug === link.slug ? (
                          <><Check size={13} className="text-emerald-600" /><span className="text-emerald-600">Đã chép</span></>
                        ) : (
                          <><Copy size={13} /> Copy link</>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadQR(link.slug)} disabled={downloadingQR === link.slug} className="h-8 gap-1 text-xs text-primary">
                        <QrCode size={13} /> {downloadingQR === link.slug ? "Đang tạo..." : "Tải QR"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRevoke(link.slug)} className="h-8 gap-1 text-xs text-destructive hover:text-destructive">
                        <Ban size={13} /> Thu hồi
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {sharingLink && (
        <ShareCatalogModal
          slug={sharingLink.slug}
          name={sharingLink.name}
          description={sharingLink.description}
          onClose={() => setSharingLink(null)}
        />
      )}
    </div>
  )
}

/* ── Modal Xuất bản Catalog mới ────────────────────────────────────── */

interface CreateCatalogModalProps {
  selectedIds: string[]
  onClose: () => void
  onCreated: () => void
}

export function CreateCatalogModal({ selectedIds, onClose, onCreated }: CreateCatalogModalProps) {
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + `-${Math.random().toString(36).substring(2, 6)}`

      const res = await fetch("/api/v1/catalog-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          description: desc.trim() || null,
          filters: selectedIds.length > 0 ? { product_ids: selectedIds } : null,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Tạo catalog thất bại")
      }
      onCreated()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi khi tạo catalog")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text">Xuất bản Catalog số mới</h3>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text text-sm font-bold">✕</button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1.5">Tên Catalog / Bộ sưu tập *</label>
          <Input required placeholder="VD: Mẫu Hoa Khai Trương 2026" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1.5">Mô tả ngắn</label>
          <textarea rows={3} placeholder="Lời tựa giới thiệu…" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-xl border border-border p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div className="p-3.5 rounded-2xl bg-surface border text-xs text-text-muted">
          {selectedIds.length > 0
            ? <span>Đang chọn <strong>{selectedIds.length}</strong> mẫu hoa cho catalog này.</span>
            : <span>Tất cả mẫu hoa đang hoạt động sẽ tự động hiển thị.</span>}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Hủy bỏ</Button>
          <Button type="submit" disabled={isSubmitting || !name.trim()} className="bg-primary text-white">
            {isSubmitting ? "Đang tạo…" : "Xác nhận xuất bản"}
          </Button>
        </div>
      </form>
    </div>
  )
}
