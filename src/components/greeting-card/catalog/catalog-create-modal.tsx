"use client"

import React, { useState } from "react"
import { Check, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"

type CreateForm = { code: string; name: string; type: "STANDARD" | "CLIENT"; description: string }

/** Hộp thoại tạo bộ sưu tập mới (mã trùng → báo lỗi 409 từ server). */
export function CatalogCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [createForm, setCreateForm] = useState<CreateForm>({ code: "", name: "", type: "STANDARD", description: "" })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.code.trim() || !createForm.name.trim()) return
    setCreating(true)
    setError(null)
    try {
      await apiSend(
        "/api/v1/greeting-card/catalogs",
        "POST",
        {
          code: createForm.code.trim(),
          name: createForm.name.trim(),
          type: createForm.type,
          description: createForm.description.trim() || null,
        },
        "Không tạo được bộ sưu tập"
      )
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được bộ sưu tập")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-title-sm font-extrabold text-foreground">Tạo Bộ Sưu Tập Mới</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng form tạo bộ sưu tập"
            className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
          {error && <p role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-body-sm">{error}</p>}
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
            <Button type="button" variant="outline" onClick={onClose} className="h-10">
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
  )
}
