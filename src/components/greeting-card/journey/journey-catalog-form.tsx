"use client"

import React, { useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"

/** Form tạo bộ sưu tập mới ngay trong wizard (mã tự sinh nếu để trống). */
export function JourneyCatalogForm({
  canCancel,
  onCancel,
  onCreated,
  onError,
}: {
  canCancel: boolean
  onCancel: () => void
  onCreated: (catalogId: string) => void
  onError: (message: string | null) => void
}) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await apiSend<{ data?: { id: string } }>(
        "/api/v1/greeting-card/catalogs",
        "POST",
        { name: name.trim(), code: code.trim() || `cat-${Date.now().toString(36)}`, type: "STANDARD" },
        "Không tạo được bộ sưu tập"
      )
      onError(null)
      if (res.data?.id) onCreated(res.data.id)
    } catch (err) {
      onError(err instanceof Error ? err.message : "Không tạo được bộ sưu tập")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-5 rounded-2xl bg-surface-muted border border-border">
      <div className="flex items-center justify-between">
        <h4 className="text-body font-extrabold text-foreground">Tạo Bộ Sưu Tập Hoa Mới</h4>
        {canCancel && (
          <button type="button" onClick={onCancel} className="text-body-sm text-text-muted hover:text-foreground">
            Quay lại chọn danh sách
          </button>
        )}
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-caption font-bold text-foreground">Tên Bộ Sưu Tập *</span>
        <input
          type="text"
          placeholder="VD: Mẫu Hoa Chúc Mừng 20/10, Hoa Tươi Sinh Nhật..."
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-body text-foreground"
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-caption font-bold text-foreground">Mã định danh (không bắt buộc)</span>
        <input
          type="text"
          placeholder="VD: 20-10-basic (tự sinh nếu để trống)"
          value={code}
          maxLength={40}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-body text-foreground"
        />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        {canCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="h-10">Hủy</Button>
        )}
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-dark text-white font-bold h-10 px-5 text-body-sm shadow-sm transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Plus size={16} className="mr-1.5" />}
          <span>Lưu & Chọn Ngay</span>
        </button>
      </div>
    </form>
  )
}
