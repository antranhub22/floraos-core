"use client"

import React, { useState } from "react"
import { CopyPlus, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiGet, apiSend } from "@/components/greeting-card/greeting-api"
import type { CatalogOption } from "./journey-types"

/** Nhân bản bộ sưu tập sang một link dùng chung mới (cùng các mẫu hoa, khác slug/kênh). */
export function JourneyCloneModal({
  source,
  itemCount,
  orgSlug,
  onClose,
  onCloned,
}: {
  source: CatalogOption
  itemCount: number
  orgSlug: string
  onClose: () => void
  onCloned: (catalogId: string, itemCount: number) => void
}) {
  const [name, setName] = useState(`${source.name} - Kênh 2`)
  const [code, setCode] = useState(`${source.code || "bst"}-kenh2`)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const detail = await apiGet<{ data?: { items?: Array<{ product: { id: string } }> } }>(
        `/api/v1/greeting-card/catalogs/${source.id}`
      )
      const productIds = detail.data?.items?.map((i) => i.product.id) ?? []
      const created = await apiSend<{ data?: { id: string } }>(
        "/api/v1/greeting-card/catalogs",
        "POST",
        { name: name.trim() || `${source.name} (Link mới)`, code: code.toLowerCase().trim(), type: "STANDARD", productIds },
        "Không nhân bản được bộ sưu tập"
      )
      if (created.data?.id) onCloned(created.data.id, productIds.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không nhân bản được bộ sưu tập")
    } finally {
      setLoading(false)
    }
  }

  const slugPrefix = orgSlug ? `/bst/${orgSlug}/` : "/bst/…/"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" role="dialog" aria-modal="true" aria-labelledby="clone-title">
      <form onSubmit={submit} className="bg-surface rounded-2xl border border-border p-6 shadow-2xl max-w-md w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 id="clone-title" className="text-title-sm font-extrabold text-foreground flex items-center gap-2">
            <CopyPlus size={18} className="text-primary" />
            <span>Tạo thêm link dùng chung mới</span>
          </h4>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-foreground text-caption">Đóng</button>
        </div>
        <p className="text-body-sm text-text-muted">
          Tất cả <strong>{itemCount} mẫu hoa</strong> trong bộ sưu tập hiện tại sẽ được tự động nhân bản sang link mới. Bạn có thể đặt mã slug link riêng (ví dụ:{" "}
          <code className="text-primary font-bold">20-10-fanpage</code>, <code className="text-primary font-bold">20-10-zalo</code>...).
        </p>
        {error && <p role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-body-sm">{error}</p>}
        <label className="flex flex-col gap-1">
          <span className="text-caption font-bold text-foreground">Tên Bộ Sưu Tập / Kênh *</span>
          <input
            type="text"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: 20/10 - Kênh Zalo"
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-body text-foreground"
            required
          />
        </label>
        <div className="flex flex-col gap-1">
          <label htmlFor="clone-code" className="text-caption font-bold text-foreground">Đoạn mã link (Slug URL) *</label>
          <div className="flex items-center rounded-xl border border-border bg-background px-3 h-10">
            <span className="text-caption text-text-muted font-mono mr-1">{slugPrefix}</span>
            <input
              id="clone-code"
              type="text"
              value={code}
              maxLength={40}
              onChange={(e) => setCode(e.target.value)}
              placeholder="20-10-kenh2"
              className="flex-1 bg-transparent text-body font-mono text-foreground focus:outline-none"
              required
            />
          </div>
          <p className="text-caption text-text-muted">
            Link sẽ có dạng: <strong className="text-foreground">{slugPrefix}{code.toLowerCase().trim() || "..."}</strong>
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} className="h-10">Hủy</Button>
          <Button type="submit" disabled={loading || !code.trim()} className="bg-primary hover:bg-primary-dark text-white font-bold h-10 px-4">
            {loading ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Plus size={16} className="mr-1.5" />}
            <span>Tạo Link Ngay</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
